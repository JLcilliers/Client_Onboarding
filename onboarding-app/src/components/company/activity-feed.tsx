import { type ComponentPropsWithoutRef } from "react";

type ActivityEntry = {
  id: number;
  action: string;
  createdAt: string;
  details: Record<string, unknown> | null;
};

const ACTION_LABELS: Record<string, string> = {
  submit_questionnaire: "Questionnaire submitted",
  invite_sent: "Invite sent",
  invite_accepted: "Invite accepted",
  update_response: "Responses updated",
  asset_upload_requested: "Asset upload requested",
  access_request: "Access requested",
  secret_created: "Secret stored",
};

function formatLabel(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityFeed({
  entries,
  ...props
}: {
  entries: ActivityEntry[];
} & ComponentPropsWithoutRef<"div">) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-2xl border border-border bg-background px-6 py-5 text-sm text-muted-foreground"
        {...props}
      >
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div
      className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-background"
      {...props}
    >
      {entries.map((entry) => (
        <article key={entry.id} className="px-6 py-5 text-sm">
          <header className="flex items-center justify-between gap-3">
            <h4 className="font-medium text-foreground">
              {formatLabel(entry.action)}
            </h4>
            <span className="text-xs text-muted-foreground">
              {formatDate(entry.createdAt)}
            </span>
          </header>
          {entry.details ? (
            <dl className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {Object.entries(entry.details).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="min-w-[90px] font-medium capitalize text-foreground">
                    {key.replace(/_/g, " ")}
                  </dt>
                  <dd className="break-all">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </article>
      ))}
    </div>
  );
}
