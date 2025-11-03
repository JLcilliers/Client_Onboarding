"use client";

import { useMemo, useState } from "react";
import {
  FormProvider,
  type FieldPath,
  useForm,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FieldRenderer } from "@/components/forms/field-renderer";
import { onboardingSections } from "@/data/forms/onboarding";
import { saveIntakeSection, submitIntake } from "./actions";
import { intakeSchema, type IntakeFormValues } from "./schema";

type DraftState = {
  companyId?: string;
  questionnaireId?: string;
};

type SaveStatus =
  | { type: "idle"; message?: string }
  | { type: "saving"; message?: string }
  | { type: "success"; message?: string }
  | { type: "error"; message: string };

export function IntakeWizard() {
  const [draftState, setDraftState] = useState<DraftState>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    type: "idle",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<
    | { type: "success"; text: string }
    | { type: "error"; text: string }
    | null
  >(null);

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    mode: "onBlur",
    defaultValues: {},
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const selectedServices = useWatch({
    control: form.control,
    name: "selected_services",
  }) as string[] | undefined;

  const visibleSections = useMemo(() => {
    return onboardingSections.filter((section) => {
      if (section.alwaysVisible) {
        return true;
      }

      if (!section.serviceKeys || section.serviceKeys.length === 0) {
        return true;
      }

      if (!selectedServices || selectedServices.length === 0) {
        return false;
      }

      return section.serviceKeys.some((serviceKey) =>
        selectedServices.includes(serviceKey),
      );
    });
  }, [selectedServices]);

  const currentSection =
    visibleSections[currentStepIndex] ??
    visibleSections[visibleSections.length - 1];

  const isSaving = saveStatus.type === "saving";

  const persistCurrentSection = async () => {
    setSaveStatus({ type: "saving", message: "Saving progress..." });
    const result = await saveIntakeSection({
      sectionKey: currentSection.key,
      values: form.getValues(),
      context: draftState,
    });

    if (result.status === "success") {
      setDraftState((prev) => ({
        companyId: result.companyId ?? prev.companyId,
        questionnaireId: result.questionnaireId ?? prev.questionnaireId,
      }));
      setSaveStatus({
        type: "success",
        message: result.message ?? "Progress saved.",
      });
      return true;
    }

    setSaveStatus({
      type: "error",
      message: result.message ?? "Could not save progress.",
    });
    return false;
  };

  const goToStep = (index: number) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, visibleSections.length - 1)));
  };

  const handlePrevious = () => {
    goToStep(currentStepIndex - 1);
  };

  const handleNext = async () => {
    const fieldsToValidate = currentSection.fields.map((field) => field.key);
    const isValid = await form.trigger(
      fieldsToValidate as FieldPath<IntakeFormValues>[],
    );
    if (!isValid) return;
    const saved = await persistCurrentSection();
    if (!saved) return;
    goToStep(currentStepIndex + 1);
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const result = await submitIntake(values, draftState);
      setDraftState({
        companyId: result.companyId,
        questionnaireId: result.questionnaireId,
      });
      setSaveStatus({
        type: "success",
        message: "All responses saved.",
      });
      setSubmitMessage({
        type: "success",
        text: "Questionnaire submitted successfully. You can revisit this page to provide additional details later.",
      });
      form.reset(values);
    } catch (error) {
      console.error(error);
      setSubmitMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting the questionnaire.",
      });
      setSaveStatus({
        type: "error",
        message: "We could not finalise the questionnaire.",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-background p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Intake progress
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {visibleSections.length} sections
            </h2>
          </div>
          <ol className="space-y-2 text-sm">
            {visibleSections.map((section, index) => {
              const isActive = index === currentStepIndex;
              return (
                <li key={section.key}>
                  <button
                    type="button"
                    onClick={() => goToStep(index)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-foreground/70 hover:border-border hover:bg-muted"
                    }`}
                  >
                    <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                      Step {index + 1}
                    </span>
                    <span className="block font-medium leading-snug">
                      {section.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <section className="rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Selected services</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {(selectedServices && selectedServices.length > 0
                ? selectedServices
                : ["No services selected yet"]
              ).map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </section>
        </aside>
        <section className="space-y-8">
          <header className="space-y-3">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
              Step {currentStepIndex + 1} of {visibleSections.length}
            </span>
            <h1 className="text-2xl font-semibold text-foreground">
              {currentSection.title}
            </h1>
            {currentSection.subtitle ? (
              <p className="text-sm text-muted-foreground">
                {currentSection.subtitle}
              </p>
            ) : null}
          </header>
          <div className="space-y-6">
            {currentSection.fields.map((field) => (
              <FieldRenderer key={field.key} field={field} />
            ))}
          </div>
          {saveStatus.type === "saving" ? (
            <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
              {saveStatus.message ?? "Saving progress..."}
            </div>
          ) : null}
          {saveStatus.type === "success" ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {saveStatus.message}
            </div>
          ) : null}
          {saveStatus.type === "error" ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {saveStatus.message}
            </div>
          ) : null}
          {submitMessage ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                submitMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {submitMessage.text}
            </div>
          ) : null}
          <footer className="flex items-center justify-between border-t border-border/60 pt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0 || isSaving || isSubmitting}
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-border/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Previous
            </button>
            {currentStepIndex === visibleSections.length - 1 ? (
              <button
                type="submit"
                disabled={isSubmitting || isSaving}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit intake"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Saving..." : "Save & Continue"}
              </button>
            )}
          </footer>
        </section>
      </form>
    </FormProvider>
  );
}
