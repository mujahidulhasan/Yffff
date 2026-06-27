'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useQueueStore } from '@/store/queue-store';
import { useHistoryStore } from '@/store/history-store';
import type { JobStatus } from '@/types/api';

const TERMINAL: JobStatus[] = ['completed', 'failed'];
const POLL_INTERVAL = 1500;

/**
 * Polls backend progress for every active queue item and syncs the store.
 * Completed downloads are pushed into history exactly once.
 */
export function useProgressPoller(): void {
  const items = useQueueStore((s) => s.items);
  const update = useQueueStore((s) => s.update);
  const addHistory = useHistoryStore((s) => s.add);
  const recorded = useRef<Set<string>>(new Set());

  useEffect(() => {
    const active = items.filter((i) => !TERMINAL.includes(i.status));
    if (active.length === 0) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      await Promise.all(
        active.map(async (item) => {
          try {
            const p = await api.progress(item.jobId);
            if (cancelled) return;
            const downloadUrl = p.download_url
              ? `${api.baseUrl}${p.download_url}`
              : null;
            update(item.jobId, {
              status: p.status,
              stage: p.stage,
              percent: p.percent,
              speed: p.speed,
              eta: p.eta,
              filename: p.filename,
              error: p.error,
              downloadUrl,
            });
            if (p.status === 'completed' && !recorded.current.has(item.jobId)) {
              recorded.current.add(item.jobId);
              addHistory({
                id: item.jobId,
                title: item.title,
                thumbnail: item.thumbnail,
                platform: item.platform,
                kind: item.kind,
                url: item.url,
                filename: p.filename,
                downloadUrl,
                createdAt: Date.now(),
              });
            }
          } catch {
            // transient errors are retried on the next tick
          }
        })
      );
    }, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [items, update, addHistory]);
}
