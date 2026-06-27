'use client';

/* eslint-disable @next/next/no-img-element */
import { Download, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHistoryStore } from '@/store/history-store';

export function HistoryList() {
  const entries = useHistoryStore((s) => s.entries);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);

  if (entries.length === 0) {
    return (
      <div className="mt-10 text-center text-muted-foreground">
        <p>No downloads yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clear}>
          <Trash2 className="h-4 w-4" /> Clear history
        </Button>
      </div>
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="flex items-center gap-3 p-3">
            {entry.thumbnail ? (
              <img
                src={entry.thumbnail}
                alt={entry.title}
                className="h-14 w-24 rounded object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-14 w-24 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.title}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                {entry.platform && <Badge>{entry.platform}</Badge>}
                <Badge>{entry.kind}</Badge>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {entry.downloadUrl && (
                <a href={entry.downloadUrl} download>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => remove(entry.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
