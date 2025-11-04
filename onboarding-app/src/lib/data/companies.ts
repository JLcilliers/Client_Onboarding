import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SERVICE_KEY_TO_DISPLAY } from "@/lib/constants/services";

type QuestionnaireRow = {
  id: string;
  status: string;
  submitted_at: string | null;
  selected_services: string[];
};

type CompanyRow = {
  id: string;
  name: string;
  website: string | null;
  business_type: string | null;
  updated_at: string | null;
  questionnaires: QuestionnaireRow[] | null;
};

export type CompanyDetail = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  businessType: string | null;
  country: string | null;
  timezone: string | null;
  notes: string | null;
  services: {
    key: string;
    label: string;
    status: string;
  }[];
  secrets: {
    id: string;
    label: string | null;
    secretType: string;
    createdAt: string;
  }[];
  assets: {
    id: string;
    label: string | null;
    path: string;
    kind: string | null;
    createdAt: string;
  }[];
  questionnaire: {
    id: string;
    status: string;
    submittedAt: string | null;
    selectedServices: string[];
    responses: Record<
      string,
      { updatedAt: string | null; values: Record<string, unknown> }
    >;
  } | null;
};

export type CompanySummary = {
  id: string;
  name: string;
  website: string | null;
  status: string;
  submittedAt: string | null;
  services: string[];
};

export type CompanyTableRow = {
  id: string;
  name: string;
  website: string | null;
  businessType: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  status: string;
  services: string[];
};

export async function getCompanyById(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id,name")
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
  };
}

export async function getCompanyDetail(
  companyId: string,
): Promise<CompanyDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select(
      "id,name,website,industry,business_type,country,timezone,notes",
    )
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    throw companyError;
  }

  if (!company) {
    return null;
  }

  const { data: questionnaire, error: questionnaireError } = await supabase
    .from("questionnaires")
    .select("id,status,submitted_at,selected_services,updated_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (questionnaireError) {
    throw questionnaireError;
  }

  let responses: NonNullable<CompanyDetail["questionnaire"]>["responses"] = {};

  if (questionnaire) {
    const { data: responseRows, error: responsesError } = await supabase
      .from("questionnaire_responses")
      .select("section_key,responses,updated_at")
      .eq("questionnaire_id", questionnaire.id);

    if (responsesError) {
      throw responsesError;
    }

    responses =
      responseRows?.reduce<
        NonNullable<CompanyDetail["questionnaire"]>["responses"]
      >((acc, row) => {
        acc[row.section_key] = {
          updatedAt: row.updated_at ?? null,
          values: row.responses ?? {},
        };
        return acc;
      }, {}) ?? {};
  }

  const { data: companyServices, error: companyServicesError } = await supabase
    .from("company_services")
    .select("status,services(key,label)")
    .eq("company_id", companyId);

  if (companyServicesError) {
    throw companyServicesError;
  }

  const services =
    companyServices?.map((item) => {
      const service = item.services as unknown as { key: string; label: string } | null;
      return {
        key: service?.key ?? "",
        label: service?.label ?? service?.key ?? "",
        status: item.status,
      };
    }) ?? [];

  const { data: assets, error: assetsError } = await supabase
    .from("assets")
    .select("id,label,path,kind,created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (assetsError) {
    throw assetsError;
  }

  const { data: secrets, error: secretsError } = await supabase
    .from("secrets")
    .select("id,label,secret_type,created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (secretsError) {
    throw secretsError;
  }

  return {
    id: company.id,
    name: company.name,
    website: company.website,
    industry: company.industry,
    businessType: company.business_type,
    country: company.country,
    timezone: company.timezone,
    notes: company.notes,
    services,
    assets:
      assets?.map((asset) => ({
        id: asset.id,
        label: asset.label ?? null,
        path: asset.path,
        kind: asset.kind ?? null,
        createdAt: asset.created_at,
      })) ?? [],
    secrets:
      secrets?.map((secret) => ({
        id: secret.id,
        label: secret.label,
        secretType: secret.secret_type,
        createdAt: secret.created_at,
      })) ?? [],
    questionnaire: questionnaire
      ? {
          id: questionnaire.id,
          status: questionnaire.status,
          submittedAt: questionnaire.submitted_at ?? null,
          selectedServices:
            questionnaire.selected_services?.map(
              (serviceKey: string) =>
                SERVICE_KEY_TO_DISPLAY[serviceKey] ?? serviceKey.toUpperCase(),
            ) ?? [],
          responses,
        }
      : null,
  };
}

export async function getRecentCompanySummaries(limit = 4) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id,name,website,business_type,updated_at,questionnaires (id,status,submitted_at,selected_services)",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CompanyRow[];

  const summaries: CompanySummary[] = rows.map((company) => {
    const latestQuestionnaire =
      company.questionnaires?.sort((a, b) => {
        const aDate = a.submitted_at ? Date.parse(a.submitted_at) : 0;
        const bDate = b.submitted_at ? Date.parse(b.submitted_at) : 0;
        return bDate - aDate;
      })[0] ?? null;

    const services =
      latestQuestionnaire?.selected_services?.map(
        (serviceKey) =>
          SERVICE_KEY_TO_DISPLAY[serviceKey] ?? serviceKey.toUpperCase(),
      ) ?? [];

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      status: latestQuestionnaire?.status ?? "in_progress",
      submittedAt: latestQuestionnaire?.submitted_at ?? null,
      services,
    };
  });

  return summaries;
}

export async function getCompanyTable(): Promise<CompanyTableRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id,name,website,business_type,updated_at,questionnaires (id,status,submitted_at,selected_services)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CompanyRow[];

  return rows.map((company) => {
    const latestQuestionnaire =
      company.questionnaires?.sort((a, b) => {
        const aDate = a.submitted_at ? Date.parse(a.submitted_at) : 0;
        const bDate = b.submitted_at ? Date.parse(b.submitted_at) : 0;
        return bDate - aDate;
      })[0] ?? null;

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      businessType: company.business_type,
      updatedAt: company.updated_at,
      status: latestQuestionnaire?.status ?? "in_progress",
      submittedAt: latestQuestionnaire?.submitted_at ?? null,
      services:
        latestQuestionnaire?.selected_services?.map(
          (serviceKey) =>
            SERVICE_KEY_TO_DISPLAY[serviceKey] ?? serviceKey.toUpperCase(),
        ) ?? [],
    };
  });
}

type AuditLogRow = {
  id: number;
  action: string;
  created_at: string;
  details: Record<string, unknown> | null;
};

export async function getCompanyActivity(companyId: string, limit = 10) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id,action,details,created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as AuditLogRow[];
}
