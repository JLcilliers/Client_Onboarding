import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const requestSchema = z.object({
  companyId: z.string().uuid("Invalid company identifier."),
  fileName: z.string().min(1, "File name is required."),
  fileType: z.string().optional(),
  label: z.string().optional(),
  kind: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to upload assets." },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
      { status: 400 },
    );
  }

  const { companyId, fileName, fileType, label, kind } = parsed.data;

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "You do not have permission to upload files for this company." },
      { status: 403 },
    );
  }

  const serviceClient = createServiceRoleSupabaseClient();
  const objectPath = `${companyId}/${Date.now()}-${fileName}`;

  const { data: signedUpload, error: signedError } = await serviceClient.storage
    .from("company-assets")
    .createSignedUploadUrl(objectPath, 60 * 5);

  if (signedError || !signedUpload) {
    return NextResponse.json(
      { error: "Unable to generate upload URL." },
      { status: 500 },
    );
  }

  const { data: assetRecord, error: assetError } = await serviceClient
    .from("assets")
    .insert({
      company_id: companyId,
      bucket: "company-assets",
      path: objectPath,
      label: label ?? fileName,
      kind: kind ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (assetError || !assetRecord) {
    return NextResponse.json(
      { error: "Failed to register asset metadata." },
      { status: 500 },
    );
  }

  await serviceClient.from("audit_logs").insert({
    actor: user.id,
    company_id: companyId,
    action: "asset_upload_requested",
    target_type: "asset",
    target_id: assetRecord.id,
    details: {
      file_name: fileName,
      kind,
    },
    created_at: new Date().toISOString(),
  });

  revalidatePath(`/app/companies/${companyId}`);

  return NextResponse.json({
    assetId: assetRecord.id,
    path: objectPath,
    token: signedUpload.token,
    fileType,
  });
}
