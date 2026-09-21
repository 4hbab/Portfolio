import { corsHeaders, isAllowedOrigin, json } from "../_shared/http.ts";
import { requireOwnerMfa } from "../_shared/owner.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(request)) return json({ error: "Forbidden" }, 403, request);
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST" || !isAllowedOrigin(request)) return json({ error: "Forbidden" }, 403, request);
  try {
    await requireOwnerMfa(request);
    const { revision } = await request.json();
    const response = await fetch("https://api.github.com/repos/4hbab/Portfolio/actions/workflows/deploy.yml/dispatches", {
      method: "POST",
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${Deno.env.get("GITHUB_DISPATCH_TOKEN")}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "portfolio-content-publisher" },
      body: JSON.stringify({ ref: "v2", inputs: { content_revision: String(revision) } }),
    });
    if (!response.ok) return json({ error: `GitHub dispatch failed with ${response.status}` }, 502, request);
    return json({ status: "queued", revision }, 200, request);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unauthorized" }, 401, request); }
});
