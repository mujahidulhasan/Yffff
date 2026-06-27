'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function PlatformStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api
      .platforms()
      .then((res) => active && setCount(res.count))
      .catch(() => active && setCount(null));
    return () => {
      active = false;
    };
  }, []);

  if (count == null) return null;
  return (
    <p className="text-center text-sm text-muted-foreground">
      Supports <span className="font-semibold text-foreground">{count}+</span> sites
      powered by yt-dlp
    </p>
  );
}
