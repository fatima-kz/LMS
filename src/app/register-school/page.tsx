"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerSchool } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function RegisterSchoolPage() {
  const [state, formAction, pending] = useActionState(registerSchool, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Register your school</CardTitle>
          <CardDescription>
            Create the school workspace and your admin account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolName">School name</Label>
              <Input id="schoolName" name="schoolName" required placeholder="Greenfield High" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminName">Your name</Label>
              <Input id="adminName" name="adminName" required placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Admin email</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@school.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating…" : "Create school & admin account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
