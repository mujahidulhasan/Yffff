"""Download execution using yt-dlp with server-side FFmpeg post-processing."""
from __future__ import annotations

import os
from typing import Any, Callable, Dict

import yt_dlp

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.schemas import AudioFormat, DownloadKind, DownloadRequest

logger = get_logger(__name__)

ProgressHook = Callable[[Dict[str, Any]], None]


class DownloadFailedError(Exception):
    """Raised when a download fails after retries."""


def _format_selector(req: DownloadRequest) -> str:
    if req.format_id:
        # Merge selected video format with best audio when needed.
        return f"{req.format_id}+bestaudio/{req.format_id}/best"
    if req.kind in (DownloadKind.BEST, DownloadKind.VIDEO, DownloadKind.PLAYLIST):
        return "bestvideo*+bestaudio/best"
    if req.kind == DownloadKind.AUDIO:
        return "bestaudio/best"
    return "best"


def _build_opts(req: DownloadRequest, out_dir: str, hook: ProgressHook) -> Dict[str, Any]:
    settings = get_settings()
    outtmpl = os.path.join(out_dir, "%(title).80s.%(ext)s")
    opts: Dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "outtmpl": outtmpl,
        "retries": settings.download_retries,
        "fragment_retries": settings.download_retries,
        "socket_timeout": 30,
        "progress_hooks": [hook],
        "postprocessor_hooks": [hook],
        "noplaylist": req.kind != DownloadKind.PLAYLIST,
        "max_filesize": settings.max_filesize_mb * 1024 * 1024,
        "merge_output_format": "mp4",
    }

    if req.kind == DownloadKind.AUDIO:
        codec = req.audio_format.value
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": "192" if codec != AudioFormat.WAV.value else "0",
            }
        ]
    elif req.kind == DownloadKind.THUMBNAIL:
        opts["skip_download"] = True
        opts["writethumbnail"] = True
    elif req.kind == DownloadKind.SUBTITLE:
        opts["skip_download"] = True
        opts["writesubtitles"] = True
        opts["writeautomaticsub"] = True
        if req.subtitle_lang:
            opts["subtitleslangs"] = [req.subtitle_lang]
        else:
            opts["subtitleslangs"] = ["all"]
    else:
        opts["format"] = _format_selector(req)

    return opts


def _find_output_file(out_dir: str) -> str | None:
    candidates = []
    for root, _dirs, files in os.walk(out_dir):
        for name in files:
            full = os.path.join(root, name)
            candidates.append((os.path.getmtime(full), full))
    if not candidates:
        return None
    candidates.sort(reverse=True)
    return candidates[0][1]


def run_download(req: DownloadRequest, out_dir: str, hook: ProgressHook) -> str:
    """Run a blocking download. Returns the path to the resulting file."""
    os.makedirs(out_dir, exist_ok=True)
    opts = _build_opts(req, out_dir, hook)
    logger.info("Starting download kind=%s url=%s", req.kind, req.url)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([str(req.url)])
    except yt_dlp.utils.DownloadError as exc:
        raise DownloadFailedError(str(exc)) from exc

    output = _find_output_file(out_dir)
    if not output:
        raise DownloadFailedError("Download produced no output file.")
    return output
