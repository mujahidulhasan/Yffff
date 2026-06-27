# Multi-Platform Video Downloader

A production-grade, mobile-first web app to download **video, audio, thumbnails,
subtitles, and metadata** from any site supported by
[yt-dlp](https://github.com/yt-dlp/yt-dlp).

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion → deploys to **Vercel**
- **Backend:** FastAPI (Python 3.12) + yt-dlp + FFmpeg + Uvicorn → deploys to **Hugging Face Spaces** (Docker)
- **Merging:** Server-side FFmpeg is the primary workflow. FFmpeg.wasm is wired in as an optional client-side fallback only.
- **No permanent storage:** Files live in `/tmp` and are auto-deleted by a background cleanup task.

> **Legal note:** Downloading content may violate the Terms of Service of some
> platforms and may infringe copyright. Only download content you own or have
> the right to download. You are responsible for how you deploy and use this software.

## Repository structure

```text
.
├─ backend/                     FastAPI service (Hugging Face Spaces)
│  ├─ app/
│  │  ├─ api/routes.py          REST endpoints
│  │  ├─ core/                  config + logging
│  │  ├─ middleware/            rate limiting
│  │  ├─ models/schemas.py      Pydantic request/response models
│  │  ├─ services/              extractor, downloader, queue, cleanup
│  │  └─ main.py                app factory + lifespan
│  ├─ Dockerfile
│  ├─ requirements.txt
│  ├─ packages.txt
│  └─ .env.example
└─ frontend/                    Next.js 15 app (Vercel)
   ├─ src/
   │  ├─ app/                   App Router pages + layout
   │  ├─ components/            UI + feature components
   │  ├─ hooks/                 progress poller, ffmpeg.wasm
   │  ├─ lib/                   API client + utils
   │  ├─ store/                 Zustand stores (queue + history)
   │  └─ types/                 shared API types
   ├─ public/                   PWA manifest + service worker
   ├─ vercel.json
   └─ .env.example
```

## API endpoints

| Method | Path                      | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/api/extract`            | Returns metadata, thumbnail, formats     |
| POST   | `/api/download`           | Starts a download job, returns `job_id`  |
| GET    | `/api/progress/{job_id}`  | Live progress (percent, speed, ETA, stage)|
| GET    | `/api/file/{job_id}`      | Streams the completed file               |
| GET    | `/api/health`             | Health check (+ ffmpeg availability)     |
| GET    | `/api/platforms`          | Supported platform count from yt-dlp     |

## Features

- URL validation + unsupported-URL detection (via yt-dlp extractor matching)
- Metadata preview: title, thumbnail, duration, uploader, upload date, views, platform
- Format selection: best quality, video-only, audio-only, MP3/M4A/WAV conversion, thumbnails, subtitles, playlists
- Live progress: percentage, speed, ETA, stage, merge progress
- Queue with max **3** concurrent jobs (enforced on both client and server)
- History in browser `localStorage`
- Backend: rate limiting, queue management, automatic `/tmp` cleanup, retry logic, structured logging, health endpoint, CORS
- Dark / light mode, PWA support, loading skeletons, toast notifications, error boundaries

## Local development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Install ffmpeg on the host: e.g. `sudo apt-get install ffmpeg` or `brew install ffmpeg`
cp .env.example .env
uvicorn app.main:app --reload --port 7860
```

API docs: http://localhost:7860/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL to http://localhost:7860 for local dev
npm run dev
```

App: http://localhost:3000

## Environment variables

### Backend (`backend/.env`)

| Variable                   | Default            | Description                              |
| -------------------------- | ------------------ | ---------------------------------------- |
| `ENVIRONMENT`              | `production`       | Runtime environment label                |
| `LOG_LEVEL`                | `INFO`             | Logging level                            |
| `CORS_ORIGINS`             | `*`                | Comma-separated allowed origins          |
| `MAX_CONCURRENT_JOBS`      | `3`                | Max simultaneous download jobs           |
| `JOB_TTL_SECONDS`          | `1800`             | Lifetime before files are cleaned up     |
| `DOWNLOAD_DIR`             | `/tmp/yt-download` | Temp download directory                  |
| `CLEANUP_INTERVAL_SECONDS` | `300`              | Cleanup loop interval                    |
| `RATE_LIMIT_REQUESTS`      | `30`               | Requests per window per IP               |
| `RATE_LIMIT_WINDOW_SECONDS`| `60`               | Rate-limit window size                   |
| `EXTRACT_RETRIES`          | `3`                | yt-dlp extract retries                   |
| `DOWNLOAD_RETRIES`         | `3`                | yt-dlp download retries                  |
| `MAX_FILESIZE_MB`          | `2048`             | Max single-file size                     |

### Frontend (`frontend/.env.local`)

| Variable                   | Description                                   |
| -------------------------- | --------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend (HF Space URL)        |
| `NEXT_PUBLIC_SITE_URL`     | Public site URL, used for sitemap (optional)  |

## Deployment

### Backend → Hugging Face Spaces (Docker)

1. Create a new Space → **SDK: Docker**.
2. Push the contents of `backend/` to the Space repo (root must contain the `Dockerfile`).
3. Add this YAML front-matter at the top of the Space's `README.md` (see `backend/space.yaml`):
   ```yaml
   ---
   title: YT Download API
   emoji: 📥
   colorFrom: purple
   colorTo: indigo
   sdk: docker
   app_port: 7860
   ---
   ```
4. In **Settings → Variables and secrets**, set `CORS_ORIGINS` to your Vercel URL.
5. The Space builds the image (FFmpeg installed via apt) and serves on port `7860`.
   Your API base URL will be `https://<user>-<space>.hf.space`.

### Frontend → Vercel

1. Import the repository into Vercel and set the **Root Directory** to `frontend`.
2. Framework preset: **Next.js** (auto-detected). Build command `next build`.
3. Add environment variable `NEXT_PUBLIC_API_BASE_URL` = your Hugging Face Space URL.
4. Deploy. The COOP/COEP headers required for FFmpeg.wasm are configured in `vercel.json` and `next.config.mjs`.

## How platform support works

The backend never hardcodes platforms. It relies on yt-dlp's extractor
registry: `/api/platforms` counts `yt_dlp.extractor.gen_extractors()`, and
extraction uses automatic extractor detection. Any site yt-dlp supports works,
including YouTube, TikTok, Instagram, Facebook, X/Twitter, Reddit, Vimeo,
Dailymotion, Twitch, SoundCloud, and Bilibili.

## License

Provided as-is. Ensure your usage complies with the terms of service of the
sites you access and with applicable copyright law.
