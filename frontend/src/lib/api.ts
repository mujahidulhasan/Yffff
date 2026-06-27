import type {
  DownloadRequest,
  DownloadResponse,
  ExtractResponse,
  HealthResponse,
  PlatformsResponse,
  ProgressResponse,
} from '@/types/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  baseUrl: API_BASE,
  extract: (url: string) =>
    request<ExtractResponse>('/api/extract', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  download: (payload: DownloadRequest) =>
    request<DownloadResponse>('/api/download', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  progress: (jobId: string) =>
    request<ProgressResponse>(`/api/progress/${jobId}`),
  health: () => request<HealthResponse>('/api/health'),
  platforms: () => request<PlatformsResponse>('/api/platforms'),
  fileUrl: (jobId: string) => `${API_BASE}/api/file/${jobId}`,
};
