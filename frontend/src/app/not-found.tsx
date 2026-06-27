import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto mt-20 max-w-md text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">This page could not be found.</p>
      <Link href="/" className="mt-4 inline-block">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
