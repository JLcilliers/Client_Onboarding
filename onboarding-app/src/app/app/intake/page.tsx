import { IntakeWizard } from "./intake-wizard";

import { getAuthenticatedUser } from "@/lib/auth/session";

export default async function IntakePage() {
  const user = await getAuthenticatedUser();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Onboarding questionnaire
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.email
            ? `Responses will be associated with ${user.email}.`
            : "Sign in to capture responses under your account."}
        </p>
      </header>
      <IntakeWizard />
    </div>
  );
}
