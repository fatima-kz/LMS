"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  id,
  label = "Delete",
  extra,
}: {
  action: (formData: FormData) => Promise<unknown>;
  id: string;
  label?: string;
  extra?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => startTransition(async () => { await action(fd); })}
      onSubmit={(e) => {
        if (!confirm("Are you sure? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {extra &&
        Object.entries(extra).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "…" : label}
      </Button>
    </form>
  );
}

export function ToggleButton({
  action,
  id,
  active,
  activeLabel = "Deactivate",
  inactiveLabel = "Activate",
  extra,
}: {
  action: (formData: FormData) => Promise<unknown>;
  id: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  extra?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => startTransition(async () => { await action(fd); })}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      {extra &&
        Object.entries(extra).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "…" : active ? activeLabel : inactiveLabel}
      </Button>
    </form>
  );
}
