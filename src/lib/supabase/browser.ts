import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnvError } from "@/lib/env";

export function createClient() {
  const err = getPublicEnvError();
  if (err) throw new Error(err);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}