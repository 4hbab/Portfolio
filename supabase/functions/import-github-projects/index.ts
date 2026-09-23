import { json, servePost } from "../_shared/http.ts";
import { githubOwner } from "../_shared/config.ts";
import { safeLiveUrl, titleFromRepoName } from "../_shared/github.ts";
import { errorResponse, requireOwnerMfa } from "../_shared/owner.ts";

const PROJECT_LIMIT = 50;

type Repo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  archived: boolean;
};

servePost(async (request) => {
  try {
    const { userClient } = await requireOwnerMfa(request);
    const { content, expectedVersion } = await request.json();
    if (!content || typeof content !== "object" || !Array.isArray(content.projects)) {
      return json({ error: "The draft sent for import is missing its projects list." }, 400, request);
    }

    // An authenticated call raises the GitHub rate limit from 60/hour per shared
    // egress IP to 5,000/hour, so an import cannot be blocked by unrelated
    // traffic. It stays optional: an unauthenticated import still works.
    const githubToken = Deno.env.get("GITHUB_DISPATCH_TOKEN");
    const response = await fetch(`https://api.github.com/users/${githubOwner()}/repos?per_page=100&type=owner`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "portfolio-content-importer",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
      },
    });
    if (!response.ok) return json({ error: `GitHub import failed with ${response.status}` }, 502, request);

    const repos = await response.json();
    // A rate-limit or error body is an object, and .filter on it would throw a
    // 500 that says nothing about what actually went wrong.
    if (!Array.isArray(repos)) return json({ error: "GitHub returned an unexpected response." }, 502, request);

    const existingProjects = content.projects as Record<string, unknown>[];
    const repoKey = (value: unknown) => (typeof value === "string" ? value.toLowerCase() : "");
    const byUrl = new Map(existingProjects.map((project) => [repoKey(project.repoUrl), project]));

    const importedUrls = new Set<string>();
    const imported = (repos as Repo[])
      .filter((repo) => repo && !repo.fork && !repo.archived && typeof repo.html_url === "string")
      .map((repo, order) => {
        const key = repoKey(repo.html_url);
        importedUrls.add(key);
        const existing = byUrl.get(key);
        return {
          id: existing?.id ?? `github-${repo.id}`,
          title: existing?.title ?? titleFromRepoName(String(repo.name)),
          description: repo.description || existing?.description || "No description provided.",
          tags: existing?.tags ?? (repo.language ? [repo.language] : []),
          language: repo.language ?? null,
          stars: Number(repo.stargazers_count ?? 0),
          repoUrl: repo.html_url,
          liveUrl: safeLiveUrl(repo.homepage),
          featured: existing?.featured ?? false,
          visible: existing?.visible ?? false,
          includeInResume: existing?.includeInResume ?? false,
          order: existing?.order ?? existingProjects.length + order,
        };
      });

    const manual = existingProjects.filter((project) => !importedUrls.has(repoKey(project.repoUrl)));
    const merged = [...imported, ...manual].sort((a, b) => Number(a.order) - Number(b.order));
    const projects = merged.slice(0, PROJECT_LIMIT).map((project, order) => ({ ...project, order }));
    const dropped = merged.length - projects.length;

    const saved = await userClient.rpc("save_portfolio_draft", { next_content: { ...content, projects }, expected_version: expectedVersion });
    if (saved.error) return json({ error: saved.error.message }, 409, request);
    // The caller reports these counts so a silent truncation cannot go unnoticed.
    return json({ ...saved.data, importedCount: imported.length, droppedCount: dropped, projectLimit: PROJECT_LIMIT }, 200, request);
  } catch (error) {
    return errorResponse(error, "GitHub import failed unexpectedly.", request);
  }
});
