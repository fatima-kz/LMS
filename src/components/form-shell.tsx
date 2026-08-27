"use client";

import { useActionState } from "react";

export type FormState = { error?: string; ok?: boolean; data?: unknown } | null;

export function FormShell({
  action,
  submitLabel = "Save",
  className,
  children,
  submitDisabled = false,
}: {
  action: (formData: FormData) => FormState | Promise<FormState>;
  submitLabel?: string;
  className?: string;
  children: React.ReactNode;
  submitDisabled?: boolean;
}) {
  const wrapped = async (_prev: FormState, formData: FormData) => action(formData);
  const [state, formAction, pending] = useActionState(wrapped, null as FormState);
  return (
    <form action={formAction} className={className}>
      {children}

      {state?.error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#FFDAD6] px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-[#93000A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-[#93000A]">{state.error}</p>
        </div>
      )}

      {state?.ok && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#E8F5E9] px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0 text-[#2E7D32]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-semibold text-[#2E7D32]">Saved successfully!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || submitDisabled}
        className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#630ED4] px-4 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(124,58,237,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(124,58,237,0.35)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
      >
        {/* Shimmer overlay on hover */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />

        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : (
          <>
            {submitLabel}
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}