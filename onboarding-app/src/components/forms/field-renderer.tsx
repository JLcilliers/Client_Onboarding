"use client";

import { Controller, useFormContext } from "react-hook-form";

import type { FormField } from "@/types/forms";

const baseInputClasses =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted";

export function FieldRenderer({ field }: { field: FormField }) {
  const {
    control,
    formState: { errors },
  } = useFormContext<Record<string, unknown>>();

  const errorMessage = errors[field.key]?.message as string | undefined;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {field.label}
        {field.required ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            Required
          </span>
        ) : null}
      </label>
      {field.description ? (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      ) : null}
      <Controller
        control={control}
        name={field.key}
        rules={
          field.required
            ? { required: `${field.label} is required` }
            : undefined
        }
        defaultValue={
          field.type === "checkbox"
            ? false
            : field.type === "multiselect" || field.type === "checkbox-group"
              ? []
              : ""
        }
        render={({ field: controllerField }) => {
          switch (field.type) {
            case "textarea": {
              const rows = (
                field as Extract<FormField, { type: "textarea" }>
              ).rows;
              return (
                <textarea
                  {...controllerField as any}
                  rows={rows ?? 4}
                  placeholder={field.placeholder}
                  className={`${baseInputClasses} min-h-[120px] resize-y`}
                />
              );
            }
            case "select":
            case "radio": {
              const options = (field as Extract<
                FormField,
                { type: "select" | "radio" }
              >).options;
              return (
                <select
                  {...controllerField as any}
                  className={baseInputClasses}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select option
                  </option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              );
            }
            case "multiselect":
            case "checkbox-group": {
              const options = (field as Extract<
                FormField,
                { type: "multiselect" | "checkbox-group" }
              >).options;
              return (
                <div className="grid gap-2">
                  {options.map((option) => {
                    const checked = Array.isArray(controllerField.value)
                      ? controllerField.value.includes(option)
                      : false;
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition hover:border-primary/50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={checked}
                          onChange={(event) => {
                            if (event.target.checked) {
                              controllerField.onChange([
                                ...(Array.isArray(controllerField.value)
                                  ? controllerField.value
                                  : []),
                                option,
                              ]);
                            } else {
                              controllerField.onChange(
                                (Array.isArray(controllerField.value)
                                  ? controllerField.value
                                  : []
                                ).filter((value) => value !== option),
                              );
                            }
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              );
            }
            case "checkbox":
              return (
                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-primary"
                    checked={Boolean(controllerField.value)}
                    onChange={(event) => {
                      controllerField.onChange(event.target.checked);
                    }}
                  />
                  <span>{field.label}</span>
                </label>
              );
            case "text":
            case "email":
            case "url":
            case "number":
            default:
              return (
                <input
                  {...controllerField as any}
                  type={field.type === "number" ? "number" : field.type}
                  placeholder={field.placeholder}
                  className={baseInputClasses}
                />
              );
          }
        }}
      />
      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}
