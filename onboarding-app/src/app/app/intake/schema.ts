import { z } from "zod";

import { onboardingSections } from "@/data/forms/onboarding";
import { buildFormSchema } from "@/lib/forms/schema";

export const intakeSchema = buildFormSchema(onboardingSections);
export type IntakeFormValues = z.infer<typeof intakeSchema>;
