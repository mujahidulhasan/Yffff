'use client';

/* eslint-disable @next/next/no-img-element */
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCount,
  formatDuration,
  formatUploadDate,
} from '@/lib/utils';
import type { Metadata } from '@/types/api';

export function MetadataSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
        <Skeleton className="aspect-video w-full rounded-md sm:w-64" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

export function MetadataPreview({ metadata }: { metadata: Metadata }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="aspect-video w-full rounded-md object-cover sm:w-64"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted sm:w-64">
              <span className="text-sm text-muted-foreground">No thumbnail</span>
            </div>
          )}
          <div className="flex-1 space-y-3">
            <h2 className="line-clamp-2 text-lg font-semibold">{metadata.title}</h2>
            <div className="flex flex-wrap gap-2">
              {metadata.platform && <Badge>{metadata.platform}</Badge>}
              {metadata.is_playlist && (
                <Badge>Playlist · {metadata.playlist_count ?? '?'} items</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {metadata.uploader && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {metadata.uploader}
                </span>
              )}
              {metadata.duration != null && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {formatDuration(metadata.duration)}
                </span>
              )}
              {metadata.view_count != null && (
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {formatCount(metadata.view_count)} views
                </span>
              )}
              {metadata.upload_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />{' '}
                  {formatUploadDate(metadata.upload_date)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
