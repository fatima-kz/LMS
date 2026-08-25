"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

export type FormState = { error?: string; ok?: boolean; data?: unknown } | null;

export function FormShell({
  action,
  submitLabel = "Save",
  className,
  children,
}: {
  action: (formData: FormData) => FormState | Promise<FormState>;
  submitLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const wrapped = async (_prev: FormState, formData: FormData) => action(formData);
  const [state, formAction, pending] = useActionState(wrapped, null as FormState);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="mt-3">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
