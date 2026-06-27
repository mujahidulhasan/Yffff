'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';
import { UrlInput } from '@/components/url-input';
import {
  MetadataPreview,
  MetadataSkeleton,
} from '@/components/metadata-preview';
import { FormatSelector } from '@/components/format-selector';
import { DownloadQueue } from '@/components/download-queue';
import { PlatformStats } from '@/components/platform-stats';
import { api, ApiError } from '@/lib/api';
import { useProgressPoller } from '@/hooks/use-progress-poller';
import { buildQueueItem, useQueueStore } from '@/store/queue-store';
import type {
  AudioFormat,
  DownloadKind,
  ExtractResponse,
} from '@/types/api';

const MAX_CONCURRENT = 3;

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractResponse | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  const addItem = useQueueStore((s) => s.add);
  const activeCount = useQueueStore((s) => s.activeCount);
  useProgressPoller();

  const handleExtract = async (url: string) => {
    setLoading(true);
    setData(null);
    try {
      const result = await api.extract(url);
      setData(result);
      setCurrentUrl(url);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to fetch video info.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (payload: {
    kind: DownloadKind;
    format_id?: string;
    audio_format?: AudioFormat;
    subtitle_lang?: string;
  }) => {
    if (!data) return;
    if (activeCount() >= MAX_CONCURRENT) {
      toast.warning(`Maximum ${MAX_CONCURRENT} concurrent downloads reached.`);
      return;
    }
    try {
      const res = await api.download({ url: currentUrl, ...payload });
      addItem(buildQueueItem(res.job_id, currentUrl, payload.kind, data.metadata));
      toast.success('Download started.');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to start download.';
      toast.error(message);
    }
  };

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        <section className="space-y-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold sm:text-4xl"
          >
            Download from any site
          </motion.h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Paste a link to grab video, audio, thumbnails or subtitles. Merging is
            handled server-side with FFmpeg.
          </p>
          <PlatformStats />
        </section>

        <UrlInput loading={loading} onSubmit={handleExtract} />

        {loading && <MetadataSkeleton />}

        {data && (
          <div className="space-y-6">
            <MetadataPreview metadata={data.metadata} />
            <FormatSelector data={data} onDownload={handleDownload} />
          </div>
        )}

        <DownloadQueue />
      </div>
    </ErrorBoundary>
  );
}
