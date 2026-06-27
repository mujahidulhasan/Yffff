"""Pydantic request/response schemas."""
from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class DownloadKind(str, Enum):
    VIDEO = "video"
    AUDIO = "audio"
    THUMBNAIL = "thumbnail"
    SUBTITLE = "subtitle"
    PLAYLIST = "playlist"
    BEST = "best"


class AudioFormat(str, Enum):
    MP3 = "mp3"
    M4A = "m4a"
    WAV = "wav"


class ExtractRequest(BaseModel):
    url: HttpUrl


class FormatInfo(BaseModel):
    format_id: str
    ext: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None
    vcodec: Optional[str] = None
    acodec: Optional[str] = None
    filesize: Optional[int] = None
    filesize_approx: Optional[int] = None
    tbr: Optional[float] = None
    abr: Optional[float] = None
    vbr: Optional[float] = None
    has_video: bool = False
    has_audio: bool = False
    note: Optional[str] = None


class Metadata(BaseModel):
    id: str
    title: str
    thumbnail: Optional[str] = None
    duration: Optional[float] = None
    uploader: Optional[str] = None
    upload_date: Optional[str] = None
    view_count: Optional[int] = None
    platform: Optional[str] = None
    webpage_url: Optional[str] = None
    is_playlist: bool = False
    playlist_count: Optional[int] = None


class ExtractResponse(BaseModel):
    metadata: Metadata
    formats: List[FormatInfo] = Field(default_factory=list)
    subtitles: List[str] = Field(default_factory=list)


class DownloadRequest(BaseModel):
    url: HttpUrl
    kind: DownloadKind = DownloadKind.BEST
    format_id: Optional[str] = None
    audio_format: AudioFormat = AudioFormat.MP3
    subtitle_lang: Optional[str] = None


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    MERGING = "merging"
    COMPLETED = "completed"
    FAILED = "failed"


class DownloadResponse(BaseModel):
    job_id: str
    status: JobStatus


class ProgressResponse(BaseModel):
    job_id: str
    status: JobStatus
    stage: str = ""
    percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    filename: Optional[str] = None
    error: Optional[str] = None
    download_url: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    ffmpeg: bool
    active_jobs: int


class PlatformsResponse(BaseModel):
    count: int
    examples: List[str] = Field(default_factory=list)
