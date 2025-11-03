"use client";

import { useFormState, useFormStatus } from "react-dom";

import {
  createInviteAction,
  inviteFormInitialState,
  type InviteFormState,
} from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Creating invite…" : "Create invite"}
    </button>
  );
}

export function InviteForm({ companyId }: { companyId: string }) {
  const formAction = createInviteAction.bind(null, companyId);
  const [state, action] = useFormState<InviteFormState>(
    formAction,
    inviteFormInitialState,
  );

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="client@example.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">Role</span>
          <select
            name="role"
            defaultValue="client_member"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="client_admin">Client admin</option>
            <option value="client_member">Client member</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
      </div>
      {state.status === "error" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message}
        </div>
      ) : null}
      {state.status === "success" ? (
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p>{state.message}</p>
          {state.inviteLink ? (
            <div className="break-all rounded-lg bg-white/60 px-3 py-2 font-mono text-xs text-emerald-700">
              {state.inviteLink}
            </div>
          ) : null}
        </div>
      ) : null}
      <SubmitButton />
    </form>
  );
}
