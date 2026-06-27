import { create } from 'zustand';
import type { DownloadKind, JobStatus, Metadata } from '@/types/api';

export interface QueueItem {
  jobId: string;
  url: string;
  kind: DownloadKind;
  title: string;
  thumbnail?: string | null;
  platform?: string | null;
  status: JobStatus;
  stage: string;
  percent: number;
  speed?: string | null;
  eta?: string | null;
  filename?: string | null;
  downloadUrl?: string | null;
  error?: string | null;
  createdAt: number;
}

interface QueueState {
  items: QueueItem[];
  add: (item: QueueItem) => void;
  update: (jobId: string, patch: Partial<QueueItem>) => void;
  remove: (jobId: string) => void;
  clearFinished: () => void;
  activeCount: () => number;
}

const ACTIVE: JobStatus[] = ['queued', 'running', 'merging'];

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  add: (item) => set((state) => ({ items: [item, ...state.items] })),
  update: (jobId, patch) =>
    set((state) => ({
      items: state.items.map((i) => (i.jobId === jobId ? { ...i, ...patch } : i)),
    })),
  remove: (jobId) =>
    set((state) => ({ items: state.items.filter((i) => i.jobId !== jobId) })),
  clearFinished: () =>
    set((state) => ({
      items: state.items.filter((i) => ACTIVE.includes(i.status)),
    })),
  activeCount: () => get().items.filter((i) => ACTIVE.includes(i.status)).length,
}));

export function buildQueueItem(
  jobId: string,
  url: string,
  kind: DownloadKind,
  metadata: Metadata
): QueueItem {
  return {
    jobId,
    url,
    kind,
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    platform: metadata.platform,
    status: 'queued',
    stage: 'queued',
    percent: 0,
    createdAt: Date.now(),
  };
}
