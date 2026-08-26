/**
 * Validate that required PUBLIC Supabase env vars are present.
 * Safe to call from browser/client code.
 * Returns an error message string if something is missing, otherwise null.
 */
export function getPublicEnvError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.includes("YOUR-PROJECT")) {
    return "Supabase URL is not configured. Copy .env.example to .env.local and fill in your project URL and keys.";
  }
  if (!anon || anon === "your-anon-key") {
    return "Supabase anon key is not configured. See .env.local.";
  }
  return null;
}

/**
 * Validate that required Supabase env vars are present, INCLUDING the
 * service role key. Server-only — never call this from client components
 * or any file that runs in the browser.
 * Returns an error message string if something is missing, otherwise null.
 */
export function getEnvError(): string | null {
  const publicErr = getPublicEnvError();
  if (publicErr) return publicErr;

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service || service === "your-service-role-key") {
    return "Supabase service role key is not configured. See .env.local.";
  }
  return null;
}

export function requireEnv(): void {
  const err = getEnvError();
  if (err) throw new Error(err);
}