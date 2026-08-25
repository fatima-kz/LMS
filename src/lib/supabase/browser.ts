import { createBrowserClient } from "@supabase/ssr";
import { getEnvError } from "@/lib/env";

export function createClient() {
  const err = getEnvError();
  if (err) throw new Error(err);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
