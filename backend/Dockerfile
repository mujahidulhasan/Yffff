# Backend image for Hugging Face Spaces (Docker SDK).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DOWNLOAD_DIR=/tmp/yt-download

# System dependencies: ffmpeg is required for server-side merging/conversion.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Hugging Face Spaces routes external traffic to port 7860.
EXPOSE 7860

# Create a non-root user; /tmp remains writable for downloads.
RUN useradd -m appuser && mkdir -p /tmp/yt-download && chown -R appuser /tmp/yt-download /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
