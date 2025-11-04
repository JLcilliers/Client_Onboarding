"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSupabaseSession } from "@/lib/auth/session";
import {
  createServerSupabaseClient,
  createServiceRoleSupabaseClient,
} from "@/lib/supabase/server";
import { serverEnv } from "@/env/server";

const secretSchema = z.object({
  label: z.string().min(1, "Label is required."),
  secret_type: z.string().min(1, "Select a secret type."),
  secret_value: z.string().min(1, "Secret value cannot be empty."),
});

export type SecretFormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export const initialSecretFormState: SecretFormState = { status: "idle" };

export async function createSecret(
  companyId: string,
  _prevState: SecretFormState,
  formData: FormData,
): Promise<SecretFormState> {
  const session = await getSupabaseSession();
  if (!session?.user) {
    return { status: "error", message: "You must be signed in." };
  }

  const parsed = secretSchema.safeParse({
    label: formData.get("label"),
    secret_type: formData.get("secret_type"),
    secret_value: formData.get("secret_value"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const authClient = await createServerSupabaseClient();
  const { data: membership, error: membershipError } = await authClient
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      status: "error",
      message: "You do not have access to this company.",
    };
  }

  if (
    membership.role !== "agency_admin" &&
    membership.role !== "client_admin"
  ) {
    return {
      status: "error",
      message: "Only admins can store secure credentials.",
    };
  }

  const serviceClient = createServiceRoleSupabaseClient();

  const { error } = await serviceClient.rpc("create_secret", {
    p_company_id: companyId,
    p_label: parsed.data.label,
    p_secret_type: parsed.data.secret_type,
    p_secret_value: parsed.data.secret_value,
    p_created_by: session.user.id,
    p_passphrase: serverEnv.SUPABASE_SECRET_PASSPHRASE,
  });

  if (error) {
    console.error(error);
    return {
      status: "error",
      message: "Unable to securely store the secret.",
    };
  }

  revalidatePath(`/app/companies/${companyId}`);

  return {
    status: "success",
    message: "Secret stored securely.",
  };
}
