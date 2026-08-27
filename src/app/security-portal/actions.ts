"use server";

const PORTAL_EMAIL = "fatimak2816@gmail.com";
const PORTAL_PASSWORD = "Ffma@1234";

export async function verifyPortalAccess(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (email === PORTAL_EMAIL && password === PORTAL_PASSWORD) {
    return { ok: true };
  }
  return { error: "Invalid credentials. Access denied." };
}
