"""Application configuration loaded from environment variables."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Values come from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "yt-download-api"
    environment: str = os.getenv("ENVIRONMENT", "production")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # Comma-separated list of allowed CORS origins. "*" allows all.
    cors_origins_raw: str = os.getenv("CORS_ORIGINS", "*")

    # Job / queue configuration
    max_concurrent_jobs: int = int(os.getenv("MAX_CONCURRENT_JOBS", "3"))
    job_ttl_seconds: int = int(os.getenv("JOB_TTL_SECONDS", "1800"))
    download_dir: str = os.getenv("DOWNLOAD_DIR", "/tmp/yt-download")
    cleanup_interval_seconds: int = int(os.getenv("CLEANUP_INTERVAL_SECONDS", "300"))

    # Rate limiting (requests per window per client IP)
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "30"))
    rate_limit_window_seconds: int = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

    # yt-dlp retry configuration
    extract_retries: int = int(os.getenv("EXTRACT_RETRIES", "3"))
    download_retries: int = int(os.getenv("DOWNLOAD_RETRIES", "3"))

    max_filesize_mb: int = int(os.getenv("MAX_FILESIZE_MB", "2048"))

    @property
    def cors_origins(self) -> List[str]:
        raw = self.cors_origins_raw.strip()
        if raw == "*":
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
