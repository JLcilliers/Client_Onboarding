"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { clientEnv } from "@/env/client";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z
    .enum(["client_admin", "client_member", "viewer"], {
      message: "Select a valid role",
    })
    .default("client_member"),
});

export type InviteFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  inviteLink?: string;
};

const initialState: InviteFormState = { status: "idle" };
export { initialState as inviteFormInitialState };

export async function createInviteAction(
  companyId: string,
  _prevState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await getSupabaseSession();
  if (!session?.user) {
    return {
      status: "error",
      message: "You must be signed in to send invites.",
    };
  }

  const supabase = createServerSupabaseClient();
  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      status: "error",
      message:
        "You need to be a member of this company to send invites.",
    };
  }

  if (
    membership.role !== "agency_admin" &&
    membership.role !== "agency_member" &&
    membership.role !== "client_admin"
  ) {
    return {
      status: "error",
      message: "You do not have permission to invite additional users.",
    };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") ?? "client_member",
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return {
      status: "error",
      message: firstError?.message ?? "Enter a valid email.",
    };
  }

  const inviteToken = crypto.randomUUID().replace(/-/g, "");
  const serviceClient = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const { error: insertError } = await serviceClient.from("invites").insert({
    company_id: companyId,
    email: parsed.data.email,
    role: parsed.data.role,
    token: inviteToken,
    accepted: false,
    created_at: now,
  });

  if (insertError) {
    return {
      status: "error",
      message: "Unable to create invite. Please try again.",
    };
  }

  await serviceClient.from("audit_logs").insert({
    actor: session.user.id,
    company_id: companyId,
    action: "invite_sent",
    target_type: "invite",
    details: {
      email: parsed.data.email,
      role: parsed.data.role,
    },
    created_at: now,
  });

  const inviteLink = `${clientEnv.SITE_URL}/sign-in?invite=${inviteToken}`;

  revalidatePath(`/app/companies/${companyId}/invite`);
  revalidatePath(`/app/companies/${companyId}`);
  revalidatePath("/app/companies");

  return {
    status: "success",
    message: "Invite created successfully. Share the link below.",
    inviteLink,
  };
}
