"use client";

import { useMemo, useState, useTransition } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Props = {
  companyId: string;
};

export function AssetUploader({ companyId }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [status, setStatus] = useState<{
    type: "idle" | "error" | "success";
    message?: string;
  }>({ type: "idle" });
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setStatus({ type: "idle" });
      try {
        const response = await fetch("/api/company-assets/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyId,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Unable to generate upload link.");
        }

        const payload = await response.json();

        const { error: uploadError } = await supabase.storage
          .from("company-assets")
          .uploadToSignedUrl(payload.path, payload.token, file);

        if (uploadError) {
          throw uploadError;
        }

        setStatus({
          type: "success",
          message: "File uploaded successfully.",
        });
      } catch (error) {
        console.error(error);
        setStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to upload file. Please try again.",
        });
      } finally {
        event.target.value = "";
      }
    });
  };

  return (
    <div className="space-y-3">
      <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary">
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
        />
        {isPending ? "Uploading…" : "Upload file"}
      </label>
      {status.type === "error" ? (
        <p className="text-sm text-red-600">{status.message}</p>
      ) : null}
      {status.type === "success" ? (
        <p className="text-sm text-emerald-600">{status.message}</p>
      ) : null}
    </div>
  );
}
