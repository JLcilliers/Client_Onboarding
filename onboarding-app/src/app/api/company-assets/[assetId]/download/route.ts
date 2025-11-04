import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  assetId: z.string().uuid("Invalid asset identifier."),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to download assets." },
      { status: 401 },
    );
  }

  const resolvedParams = await params;
  const parsedParams = paramsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.issues[0]?.message ?? "Invalid asset." },
      { status: 400 },
    );
  }

  const { assetId } = parsedParams.data;

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .select("company_id,path,label,bucket")
    .eq("id", assetId)
    .maybeSingle();

  if (assetError || !asset) {
    return NextResponse.json(
      { error: "Asset not found." },
      { status: 404 },
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", asset.company_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "You do not have access to this asset." },
      { status: 403 },
    );
  }

  const serviceClient = createServiceRoleSupabaseClient();

  const { data: signedUrl, error: signedError } = await serviceClient.storage
    .from(asset.bucket)
    .createSignedUrl(asset.path, 60 * 5, {
      download: asset.label ?? undefined,
    });

  if (signedError || !signedUrl) {
    return NextResponse.json(
      { error: "Unable to generate download URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: signedUrl.signedUrl,
  });
}
