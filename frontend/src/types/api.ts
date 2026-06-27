// Shared API types mirroring the backend Pydantic schemas.

export type DownloadKind =
  | 'video'
  | 'audio'
  | 'thumbnail'
  | 'subtitle'
  | 'playlist'
  | 'best';

export type AudioFormat = 'mp3' | 'm4a' | 'wav';

export type JobStatus =
  | 'queued'
  | 'running'
  | 'merging'
  | 'completed'
  | 'failed';

export interface FormatInfo {
  format_id: string;
  ext?: string | null;
  resolution?: string | null;
  fps?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  tbr?: number | null;
  abr?: number | null;
  vbr?: number | null;
  has_video: boolean;
  has_audio: boolean;
  note?: string | null;
}

export interface Metadata {
  id: string;
  title: string;
  thumbnail?: string | null;
  duration?: number | null;
  uploader?: string | null;
  upload_date?: string | null;
  view_count?: number | null;
  platform?: string | null;
  webpage_url?: string | null;
  is_playlist: boolean;
  playlist_count?: number | null;
}

export interface ExtractResponse {
  metadata: Metadata;
  formats: FormatInfo[];
  subtitles: string[];
}

export interface DownloadRequest {
  url: string;
  kind: DownloadKind;
  format_id?: string | null;
  audio_format?: AudioFormat;
  subtitle_lang?: string | null;
}

export interface DownloadResponse {
  job_id: string;
  status: JobStatus;
}

export interface ProgressResponse {
  job_id: string;
  status: JobStatus;
  stage: string;
  percent: number;
  speed?: string | null;
  eta?: string | null;
  filename?: string | null;
  error?: string | null;
  download_url?: string | null;
}

export interface HealthResponse {
  status: string;
  version: string;
  ffmpeg: boolean;
  active_jobs: number;
}

export interface PlatformsResponse {
  count: number;
  examples: string[];
}

export interface HistoryEntry {
  id: string;
  title: string;
  thumbnail?: string | null;
  platform?: string | null;
  kind: DownloadKind;
  url: string;
  filename?: string | null;
  downloadUrl?: string | null;
  createdAt: number;
}
