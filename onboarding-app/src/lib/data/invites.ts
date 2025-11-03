import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type InviteMetadata = {
  id: string;
  email: string;
  role: string;
  companyId: string;
  companyName: string;
  accepted: boolean;
};

export async function getInviteByToken(token: string): Promise<InviteMetadata | null> {
  if (!token) return null;

  const supabase = createServiceRoleSupabaseClient();

  type InviteRow = {
    id: string;
    email: string;
    role: string;
    accepted: boolean;
    company_id: string;
    companies: { id: string; name: string } | null;
  };

  const { data, error } = await supabase
    .from("invites")
    .select<InviteRow>(
      "id,email,role,accepted,company_id,companies!inner(id,name)",
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    companyId: data.company_id,
    companyName: data.companies?.name ?? "Unknown company",
    accepted: data.accepted,
  };
}

export async function acceptInviteByToken({
  token,
  userId,
  userEmail,
}: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const supabase = createServiceRoleSupabaseClient();

  const { data: invite, error: inviteError } = await supabase
    .from("invites")
    .select("id,email,role,accepted,company_id")
    .eq("token", token)
    .maybeSingle();

  if (inviteError) {
    throw new Error("Unable to validate the invite token.");
  }

  if (!invite) {
    throw new Error("This invite link is invalid or has expired.");
  }

  if (invite.accepted) {
    return invite.company_id;
  }

  if (
    invite.email &&
    invite.email.toLowerCase() !== userEmail.toLowerCase()
  ) {
    throw new Error(
      `This invite was sent to ${invite.email}. Please sign in with that email address.`,
    );
  }

  const now = new Date().toISOString();

  const { error: membershipError } = await supabase
    .from("company_members")
    .upsert(
      {
        company_id: invite.company_id,
        user_id: userId,
        role: invite.role ?? "client_member",
        created_at: now,
      },
      { onConflict: "company_id,user_id" },
    );

  if (membershipError) {
    throw new Error("Failed to attach your account to the company.");
  }

  const { error: inviteUpdateError } = await supabase
    .from("invites")
    .update({ accepted: true })
    .eq("id", invite.id);

  if (inviteUpdateError) {
    throw new Error("Unable to mark this invite as accepted.");
  }

  await supabase.from("audit_logs").insert({
    actor: userId,
    company_id: invite.company_id,
    action: "invite_accepted",
    target_type: "invite",
    target_id: invite.id,
    details: {
      email: invite.email,
    },
    created_at: now,
  });

  return invite.company_id;
}
