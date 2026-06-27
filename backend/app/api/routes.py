"""API route definitions."""
from __future__ import annotations

import os
import shutil

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app import __version__
from app.core.logging import get_logger
from app.models.schemas import (
    DownloadRequest,
    DownloadResponse,
    ExtractRequest,
    ExtractResponse,
    HealthResponse,
    PlatformsResponse,
    ProgressResponse,
)
from app.services import extractor
from app.services.queue_manager import queue_manager

logger = get_logger(__name__)
router = APIRouter(prefix="/api")


def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        version=__version__,
        ffmpeg=_ffmpeg_available(),
        active_jobs=queue_manager.active_jobs,
    )


@router.get("/platforms", response_model=PlatformsResponse)
async def platforms() -> PlatformsResponse:
    data = await extractor.supported_platforms()
    return PlatformsResponse(count=data["count"], examples=data["examples"])


@router.post("/extract", response_model=ExtractResponse)
async def extract(payload: ExtractRequest) -> ExtractResponse:
    try:
        return await extractor.extract(str(payload.url))
    except extractor.UnsupportedURLError:
        raise HTTPException(status_code=422, detail="This URL is not supported.")
    except extractor.ExtractionError as exc:
        raise HTTPException(status_code=502, detail=f"Extraction failed: {exc}")


@router.post("/download", response_model=DownloadResponse)
async def download(payload: DownloadRequest) -> DownloadResponse:
    job = await queue_manager.submit(payload)
    return DownloadResponse(job_id=job.id, status=job.status)


@router.get("/progress/{job_id}", response_model=ProgressResponse)
async def progress(job_id: str) -> ProgressResponse:
    result = queue_manager.progress(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    return result


@router.get("/file/{job_id}")
async def get_file(job_id: str) -> FileResponse:
    job = queue_manager.get(job_id)
    if not job or not job.filepath or not os.path.exists(job.filepath):
        raise HTTPException(status_code=404, detail="File not found or expired.")
    return FileResponse(
        path=job.filepath,
        filename=job.filename or os.path.basename(job.filepath),
        media_type="application/octet-stream",
    )
