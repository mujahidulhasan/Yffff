"""Background cleanup of expired job files in the temp directory."""
from __future__ import annotations

import asyncio
import shutil
import time

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


async def cleanup_loop(stop_event: asyncio.Event) -> None:
    settings = get_settings()
    interval = settings.cleanup_interval_seconds
    ttl = settings.job_ttl_seconds
    base = settings.download_dir
    import os

    os.makedirs(base, exist_ok=True)
    while not stop_event.is_set():
        try:
            now = time.time()
            for entry in os.listdir(base):
                path = os.path.join(base, entry)
                try:
                    mtime = os.path.getmtime(path)
                except OSError:
                    continue
                if now - mtime > ttl:
                    if os.path.isdir(path):
                        shutil.rmtree(path, ignore_errors=True)
                    else:
                        try:
                            os.remove(path)
                        except OSError:
                            pass
                    logger.info("Cleaned up expired path=%s", path)
        except Exception as exc:  # noqa: BLE001 - never let cleanup crash
            logger.warning("Cleanup error: %s", exc)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval)
        except asyncio.TimeoutError:
            continue
