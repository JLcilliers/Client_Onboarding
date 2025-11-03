"use client";

import { useState, useTransition } from "react";

type SecretMeta = {
  id: string;
  label: string | null;
  secretType: string;
  createdAt: string;
};

const typeLabels: Record<string, string> = {
  hosting: "Hosting / Server",
  dns: "DNS / Registrar",
  analytics: "Analytics",
  ads: "Advertising",
  other: "Other",
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString();
}

export function SecretList({ secrets }: { secrets: SecretMeta[] }) {
  const [revealedSecretId, setRevealedSecretId] = useState<string | null>(null);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReveal = (secretId: string) => {
    startTransition(async () => {
      setErrorMessage(null);
      try {
        const response = await fetch(
          `/api/company-secrets/${secretId}/reveal`,
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Unable to reveal secret.");
        }

        const payload = await response.json();
        setRevealedSecretId(secretId);
        setRevealedValue(payload.secretValue);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to reveal secret.",
        );
      }
    });
  };

  if (secrets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No secrets stored yet. Use the form above to add secured credentials.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
      {secrets.map((secret) => {
        const isRevealed = revealedSecretId === secret.id;
        return (
          <div
            key={secret.id}
            className="grid gap-3 px-6 py-4 text-sm md:grid-cols-[1fr_auto]"
          >
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                {secret.label ?? "Untitled secret"}
              </p>
              <p className="text-xs text-muted-foreground">
                {typeLabels[secret.secretType] ?? secret.secretType} · Stored{" "}
                {formatDate(secret.createdAt)}
              </p>
              {isRevealed ? (
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground">
                  {revealedValue}
                </pre>
              ) : null}
            </div>
            <div className="flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={() => handleReveal(secret.id)}
                disabled={isPending && revealedSecretId === secret.id}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && revealedSecretId === secret.id
                  ? "Loading…"
                  : "Reveal"}
              </button>
            </div>
          </div>
        );
      })}
      {errorMessage ? (
        <div className="px-6 py-4 text-sm text-red-600">{errorMessage}</div>
      ) : null}
    </div>
  );
}
