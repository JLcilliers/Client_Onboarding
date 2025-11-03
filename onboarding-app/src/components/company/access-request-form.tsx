"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  createAccessRequest,
  initialAccessRequestState,
  type AccessRequestState,
} from "@/app/app/companies/[companyId]/access/actions";

const accessOptions = [
  { value: "ga4", label: "Google Analytics 4" },
  { value: "gsc", label: "Google Search Console" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta", label: "Meta Business Manager" },
  { value: "tag_manager", label: "Google Tag Manager" },
  { value: "other", label: "Other platform" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Logging…" : "Log access request"}
    </button>
  );
}

export function AccessRequestForm({ companyId }: { companyId: string }) {
  const formAction = createAccessRequest.bind(null, companyId);
  const [state, action] = useFormState<AccessRequestState>(
    formAction,
    initialAccessRequestState,
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl border border-border bg-background p-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Access type</span>
          <select
            name="access_type"
            defaultValue="ga4"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {accessOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">
            Additional notes (optional)
          </span>
          <input
            type="text"
            name="notes"
            placeholder="e.g. Request access for analytics@agency.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>
      {state.status === "error" ? (
        <p className="text-sm text-red-600">{state.message}</p>
      ) : null}
      {state.status === "success" ? (
        <p className="text-sm text-emerald-600">{state.message}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
