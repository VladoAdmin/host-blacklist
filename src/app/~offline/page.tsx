"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <WifiOff className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold mb-2">Ste offline</h1>
      <p className="text-muted-foreground max-w-md">
        Zdá sa, že nemáte pripojenie na internet. Skontrolujte pripojenie a
        skúste to znova.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        Skúsiť znova
      </button>
    </div>
  );
}
