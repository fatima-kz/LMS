"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

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
      className="flex items-center gap-1"
    >
      <input type="hidden" name="id" value={id} />
      <Select name="section_id" defaultValue={current} className="h-8 w-36">
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        Move
      </Button>
    </form>
  );
}
