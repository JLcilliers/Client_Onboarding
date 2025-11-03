import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { SupabaseListener } from "@/components/auth/supabase-listener";
import { getSupabaseSession } from "@/lib/auth/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Client Onboarding Portal",
    template: "%s | Client Onboarding Portal",
  },
  description:
    "Secure intake and collaboration workspace for digital marketing clients and account managers.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSupabaseSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <Suspense fallback={null}>
          <SupabaseListener accessToken={session?.access_token ?? undefined} />
          {children}
        </Suspense>
      </body>
    </html>
  );
}
