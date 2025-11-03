import Link from "next/link";

import { getAuthenticatedUser } from "@/lib/auth/session";
import {
  type CompanySummary,
  getRecentCompanySummaries,
} from "@/lib/data/companies";

const quickLinks = [
  {
    title: "Start new intake",
    description: "Launch the onboarding wizard for a new client company.",
    href: "/app/intake",
  },
  {
    title: "View companies",
    description: "Browse all client profiles and questionnaire history.",
    href: "/app/companies",
  },
];

function formatDate(dateString: string | null) {
  if (!dateString) return "Not yet submitted";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not yet submitted";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string) {
  switch (status) {
    case "submitted":
      return "Questionnaire submitted";
    case "in_progress":
      return "In progress";
    case "reviewed":
      return "Reviewed";
    default:
      return status.replace("_", " ");
  }
}

export default async function AppHomePage() {
  const user = await getAuthenticatedUser();
  let companySummaries: CompanySummary[] = [];

  try {
    companySummaries = await getRecentCompanySummaries();
  } catch (error) {
    console.error("Failed to load company summaries", error);
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome back
          {user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""} 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track client readiness, finish questionnaires, and centralize access
          across SEO, PPC, social, and development services.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-dashed border-border px-6 py-5 transition hover:border-primary/60 hover:bg-primary/5"
            >
              <h2 className="text-base font-semibold text-foreground">
                {link.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Active companies
          </h2>
          <Link
            href="/app/companies"
            className="text-sm font-medium text-primary transition hover:text-primary/80"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {companySummaries.length > 0 ? (
            companySummaries.map((company: CompanySummary) => (
              <article
                key={company.id}
                className="rounded-xl border border-border bg-background p-5 transition hover:shadow-md"
              >
                <header className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    {company.name}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {statusLabel(company.status)}
                  </span>
                </header>
                <p className="mt-3 text-sm text-muted-foreground">
                  Services:{" "}
                  {company.services?.length
                    ? company.services.join(", ")
                    : "No services selected"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {company.submittedAt
                    ? `Submitted ${formatDate(company.submittedAt)}`
                    : "Submission pending"}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              No questionnaires submitted yet. Start by inviting a client to
              complete the onboarding wizard.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
