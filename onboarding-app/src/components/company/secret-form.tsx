"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  createSecret,
  initialSecretFormState,
  type SecretFormState,
} from "@/app/app/companies/[companyId]/secrets/actions";

const secretTypes = [
  { value: "hosting", label: "Hosting / Server" },
  { value: "dns", label: "DNS / Registrar" },
  { value: "analytics", label: "Analytics" },
  { value: "ads", label: "Advertising" },
  { value: "other", label: "Other" },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Saving…" : "Store secret"}
    </button>
  );
}

export function SecretForm({ companyId }: { companyId: string }) {
  const formAction = createSecret.bind(null, companyId);
  const [state, action] = useFormState<SecretFormState>(
    formAction,
    initialSecretFormState,
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Label</span>
          <input
            type="text"
            name="label"
            required
            placeholder="e.g. Primary hosting login"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Secret type</span>
          <select
            name="secret_type"
            defaultValue="hosting"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {secretTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="space-y-2 text-sm">
        <span className="font-medium text-foreground">Secret value</span>
        <textarea
          name="secret_value"
          required
          rows={4}
          placeholder="Paste credentials or secure notes here"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>
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
