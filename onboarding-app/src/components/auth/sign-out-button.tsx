"use client";

import { useTransition } from "react";

import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOut())}
      disabled={isPending}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-border/40 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
