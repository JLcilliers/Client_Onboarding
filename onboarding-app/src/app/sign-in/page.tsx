import { redirect } from "next/navigation";

import { SignInView } from "./sign-in-view";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { getInviteByToken } from "@/lib/data/invites";

type SignInPageProps = {
  searchParams: {
    invite?: string;
    error?: string;
  };
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/app");
  }

  let invite = null;
  if (searchParams.invite) {
    try {
      const metadata = await getInviteByToken(searchParams.invite);
      if (metadata) {
        invite = {
          token: searchParams.invite,
          email: metadata.email,
          companyName: metadata.companyName,
        };
      }
    } catch (error) {
      console.error("Failed to load invite details", error);
    }
  }

  return <SignInView invite={invite} errorMessage={searchParams.error} />;
}
