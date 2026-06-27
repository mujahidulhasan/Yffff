'use client';

import { useCallback, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const CORE_BASE = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

/**
 * Optional client-side merging fallback using FFmpeg.wasm.
 *
 * The primary workflow performs merging server-side. This hook is only used
 * when a user explicitly chooses to merge separate video/audio tracks in the
 * browser (for example when the backend is unavailable).
 */
export function useFfmpeg() {
  const ref = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    if (ref.current) return ref.current;
    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    ref.current = ffmpeg;
    setLoaded(true);
    return ffmpeg;
  }, []);

  const mergeVideoAudio = useCallback(
    async (video: Blob, audio: Blob): Promise<Blob> => {
      const ffmpeg = await load();
      await ffmpeg.writeFile('video.mp4', await fetchFile(video));
      await ffmpeg.writeFile('audio.m4a', await fetchFile(audio));
      await ffmpeg.exec([
        '-i', 'video.mp4',
        '-i', 'audio.m4a',
        '-c:v', 'copy',
        '-c:a', 'aac',
        'output.mp4',
      ]);
      const data = await ffmpeg.readFile('output.mp4');
      const bytes = data as Uint8Array;
      return new Blob([bytes], { type: 'video/mp4' });
    },
    [load]
  );

  return { load, loaded, progress, mergeVideoAudio };
}
