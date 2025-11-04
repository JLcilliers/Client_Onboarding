"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  access_type: z.string().min(1, "Select an access type."),
  notes: z.string().optional(),
});

export type AccessRequestState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const initialAccessRequestState: AccessRequestState = { status: "idle" };

export async function createAccessRequest(
  companyId: string,
  _prevState: AccessRequestState,
  formData: FormData,
): Promise<AccessRequestState> {
  const session = await getSupabaseSession();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = requestSchema.safeParse({
    access_type: formData.get("access_type"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid request.",
    };
  }

  const supabase = await createServerSupabaseClient();

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      status: "error",
      message: "You do not have access to this company.",
    };
  }

  const { error } = await supabase.from("audit_logs").insert({
    actor: session.user.id,
    company_id: companyId,
    action: "access_request",
    target_type: "integration",
    details: {
      access_type: parsed.data.access_type,
      notes: parsed.data.notes ?? null,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error(error);
    return {
      status: "error",
      message: "Could not log the access request.",
    };
  }

  revalidatePath(`/app/companies/${companyId}`);

  return {
    status: "success",
    message: "Access request logged for your team.",
  };
}
