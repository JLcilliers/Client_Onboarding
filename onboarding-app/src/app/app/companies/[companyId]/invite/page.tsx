import Link from "next/link";
import { notFound } from "next/navigation";

import { InviteForm } from "./invite-form";

import { getCompanyById } from "@/lib/data/companies";

type InvitePageProps = {
  params: {
    companyId: string;
  };
};

export default async function InvitePage({ params }: InvitePageProps) {
  const company = await getCompanyById(params.companyId);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/app/companies"
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to companies
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Invite collaborators
          </h1>
          <p className="text-sm text-muted-foreground">
            Send a secure onboarding invite for{" "}
            <span className="font-medium text-foreground">{company.name}</span>.
            Share the generated link via email or your preferred channel. The
            invite automatically maps the user to this company after they sign in
            with Google.
          </p>
        </div>
      </div>
      <InviteForm companyId={company.id} />
    </div>
  );
}
