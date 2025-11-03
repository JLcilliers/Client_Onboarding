import Link from "next/link";

import { getCompanyTable, type CompanyTableRow } from "@/lib/data/companies";

function formatStatus(status: string) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "in_progress":
      return "In progress";
    case "reviewed":
      return "Reviewed";
    default:
      return status.replace("_", " ");
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function CompaniesPage() {
  let companies: CompanyTableRow[] = [];

  try {
    companies = await getCompanyTable();
  } catch (error) {
    console.error("Failed to load companies", error);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Review every client workspace and the status of their onboarding
          questionnaire. This table will grow with filters, exports, and activity
          history in subsequent iterations.
        </p>
      </header>
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <table className="min-w-full divide-y divide-border/60 text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Business type</th>
              <th className="px-6 py-3">Services</th>
              <th className="px-6 py-3">Last update</th>
              <th className="px-6 py-3 text-right">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {companies.length > 0 ? (
              companies.map((company) => (
                <tr key={company.id} className="text-foreground/90">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{company.name}</div>
                    {company.website ? (
                      <a
                        href={company.website}
                        className="text-xs text-primary underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {company.website}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {company.businessType ?? "--"}
                  </td>
                  <td className="px-6 py-4">
                    {company.services?.length
                      ? company.services.join(", ")
                      : "No services captured"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(company.updatedAt ?? company.submittedAt ?? null)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {formatStatus(company.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/app/companies/${company.id}/invite`}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary"
                    >
                      Invite
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No companies found. Once clients submit the onboarding wizard,
                  their profiles will appear here automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
