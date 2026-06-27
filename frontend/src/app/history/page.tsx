import type { Metadata } from 'next';
import { HistoryList } from '@/components/history-list';

export const metadata: Metadata = {
  title: 'History',
  description: 'Your recent downloads stored locally in your browser.',
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Download history</h1>
      <p className="text-sm text-muted-foreground">
        History is stored only in your browser (localStorage) and never sent to a
        server.
      </p>
      <HistoryList />
    </div>
  );
}
