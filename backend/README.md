# Backend - Video Downloader API

FastAPI service that uses `yt-dlp` + server-side FFmpeg to extract metadata and
download media from any site supported by yt-dlp.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ffmpeg must be installed on the host (apt-get install ffmpeg)
uvicorn app.main:app --reload --port 7860
```

Open http://localhost:7860/docs for the interactive API docs.

## Endpoints

| Method | Path                    | Description                          |
| ------ | ----------------------- | ------------------------------------ |
| POST   | `/api/extract`          | Metadata, thumbnail, formats         |
| POST   | `/api/download`         | Start a download job                 |
| GET    | `/api/progress/{job_id}`| Live progress for a job              |
| GET    | `/api/file/{job_id}`    | Download the completed file          |
| GET    | `/api/health`           | Health check                         |
| GET    | `/api/platforms`        | Supported platform count from yt-dlp |

See `.env.example` for configuration.
