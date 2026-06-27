"""In-memory job queue with bounded concurrency and progress tracking."""
from __future__ import annotations

import asyncio
import os
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from app.core.config import get_settings
from app.core.logging import get_logger
from app.models.schemas import DownloadRequest, JobStatus, ProgressResponse
from app.services.downloader import DownloadFailedError, run_download

logger = get_logger(__name__)


@dataclass
class Job:
    id: str
    request: DownloadRequest
    status: JobStatus = JobStatus.QUEUED
    stage: str = "queued"
    percent: float = 0.0
    speed: Optional[str] = None
    eta: Optional[str] = None
    filename: Optional[str] = None
    filepath: Optional[str] = None
    error: Optional[str] = None
    out_dir: str = ""
    extra: Dict[str, Any] = field(default_factory=dict)


class QueueManager:
    def __init__(self) -> None:
        settings = get_settings()
        self._jobs: Dict[str, Job] = {}
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_jobs)
        self._base_dir = settings.download_dir
        self._active = 0
        self._lock = asyncio.Lock()

    @property
    def active_jobs(self) -> int:
        return self._active

    def _make_progress_hook(self, job: Job, loop: asyncio.AbstractEventLoop):
        def hook(d: Dict[str, Any]) -> None:
            status = d.get("status")
            if status == "downloading":
                job.status = JobStatus.RUNNING
                job.stage = "downloading"
                total = d.get("total_bytes") or d.get("total_bytes_estimate")
                downloaded = d.get("downloaded_bytes") or 0
                if total:
                    job.percent = round(min(downloaded / total * 100.0, 100.0), 2)
                speed = d.get("_speed_str") or d.get("speed")
                job.speed = str(speed).strip() if speed else None
                eta = d.get("_eta_str") or d.get("eta")
                job.eta = str(eta).strip() if eta else None
            elif status == "finished":
                job.stage = "merging"
                job.status = JobStatus.MERGING
                job.percent = 99.0
            elif status == "processing":
                job.stage = "processing"

        return hook

    def create_job(self, request: DownloadRequest) -> Job:
        job_id = uuid.uuid4().hex
        out_dir = os.path.join(self._base_dir, job_id)
        job = Job(id=job_id, request=request, out_dir=out_dir)
        self._jobs[job_id] = job
        return job

    async def submit(self, request: DownloadRequest) -> Job:
        job = self.create_job(request)
        asyncio.create_task(self._run(job))
        return job

    async def _run(self, job: Job) -> None:
        async with self._semaphore:
            async with self._lock:
                self._active += 1
            loop = asyncio.get_running_loop()
            hook = self._make_progress_hook(job, loop)
            try:
                job.status = JobStatus.RUNNING
                job.stage = "starting"
                filepath = await asyncio.to_thread(
                    run_download, job.request, job.out_dir, hook
                )
                job.filepath = filepath
                job.filename = os.path.basename(filepath)
                job.status = JobStatus.COMPLETED
                job.stage = "completed"
                job.percent = 100.0
                logger.info("Job %s completed: %s", job.id, job.filename)
            except DownloadFailedError as exc:
                job.status = JobStatus.FAILED
                job.stage = "failed"
                job.error = str(exc)
                logger.error("Job %s failed: %s", job.id, exc)
            except Exception as exc:  # noqa: BLE001
                job.status = JobStatus.FAILED
                job.stage = "failed"
                job.error = f"Unexpected error: {exc}"
                logger.exception("Job %s crashed", job.id)
            finally:
                async with self._lock:
                    self._active -= 1

    def get(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def progress(self, job_id: str) -> Optional[ProgressResponse]:
        job = self._jobs.get(job_id)
        if not job:
            return None
        download_url = None
        if job.status == JobStatus.COMPLETED and job.filename:
            download_url = f"/api/file/{job.id}"
        return ProgressResponse(
            job_id=job.id,
            status=job.status,
            stage=job.stage,
            percent=job.percent,
            speed=job.speed,
            eta=job.eta,
            filename=job.filename,
            error=job.error,
            download_url=download_url,
        )


queue_manager = QueueManager()
