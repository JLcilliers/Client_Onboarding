"use client";

import { useMemo, useState } from "react";

import { clientEnv } from "@/env/client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type InviteDetails = {
  token: string;
  email?: string;
  companyName?: string;
};

type SignInViewProps = {
  invite?: InviteDetails | null;
  errorMessage?: string;
};

export function SignInView({ invite, errorMessage }: SignInViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const origin = typeof window !== 'undefined' ? window.location.origin : clientEnv.SITE_URL;
      const redirectTo = invite?.token
        ? `${origin}/auth/callback?invite=${invite.token}`
        : `${origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
            ...(invite?.email ? { login_hint: invite.email } : {}),
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6 py-12">
      <div className="space-y-4 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {invite?.companyName
            ? `Join ${invite.companyName} onboarding workspace`
            : "Welcome to your onboarding workspace"}
        </h1>
        <p className="text-muted-foreground">
          Sign in with your Google account to start or continue your client
          intake questionnaire. Your progress is saved automatically.
        </p>
      </div>
      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {errorMessage}
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Redirecting to Google..." : "Continue with Google"}
      </button>
      <p className="text-xs text-muted-foreground">
        You will be redirected back here after granting access.
      </p>
      {invite?.email ? (
        <p className="text-xs text-muted-foreground">
          Invited email: <span className="font-medium">{invite.email}</span>
        </p>
      ) : null}
    </div>
  );
}
