import { z } from "zod";

import type { FormField, FormSection } from "@/types/forms";

function fieldToSchema(field: FormField) {
  const requiredMessage = `${field.label} is required`;

  switch (field.type) {
    case "email": {
      const schema = z.string().email("Enter a valid email address");
      return field.required ? schema.min(1, requiredMessage) : schema.optional();
    }
    case "url": {
      const schema = z.string().url("Enter a valid URL, e.g. https://example.com");
      return field.required ? schema.min(1, requiredMessage) : schema.optional();
    }
    case "number": {
      const schema = z
        .union([z.coerce.number(), z.string().length(0)])
        .transform((value) => (typeof value === "number" ? value : undefined));
      return field.required
        ? schema.refine((value) => value !== undefined, requiredMessage)
        : schema.optional();
    }
    case "textarea":
    case "text": {
      const schema = z.string();
      return field.required ? schema.min(1, requiredMessage) : schema.optional();
    }
    case "select":
    case "radio": {
      const enumSchema = z.enum([...field.options] as [string, ...string[]]);
      return field.required ? enumSchema : enumSchema.optional();
    }
    case "multiselect":
    case "checkbox-group": {
      const schema = z
        .array(z.string())
        .default([])
        .superRefine((value, ctx) => {
          if (field.required && value.length === 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: requiredMessage,
            });
          }
        });
      return schema;
    }
    case "checkbox": {
      if (field.required) {
        return z.literal(true, {
          errorMap: () => ({ message: requiredMessage }),
        });
      }
      return z.boolean().optional();
    }
    default:
      return z.any();
  }
}

export function buildFormSchema(sections: FormSection[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      shape[field.key] = fieldToSchema(field);
    });
  });

  return z.object(shape);
}
