'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { formatBytes } from '@/lib/utils';
import type {
  AudioFormat,
  DownloadKind,
  ExtractResponse,
  FormatInfo,
} from '@/types/api';

interface Props {
  data: ExtractResponse;
  onDownload: (payload: {
    kind: DownloadKind;
    format_id?: string;
    audio_format?: AudioFormat;
    subtitle_lang?: string;
  }) => void;
}

type Tab = 'video' | 'audio' | 'extras';

function formatLabel(f: FormatInfo): string {
  const parts: string[] = [];
  if (f.resolution) parts.push(f.resolution);
  if (f.ext) parts.push(f.ext.toUpperCase());
  if (f.fps) parts.push(`${Math.round(f.fps)}fps`);
  const size = f.filesize ?? f.filesize_approx;
  if (size) parts.push(formatBytes(size));
  if (f.vcodec && f.vcodec !== 'none') parts.push(f.vcodec.split('.')[0]);
  return parts.join(' · ') || f.format_id;
}

export function FormatSelector({ data, onDownload }: Props) {
  const [tab, setTab] = useState<Tab>('video');
  const [audioFormat, setAudioFormat] = useState<AudioFormat>('mp3');
  const [subtitle, setSubtitle] = useState<string>(data.subtitles[0] ?? '');

  const videoFormats = useMemo(
    () => data.formats.filter((f) => f.has_video).sort(sortByQuality),
    [data.formats]
  );
  const audioOnly = useMemo(
    () => data.formats.filter((f) => f.has_audio && !f.has_video).sort(sortByQuality),
    [data.formats]
  );

  if (data.metadata.is_playlist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Playlist download</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            This URL is a playlist with {data.metadata.playlist_count ?? 'multiple'}{' '}
            items. Each item will be downloaded at best quality.
          </p>
          <Button onClick={() => onDownload({ kind: 'playlist' })}>
            <Download className="h-4 w-4" /> Download playlist
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a format</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['video', 'audio', 'extras'] as Tab[]).map((t) => (
            <Button
              key={t}
              variant={tab === t ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>

        {tab === 'video' && (
          <div className="space-y-2">
            <Button
              variant="secondary"
              className="w-full justify-between"
              onClick={() => onDownload({ kind: 'best' })}
            >
              <span>Best quality (auto-merge)</span>
              <Download className="h-4 w-4" />
            </Button>
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {videoFormats.map((f) => (
                <li key={f.format_id}>
                  <button
                    onClick={() =>
                      onDownload({ kind: 'video', format_id: f.format_id })
                    }
                    className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{formatLabel(f)}</span>
                    {!f.has_audio && <Badge>video only</Badge>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'audio' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Convert to</label>
              <Select
                value={audioFormat}
                onChange={(e) => setAudioFormat(e.target.value as AudioFormat)}
                className="max-w-[140px]"
              >
                <option value="mp3">MP3</option>
                <option value="m4a">M4A</option>
                <option value="wav">WAV</option>
              </Select>
            </div>
            <Button
              className="w-full justify-between"
              onClick={() =>
                onDownload({ kind: 'audio', audio_format: audioFormat })
              }
            >
              <span>Extract audio ({audioFormat.toUpperCase()})</span>
              <Download className="h-4 w-4" />
            </Button>
            {audioOnly.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {audioOnly.length} source audio track(s) available; conversion is
                handled server-side with FFmpeg.
              </p>
            )}
          </div>
        )}

        {tab === 'extras' && (
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => onDownload({ kind: 'thumbnail' })}
            >
              <span>Download thumbnail</span>
              <Download className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Select
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={data.subtitles.length === 0}
                className="max-w-[160px]"
              >
                {data.subtitles.length === 0 ? (
                  <option value="">No subtitles</option>
                ) : (
                  data.subtitles.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))
                )}
              </Select>
              <Button
                variant="outline"
                disabled={data.subtitles.length === 0}
                onClick={() =>
                  onDownload({ kind: 'subtitle', subtitle_lang: subtitle })
                }
              >
                <Download className="h-4 w-4" /> Subtitles
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function sortByQuality(a: FormatInfo, b: FormatInfo): number {
  const score = (f: FormatInfo) => {
    const res = f.resolution?.match(/(\d+)/)?.[1];
    const height = res ? parseInt(res, 10) : 0;
    return height || f.tbr || f.abr || 0;
  };
  return score(b) - score(a);
}
