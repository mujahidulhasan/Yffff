"""yt-dlp based extraction service.

Uses yt-dlp's automatic extractor detection so every site supported by
yt-dlp is supported here without hardcoding platforms.
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List

import yt_dlp

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.schemas import ExtractResponse, FormatInfo, Metadata

logger = get_logger(__name__)


class ExtractionError(Exception):
    """Raised when extraction fails after retries."""


class UnsupportedURLError(Exception):
    """Raised when no yt-dlp extractor matches the URL."""


def _base_opts() -> Dict[str, Any]:
    return {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": False,
        "skip_download": True,
        "socket_timeout": 30,
        "retries": get_settings().extract_retries,
        "extractor_retries": get_settings().extract_retries,
    }


def _format_to_info(fmt: Dict[str, Any]) -> FormatInfo:
    vcodec = fmt.get("vcodec")
    acodec = fmt.get("acodec")
    has_video = bool(vcodec) and vcodec != "none"
    has_audio = bool(acodec) and acodec != "none"
    return FormatInfo(
        format_id=str(fmt.get("format_id", "")),
        ext=fmt.get("ext"),
        resolution=fmt.get("resolution") or _resolution_from(fmt),
        fps=fmt.get("fps"),
        vcodec=vcodec,
        acodec=acodec,
        filesize=fmt.get("filesize"),
        filesize_approx=fmt.get("filesize_approx"),
        tbr=fmt.get("tbr"),
        abr=fmt.get("abr"),
        vbr=fmt.get("vbr"),
        has_video=has_video,
        has_audio=has_audio,
        note=fmt.get("format_note"),
    )


def _resolution_from(fmt: Dict[str, Any]) -> str | None:
    width = fmt.get("width")
    height = fmt.get("height")
    if width and height:
        return f"{width}x{height}"
    if height:
        return f"{height}p"
    return None


def _build_response(info: Dict[str, Any]) -> ExtractResponse:
    is_playlist = info.get("_type") == "playlist" or "entries" in info
    entries = info.get("entries") or []

    if is_playlist:
        first = next((e for e in entries if e), {}) or {}
        meta = Metadata(
            id=str(info.get("id", first.get("id", "playlist"))),
            title=info.get("title") or first.get("title") or "Playlist",
            thumbnail=first.get("thumbnail"),
            duration=first.get("duration"),
            uploader=info.get("uploader") or first.get("uploader"),
            upload_date=first.get("upload_date"),
            view_count=first.get("view_count"),
            platform=info.get("extractor_key") or first.get("extractor_key"),
            webpage_url=info.get("webpage_url"),
            is_playlist=True,
            playlist_count=len([e for e in entries if e]),
        )
        return ExtractResponse(metadata=meta, formats=[], subtitles=[])

    raw_formats = info.get("formats") or []
    formats = [_format_to_info(f) for f in raw_formats if f.get("format_id")]
    subtitles = sorted(set((info.get("subtitles") or {}).keys()))

    meta = Metadata(
        id=str(info.get("id", "")),
        title=info.get("title") or "Untitled",
        thumbnail=info.get("thumbnail"),
        duration=info.get("duration"),
        uploader=info.get("uploader"),
        upload_date=info.get("upload_date"),
        view_count=info.get("view_count"),
        platform=info.get("extractor_key"),
        webpage_url=info.get("webpage_url"),
        is_playlist=False,
    )
    return ExtractResponse(metadata=meta, formats=formats, subtitles=subtitles)


def _extract_sync(url: str) -> ExtractResponse:
    opts = _base_opts()
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except yt_dlp.utils.UnsupportedError as exc:
        raise UnsupportedURLError(str(exc)) from exc
    except yt_dlp.utils.DownloadError as exc:
        message = str(exc)
        if "Unsupported URL" in message:
            raise UnsupportedURLError(message) from exc
        raise ExtractionError(message) from exc
    if info is None:
        raise ExtractionError("No information could be extracted.")
    return _build_response(info)


async def extract(url: str) -> ExtractResponse:
    """Extract metadata and formats for a URL."""
    logger.info("Extracting metadata for url=%s", url)
    return await asyncio.to_thread(_extract_sync, url)


def _list_extractors() -> List[str]:
    names: List[str] = []
    for ie in yt_dlp.extractor.gen_extractors():
        name = ie.IE_NAME
        if name and name.lower() != "generic":
            names.append(name)
    return names


async def supported_platforms() -> Dict[str, Any]:
    names = await asyncio.to_thread(_list_extractors)
    examples = [
        "YouTube", "TikTok", "Instagram", "Facebook", "Twitter",
        "Reddit", "Vimeo", "Dailymotion", "Twitch", "SoundCloud", "BiliBili",
    ]
    return {"count": len(names), "examples": examples}
