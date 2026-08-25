"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

type State = { error?: string; ok?: boolean } | null;

export function AttendanceForm({
  action,
  taId,
  date,
  students,
}: {
  action: (formData: FormData) => State | Promise<State>;
  taId: string;
  date: string;
  students: { id: string; name: string; roll: string | null }[];
}) {
  const wrapped = async (_prev: State, fd: FormData) => action(fd);
  const [state, formAction, pending] = useActionState(wrapped, null as State);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="teaching_assignment_id" value={taId} />
      <input type="hidden" name="session_date" value={date} />
      <div className="divide-y rounded-md border">
        {students.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-xs text-muted-foreground">Roll {s.roll ?? "—"}</p>
            </div>
            <Select name={`status_${s.id}`} defaultValue="present" className="w-32">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </Select>
          </div>
        ))}
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Attendance saved.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save attendance"}
      </Button>
    </form>
  );
}
