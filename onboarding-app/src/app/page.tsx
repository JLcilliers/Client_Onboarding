import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-12 px-6 py-16 text-center sm:text-left">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Digital Marketing Onboarding
        </span>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          One secure place for every intake detail, access request, and service
          requirement.
        </h1>
        <p className="text-lg text-muted-foreground sm:max-w-2xl">
          Invite clients, collect SEO, PPC, social, and development information,
          and give your team a single source of truth powered by Supabase row
          level security.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
        <Link
          href="/sign-in"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:bg-foreground/80"
        >
          Sign in with Google
        </Link>
        <a
          href="#features"
          className="rounded-full border border-foreground/20 px-6 py-3 text-sm font-medium text-foreground transition hover:border-foreground/40 hover:text-foreground/80"
        >
          View product plan
        </a>
      </div>
    </div>
  );
}
