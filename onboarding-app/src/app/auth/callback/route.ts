import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { acceptInviteByToken } from "@/lib/data/invites";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/app";
  const inviteToken = requestUrl.searchParams.get("invite");

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);

    if (inviteToken) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        try {
          await acceptInviteByToken({
            token: inviteToken,
            userId: user.id,
            userEmail: user.email,
          });
        } catch (error) {
          console.error("Failed to accept invite", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unable to accept invite.";
          const errorRedirect = new URL("/sign-in", requestUrl.origin);
          errorRedirect.searchParams.set("error", errorMessage);
          if (inviteToken) {
            errorRedirect.searchParams.set("invite", inviteToken);
          }
          return NextResponse.redirect(errorRedirect);
        }
      }
    }
  }

  const redirectTo = new URL(next, requestUrl.origin);
  return NextResponse.redirect(redirectTo);
}
