"use server";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  companyId: z.string().uuid("Invalid company identifier."),
});

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } },
) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to export data." },
      { status: 401 },
    );
  }

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    return NextResponse.json(
      { error: parsedParams.error.issues[0]?.message ?? "Invalid company." },
      { status: 400 },
    );
  }

  const { companyId } = parsedParams.data;

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("user_id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: "You do not have access to this company." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("section_key,responses")
    .eq(
      "questionnaire_id",
      supabase
        .from("questionnaires")
        .select("id")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false })
        .limit(1),
    );

  if (error) {
    return NextResponse.json(
      { error: "Unable to fetch questionnaire responses." },
      { status: 500 },
    );
  }

  const flatRows: { section: string; field: string; value: string }[] = [];
  for (const row of data ?? []) {
    const responses = (row.responses as Record<string, unknown>) ?? {};
    for (const [key, value] of Object.entries(responses)) {
      flatRows.push({
        section: row.section_key,
        field: key,
        value: String(value ?? ""),
      });
    }
  }

  const header = "section,field,value";
  const csv = [
    header,
    ...flatRows.map((row) =>
      [row.section, row.field, row.value.replace(/"/g, '""')].map((cell) =>
        `"${cell}"`,
      ).join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="company-${companyId}.csv"`,
    },
  });
}
