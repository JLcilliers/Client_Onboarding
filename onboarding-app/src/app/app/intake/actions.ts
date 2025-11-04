"use server";

import { revalidatePath } from "next/cache";

import { onboardingSections } from "@/data/forms/onboarding";
import { DISPLAY_SERVICE_TO_KEY } from "@/lib/constants/services";
import { getSupabaseSession } from "@/lib/auth/session";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import type { IntakeFormValues } from "./schema";
import { intakeSchema } from "./schema";

const SECTION_KEY_MAP: Record<string, string> = {
  company: "business",
  services: "services",
  seo: "seo",
  ppc: "ppc",
  social: "social",
  analytics: "analytics",
  webdev: "webdev",
  email: "email",
};

type DraftContext = {
  companyId?: string;
  questionnaireId?: string;
};

export type SaveSectionResult = {
  status: "success" | "error";
  message?: string;
  companyId?: string;
  questionnaireId?: string;
};

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractServiceKeys(values: IntakeFormValues) {
  const displayServices =
    (values.selected_services as string[] | undefined)?.filter(Boolean) ?? [];

  const serviceKeys = Array.from(
    new Set(
      displayServices
        .map((service) => DISPLAY_SERVICE_TO_KEY[service])
        .filter((key): key is string => Boolean(key)),
    ),
  );

  return { displayServices, serviceKeys };
}

async function ensureDraftEntities({
  values,
  userId,
  context,
}: {
  values: IntakeFormValues;
  userId: string;
  context: DraftContext;
}): Promise<{ companyId: string; questionnaireId: string; serviceKeys: string[] }> {
  const authClient = await createServerSupabaseClient();
  const serviceClient = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const { serviceKeys } = extractServiceKeys(values);
  const companyName = normalizeNullable(values.company_name);
  const website = normalizeNullable(values.website);
  const industry = normalizeNullable(values.industry);
  const businessType = normalizeNullable(values.business_type);
  const country = normalizeNullable(values.country);
  const timezone = normalizeNullable(values.timezone);

  let companyId = context.companyId;
  let questionnaireId = context.questionnaireId;

  if (!companyId) {
    if (!companyName) {
      throw new Error("Please provide the company name before saving progress.");
    }

    const { data: newCompany, error: insertError } = await serviceClient
      .from("companies")
      .insert({
        name: companyName,
        website,
        industry,
        business_type: businessType,
        country,
        timezone,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (insertError || !newCompany) {
      throw new Error("Failed to create the company profile.");
    }

    companyId = newCompany.id;
  } else {
    const companyUpdate: Record<string, unknown> = {
      updated_at: now,
    };

    if (companyName) companyUpdate.name = companyName;
    if (website !== undefined) companyUpdate.website = website;
    if (industry !== undefined) companyUpdate.industry = industry;
    if (businessType !== undefined) companyUpdate.business_type = businessType;
    if (country !== undefined) companyUpdate.country = country;
    if (timezone !== undefined) companyUpdate.timezone = timezone;

    const { error: updateError } = await serviceClient
      .from("companies")
      .update(companyUpdate)
      .eq("id", companyId);

    if (updateError) {
      throw new Error("Unable to update company information.");
    }
  }

  const { data: membership, error: membershipError } = await authClient
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership) {
    const { error: attachError } = await serviceClient
      .from("company_members")
      .upsert(
        {
          company_id: companyId,
          user_id: userId,
          role: "client_admin",
          created_at: now,
        },
        { onConflict: "company_id,user_id" },
      );

    if (attachError) {
      throw new Error("Unable to attach your account to the company profile.");
    }
  }

  if (serviceKeys.length > 0) {
    const { data: serviceRows, error: servicesError } = await serviceClient
      .from("services")
      .select("id,key")
      .in("key", serviceKeys);

    if (servicesError) {
      throw new Error("Could not load service catalog.");
    }

    const { error: companyServicesError } = await serviceClient
      .from("company_services")
      .upsert(
        (serviceRows ?? []).map((service) => ({
          company_id: companyId!,
          service_id: service.id,
          status: "selected",
          created_at: now,
          updated_at: now,
        })),
        { onConflict: "company_id,service_id" },
      );

    if (companyServicesError) {
      throw new Error("Failed to connect services to the company.");
    }
  }

  if (!questionnaireId) {
    const { data: questionnaire, error: questionnaireError } = await serviceClient
      .from("questionnaires")
      .insert({
        company_id: companyId,
        version: 1,
        selected_services: serviceKeys,
        status: "in_progress",
        started_by: userId,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (questionnaireError || !questionnaire) {
      throw new Error("Failed to create questionnaire draft.");
    }

    questionnaireId = questionnaire.id;
  } else {
    const { error: questionnaireUpdateError } = await serviceClient
      .from("questionnaires")
      .update({
        selected_services: serviceKeys,
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", questionnaireId);

    if (questionnaireUpdateError) {
      throw new Error("Unable to update questionnaire draft.");
    }
  }

  if (!companyId) {
    throw new Error("Company ID is required but was not created or provided.");
  }

  if (!questionnaireId) {
    throw new Error("Questionnaire ID is required but was not created.");
  }

  return {
    companyId,
    questionnaireId,
    serviceKeys,
  };
}

export async function saveIntakeSection({
  sectionKey,
  values,
  context,
}: {
  sectionKey: string;
  values: IntakeFormValues;
  context: DraftContext;
}): Promise<SaveSectionResult> {
  const parsed = intakeSchema.partial().safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid form data.",
    };
  }

  const session = await getSupabaseSession();
  if (!session?.user) {
    return {
      status: "error",
      message: "You must be signed in to save progress.",
    };
  }

  const sectionDefinition = onboardingSections.find(
    (section) => section.key === sectionKey,
  );

  if (!sectionDefinition) {
    return {
      status: "error",
      message: "Unknown questionnaire section.",
    };
  }

  try {
    const draft = await ensureDraftEntities({
      values: parsed.data,
      userId: session.user.id,
      context,
    });

    const serviceClient = createServiceRoleSupabaseClient();
    const now = new Date().toISOString();
    const dbSectionKey = SECTION_KEY_MAP[sectionKey] ?? sectionKey;

    const responsePayload: Record<string, unknown> = {};
    for (const field of sectionDefinition.fields) {
      responsePayload[field.key] =
        parsed.data[field.key as keyof IntakeFormValues] ?? null;
    }

    const { error: upsertError } = await serviceClient
      .from("questionnaire_responses")
      .upsert(
        {
          questionnaire_id: draft.questionnaireId,
          section_key: dbSectionKey,
          responses: responsePayload,
          updated_by: session.user.id,
          updated_at: now,
        },
        { onConflict: "questionnaire_id,section_key" },
      );

    if (upsertError) {
      throw new Error("Unable to save progress for this section.");
    }

    await serviceClient.from("audit_logs").insert({
      actor: session.user.id,
      company_id: draft.companyId,
      action: "update_response",
      target_type: "questionnaire",
      target_id: draft.questionnaireId,
      details: {
        section: dbSectionKey,
      },
      created_at: now,
    });

    return {
      status: "success",
      companyId: draft.companyId,
      questionnaireId: draft.questionnaireId,
      message: "Progress saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to save progress for this section.",
    };
  }
}

export async function submitIntake(
  values: IntakeFormValues,
  context: DraftContext,
) {
  const parsed = intakeSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(
      "The submitted data did not pass validation. Please review the required fields.",
    );
  }

  const session = await getSupabaseSession();
  if (!session?.user) {
    throw new Error("You must be signed in to submit the questionnaire.");
  }

  const draft = await ensureDraftEntities({
    values: parsed.data,
    userId: session.user.id,
    context,
  });

  const serviceClient = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  for (const section of onboardingSections) {
    const responses: Record<string, unknown> = {};
    for (const field of section.fields) {
      responses[field.key] =
        parsed.data[field.key as keyof IntakeFormValues] ?? null;
    }

    const { error: upsertError } = await serviceClient
      .from("questionnaire_responses")
      .upsert(
        {
          questionnaire_id: draft.questionnaireId,
          section_key: SECTION_KEY_MAP[section.key] ?? section.key,
          responses,
          updated_by: session.user.id,
          updated_at: now,
        },
        { onConflict: "questionnaire_id,section_key" },
      );

    if (upsertError) {
      throw new Error("Unable to store questionnaire responses.");
    }
  }

  const { error: questionnaireError } = await serviceClient
    .from("questionnaires")
    .update({
      status: "submitted",
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", draft.questionnaireId);

  if (questionnaireError) {
    throw new Error("Failed to finalise the questionnaire.");
  }

  await serviceClient.from("audit_logs").insert({
    actor: session.user.id,
    company_id: draft.companyId,
    action: "submit_questionnaire",
    target_type: "questionnaire",
    target_id: draft.questionnaireId,
    details: {
      selected_services: draft.serviceKeys,
      submitted_at: now,
    },
    created_at: now,
  });

  revalidatePath("/app");
  revalidatePath("/app/companies");
  revalidatePath(`/app/companies/${draft.companyId}`);

  return {
    status: "success" as const,
    companyId: draft.companyId,
    questionnaireId: draft.questionnaireId,
  };
}
