import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityFeed } from "@/components/company/activity-feed";
import { SectionTabs } from "@/components/company/section-tabs";
import { AssetUploader } from "@/components/company/asset-uploader";
import { AssetDownloadButton } from "@/components/company/asset-download-button";
import { SecretForm } from "@/components/company/secret-form";
import { SecretList } from "@/components/company/secret-list";
import { AccessRequestForm } from "@/components/company/access-request-form";
import { onboardingSections } from "@/data/forms/onboarding";
import {
  getCompanyActivity,
  getCompanyDetail,
} from "@/lib/data/companies";

type CompanyDetailPageProps = {
  params: {
    companyId: string;
  };
};

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

function formatAnswer(value: unknown) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "Not provided";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return value.toString();
  }

  const stringValue = value?.toString().trim();
  return stringValue ? stringValue : "Not provided";
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const company = await getCompanyDetail(params.companyId);

  if (!company) {
    notFound();
  }

  const activity = await getCompanyActivity(company.id);

  const sections = onboardingSections
    .filter((section) => section.alwaysVisible || company.questionnaire)
    .filter((section) => {
      if (section.alwaysVisible) return true;
      if (!company.questionnaire) return false;
      if (!section.serviceKeys || section.serviceKeys.length === 0) return true;
      const services = company.questionnaire.selectedServices ?? [];
      return section.serviceKeys.some((service) => services.includes(service));
    })
    .map((section) => {
      const responseKey = SECTION_KEY_MAP[section.key] ?? section.key;
      const response =
        company.questionnaire?.responses?.[responseKey]?.values ?? {};
      return {
        key: section.key,
        title: section.title,
        description: section.subtitle,
        content: (
          <div className="space-y-3 rounded-2xl border border-border bg-background p-6">
            {section.fields.map((field) => (
              <div
                key={field.key}
                className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm font-medium text-foreground">
                  {field.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatAnswer(response[field.key])}
                </span>
              </div>
            ))}
          </div>
        ),
      };
    });

  const summaryCards = [
    {
      label: "Status",
      value: company.questionnaire?.status
        ? company.questionnaire.status.replace("_", " ")
        : "Not started",
    },
    {
      label: "Selected services",
      value:
        company.questionnaire?.selectedServices?.join(", ") ??
        "No services recorded",
    },
    {
      label: "Last submission",
      value: company.questionnaire?.submittedAt
        ? new Date(company.questionnaire.submittedAt).toLocaleString()
        : "Awaiting submission",
    },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/app/companies"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          Back to companies
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {company.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {company.website}
                </a>
              ) : (
                "Website not provided"
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/companies/${company.id}/invite`}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Invite collaborator
            </Link>
            <Link
              href="/app/intake"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              Start new intake
            </Link>
            <a
              href={`/api/companies/${company.id}/export`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Export CSV
            </a>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Service coverage
          </h2>
          {company.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {company.services.map((service) => (
                <span
                  key={service.key}
                  className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground"
                >
                  {service.label}
                  <span className="ml-2 text-muted-foreground">
                    {service.status.replace("_", " ")}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No services have been recorded yet for this company.
            </p>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Assets & files
            </h2>
            <AssetUploader companyId={company.id} />
          </div>
          {company.assets.length > 0 ? (
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background">
              {company.assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {asset.label ?? asset.path.split("/").pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded {new Date(asset.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <AssetDownloadButton assetId={asset.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No files have been uploaded yet.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Secure credentials
          </h2>
          <p className="text-sm text-muted-foreground">
            Store sensitive access details with encryption. Only company and
            agency admins can reveal these values.
          </p>
        </div>
        <SecretForm companyId={company.id} />
        <SecretList secrets={company.secrets} />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Access requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Log outstanding access you still need from the client. Requests
            appear in the activity feed for quick follow-up.
          </p>
        </div>
        <AccessRequestForm companyId={company.id} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Questionnaire responses
        </h2>
        {sections.length > 0 ? (
          <SectionTabs sections={sections} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            No questionnaire responses available yet.
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Activity
        </h2>
        <ActivityFeed
          entries={activity.map((row) => ({
            id: row.id,
            action: row.action,
            createdAt: row.created_at,
            details: row.details,
          }))}
        />
      </section>
    </div>
  );
}
