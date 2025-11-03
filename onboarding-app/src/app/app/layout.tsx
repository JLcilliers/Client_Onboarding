import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedUser } from "@/lib/auth/session";

const navigation = [
  { name: "Overview", href: "/app" },
  { name: "Intake wizard", href: "/app/intake" },
  { name: "Companies", href: "/app/companies" },
];

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <Link
              href="/app"
              className="text-lg font-semibold text-foreground"
            >
              Client Onboarding
            </Link>
            <p className="text-xs text-muted-foreground">
              {user?.email ?? "Signed out"}
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-border/70 hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
