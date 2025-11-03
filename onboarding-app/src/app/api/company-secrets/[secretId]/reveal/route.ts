import { NextResponse } from "next/server";
import { z } from "zod";

import { serverEnv } from "@/env/server";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";

const paramsSchema = z.object({
  secretId: z.string().uuid("Invalid secret identifier."),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ secretId: string }> },
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view secrets." },
      { status: 401 },
    );
  }

  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.issues[0]?.message ?? "Invalid secret." },
      { status: 400 },
    );
  }

  const { secretId } = parsedParams.data;

  const { data: secretMeta, error: secretError } = await supabase
    .from("secrets")
    .select("company_id,label,secret_type")
    .eq("id", secretId)
    .maybeSingle();

  if (secretError || !secretMeta) {
    return NextResponse.json({ error: "Secret not found." }, { status: 404 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", secretMeta.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "You do not have access to this secret." },
      { status: 403 },
    );
  }

  if (
    membership.role !== "agency_admin" &&
    membership.role !== "client_admin"
  ) {
    return NextResponse.json(
      { error: "Only admins can view stored secrets." },
      { status: 403 },
    );
  }

  const serviceClient = createServiceRoleSupabaseClient();
  const { data: decrypted, error: decryptError } = await serviceClient.rpc(
    "decrypt_secret",
    {
      p_secret_id: secretId,
      p_passphrase: serverEnv.SUPABASE_SECRET_PASSPHRASE,
    },
  );

  if (decryptError || !decrypted || decrypted.length === 0) {
    return NextResponse.json(
      { error: "Failed to decrypt secret." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    label: decrypted[0].label,
    secretType: decrypted[0].secret_type,
    secretValue: decrypted[0].secret_value,
  });
}
