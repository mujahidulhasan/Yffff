'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isValidHttpUrl } from '@/lib/utils';

interface Props {
  loading: boolean;
  onSubmit: (url: string) => void;
}

export function UrlInput({ loading, onSubmit }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = value.trim();
    if (!isValidHttpUrl(url)) {
      setError('Please enter a valid http(s) URL.');
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={value}
          inputMode="url"
          autoComplete="off"
          placeholder="Paste a video URL (YouTube, TikTok, Instagram, ...)"
          onChange={(e) => setValue(e.target.value)}
          aria-label="Video URL"
          aria-invalid={Boolean(error)}
        />
        <Button type="submit" size="lg" disabled={loading} className="sm:w-40">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {loading ? 'Fetching' : 'Fetch'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </motion.form>
  );
}
