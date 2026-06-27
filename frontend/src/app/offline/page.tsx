export const dynamic = 'force-static';

export default function OfflinePage() {
  return (
    <div className="mx-auto mt-20 max-w-md text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="mt-2 text-muted-foreground">
        Reconnect to the internet to fetch and download videos.
      </p>
    </div>
  );
}
