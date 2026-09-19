import { corsHeaders, isAllowedOrigin, json } from "../_shared/http.ts";
import { requireOwnerMfa } from "../_shared/owner.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin(request)) return json({ error: "Forbidden" }, 403, request);
    return new Response("ok", { headers: corsHeaders(request) });
  }
  if (request.method !== "POST" || !isAllowedOrigin(request)) return json({ error: "Forbidden" }, 403, request);
  try {
    const { userClient } = await requireOwnerMfa(request);
    const { content, expectedVersion } = await request.json();
    const response = await fetch("https://api.github.com/users/4hbab/repos?per_page=100&type=owner", { headers: { Accept: "application/vnd.github+json", "User-Agent": "portfolio-content-importer" } });
    if (!response.ok) return json({ error: "GitHub import failed" }, 502, request);
    const repos = await response.json();
    const byUrl = new Map(content.projects.map((project: { repoUrl: string }) => [project.repoUrl.toLowerCase(), project]));
    const importedUrls = new Set<string>();
    const imported = repos.filter((repo: { fork: boolean; archived: boolean }) => !repo.fork && !repo.archived).map((repo: Record<string, unknown>, order: number) => {
      importedUrls.add(String(repo.html_url).toLowerCase());
      const existing = byUrl.get(String(repo.html_url).toLowerCase()) as Record<string, unknown> | undefined;
      return { id: existing?.id ?? `github-${repo.id}`, title: existing?.title ?? String(repo.name).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()), description: repo.description || existing?.description || "No description provided.", tags: existing?.tags ?? (repo.language ? [repo.language] : []), language: repo.language ?? null, stars: Number(repo.stargazers_count ?? 0), repoUrl: repo.html_url, liveUrl: repo.homepage || undefined, featured: existing?.featured ?? false, visible: existing?.visible ?? false, includeInResume: existing?.includeInResume ?? false, order: existing?.order ?? content.projects.length + order };
    });
    const manual = content.projects.filter((project: { repoUrl: string }) => !importedUrls.has(project.repoUrl.toLowerCase()));
    const projects = [...imported, ...manual].sort((a, b) => Number(a.order) - Number(b.order)).slice(0, 50).map((project, order) => ({ ...project, order }));
    const nextContent = { ...content, projects };
    const saved = await userClient.rpc("save_portfolio_draft", { next_content: nextContent, expected_version: expectedVersion });
    if (saved.error) return json({ error: saved.error.message }, 409, request);
    return json(saved.data, 200, request);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Unauthorized" }, 401, request); }
});
