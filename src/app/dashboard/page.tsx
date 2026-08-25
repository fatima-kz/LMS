import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";

export default async function DashboardIndex() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  redirect(`/dashboard/${profile.role}`);
}
