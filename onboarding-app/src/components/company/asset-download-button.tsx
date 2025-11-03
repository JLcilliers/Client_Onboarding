"use client";

import { useState, useTransition } from "react";

export function AssetDownloadButton({ assetId }: { assetId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    startTransition(async () => {
      setError(null);
      try {
        const response = await fetch(
          `/api/company-assets/${assetId}/download`,
          {
            method: "GET",
          },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Unable to generate download link.");
        }

        const payload = await response.json();
        window.open(payload.url, "_blank", "noopener");
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Download failed. Try again.",
        );
      }
    });
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Generating…" : "Download"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
