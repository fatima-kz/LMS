"use client";

import { useTransition } from "react";

export function MoveForm({
  action,
  id,
  sections,
  current,
}: {
  action: (formData: FormData) => Promise<unknown>;
  id: string;
  sections: { id: string; label: string }[];
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => startTransition(async () => { await action(fd); })}
      className="flex items-center gap-1.5"
    >
      <input type="hidden" name="id" value={id} />
      <div className="select-wrapper relative">
        <select
          name="section_id"
          defaultValue={current}
          className="move-form-select h-8 w-36 appearance-none rounded-lg border-2 border-transparent bg-[#F6F3F2] pl-2.5 pr-7 text-xs font-medium text-[#1C1B1B] outline-none"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg className="h-3 w-3 text-[#7B7487]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="move-btn flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-[#7B7487] disabled:opacity-50"
      >
        {pending ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            Move
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}