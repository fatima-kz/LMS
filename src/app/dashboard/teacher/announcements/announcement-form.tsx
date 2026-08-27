"use client";

import { useState } from "react";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { FormShell } from "@/components/form-shell";
import { createAnnouncementTeacher } from "../actions";

export function TeacherAnnouncementForm({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  const [audience, setAudience] = useState("my_sections");

  return (
    <FormShell action={createAnnouncementTeacher} submitLabel="Send">
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" name="body" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audience">Audience</Label>
          <Select
            id="audience"
            name="audience"
            required
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="my_sections">All my sections</option>
            <option value="section">A specific section</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="section_id">Section</Label>
          <Select
            id="section_id"
            name="section_id"
            disabled={audience === "my_sections"}
            className={audience === "my_sections" ? "opacity-50" : ""}
          >
            <option value="">Select section…</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
          {audience === "my_sections" && (
            <p className="text-xs text-muted-foreground">
              This announcement will be sent to all sections you teach.
            </p>
          )}
        </div>
      </div>
    </FormShell>
  );
}
