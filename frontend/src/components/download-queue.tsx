'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQueueStore, type QueueItem } from '@/store/queue-store';

function StatusIcon({ item }: { item: QueueItem }) {
  if (item.status === 'completed')
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (item.status === 'failed')
    return <XCircle className="h-5 w-5 text-red-500" />;
  return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
}

function QueueRow({ item }: { item: QueueItem }) {
  const remove = useQueueStore((s) => s.remove);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-md border border-border p-3"
    >
      <div className="flex items-start gap-3">
        <StatusIcon item={item} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge>{item.kind}</Badge>
            <span className="capitalize">{item.stage}</span>
            {item.speed && <span>{item.speed}</span>}
            {item.eta && <span>ETA {item.eta}</span>}
          </div>
          {item.status !== 'completed' && item.status !== 'failed' && (
            <Progress value={item.percent} className="mt-2" />
          )}
          {item.error && (
            <p className="mt-1 text-xs text-red-500">{item.error}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {item.status === 'completed' && item.downloadUrl && (
            <a href={item.downloadUrl} download>
              <Button size="sm">
                <Download className="h-4 w-4" /> Save
              </Button>
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove"
            onClick={() => remove(item.jobId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function DownloadQueue() {
  const items = useQueueStore((s) => s.items);
  const clearFinished = useQueueStore((s) => s.clearFinished);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Download queue</CardTitle>
        <Button variant="ghost" size="sm" onClick={clearFinished}>
          Clear finished
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <QueueRow key={item.jobId} item={item} />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
