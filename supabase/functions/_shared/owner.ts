import { createClient } from "npm:@supabase/supabase-js@2";

export async function requireOwnerMfa(request: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authorization = request.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error("UNAUTHORIZED");
  const encodedPayload = authorization.replace(/^Bearer\s+/i, "").split(".")[1];
  if (!encodedPayload) throw new Error("UNAUTHORIZED");
  const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
  const payload = JSON.parse(atob(base64));
  if (payload.aal !== "aal2") throw new Error("MFA_REQUIRED");
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const owner = await admin.from("owner_accounts").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!owner.data) throw new Error("FORBIDDEN");
  return { user, admin, userClient };
}
