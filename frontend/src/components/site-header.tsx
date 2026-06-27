'use client';

import Link from 'next/link';
import { Download } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Download className="h-4 w-4" />
          </span>
          <span>Video Downloader</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/history"
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            History
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
