import { json, servePost } from "../_shared/http.ts";
import { deployBranch, githubOwner, githubRepo, requireSecret } from "../_shared/config.ts";
import { errorResponse, requireOwnerMfa } from "../_shared/owner.ts";

servePost(async (request) => {
  try {
    await requireOwnerMfa(request);
    // Read before the dispatch: without it GitHub would receive a literal
    // "Bearer undefined" and answer 401, which reads like a revoked token.
    const token = requireSecret("GITHUB_DISPATCH_TOKEN");
    const { revision } = await request.json();

    const response = await fetch(
      `https://api.github.com/repos/${githubOwner()}/${githubRepo()}/actions/workflows/deploy.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "portfolio-content-publisher",
        },
        body: JSON.stringify({ ref: deployBranch(), inputs: { content_revision: String(revision) } }),
      },
    );
    if (!response.ok) return json({ error: `GitHub dispatch failed with ${response.status}` }, 502, request);
    return json({ status: "queued", revision }, 200, request);
  } catch (error) {
    return errorResponse(error, "The rebuild could not be queued.", request);
  }
});
