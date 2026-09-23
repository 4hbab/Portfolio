import { createClient } from "npm:@supabase/supabase-js@2";
import { json } from "./http.ts";
import { requireSecret } from "./config.ts";

/**
 * Reads the assurance level from the access token. The token has already been
 * verified by `auth.getUser()` above the call, and the database re-checks
 * `auth.jwt() ->> 'aal'` inside every write function, so this is the middle of
 * three layers rather than the only one.
 */
function assuranceLevel(authorization: string): string | null {
  try {
    const encodedPayload = authorization.replace(/^Bearer\s+/i, "").split(".")[1];
    if (!encodedPayload) return null;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)).aal ?? null;
  } catch {
    // A token this malformed is an authentication failure, not a server fault.
    return null;
  }
}

export async function requireOwnerMfa(request: Request) {
  const url = requireSecret("SUPABASE_URL");
  const anonKey = requireSecret("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization") ?? "";

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("UNAUTHORIZED");
  if (assuranceLevel(authorization) !== "aal2") throw new Error("MFA_REQUIRED");

  // Checked as the caller, not with the service-role key: the "Owner can
  // identify their account" policy already scopes this read to their own row,
  // so neither of these functions needs a key that bypasses RLS at all.
  const owner = await userClient.from("owner_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
  if (owner.error) throw new Error(`Owner lookup failed: ${owner.error.message}`);
  if (!owner.data) throw new Error("FORBIDDEN");

  return { user, userClient };
}

const AUTH_FAILURES: Record<string, { status: number; message: string }> = {
  UNAUTHORIZED: { status: 401, message: "Your session has expired. Sign in again." },
  MFA_REQUIRED: { status: 403, message: "Verify your authenticator before making changes." },
  FORBIDDEN: { status: 403, message: "This account is not the portfolio owner." },
};

// Only genuine auth failures may surface as 401/403. Everything else is a real
// server fault and must say so, instead of sending the owner to re-enrol MFA.
export function errorResponse(error: unknown, fallbackMessage: string, request: Request) {
  const code = error instanceof Error ? error.message : "";
  const known = AUTH_FAILURES[code];
  if (known) return json({ error: known.message, code }, known.status, request);

  if (code.startsWith("MISSING_SECRET:")) {
    console.error(`${fallbackMessage} ${code.slice("MISSING_SECRET:".length)} is not set.`);
    return json({ error: "This function is not fully configured. Check its secrets.", code: "NOT_CONFIGURED" }, 500, request);
  }

  console.error(fallbackMessage, error);
  return json({ error: fallbackMessage, code: "INTERNAL" }, 500, request);
}
