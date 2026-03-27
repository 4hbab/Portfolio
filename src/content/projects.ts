/**
 * GitHub-powered project data layer.
 *
 * Fetches public repos from the GitHub REST API at build time.
 * – Uses GITHUB_TOKEN when available (CI) to avoid the 60 req/hr
 *   unauthenticated rate-limit (authenticated = 5 000 req/hr).
 * – Falls back to a hardcoded snapshot when the API is unreachable
 *   so local `next build` never fails without a network connection.
 * – The token is NEVER bundled into the client JS because this module
 *   is only imported by a server component.
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Project {
    id: string;
    title: string;
    description: string;
    tags: string[];
    language: string | null;
    stars: number;
    repoUrl: string;
    liveUrl?: string;
    featured: boolean;
}

/** Shape of a single repo returned by GET /users/:user/repos */
interface GitHubRepo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    homepage: string | null;
    language: string | null;
    stargazers_count: number;
    fork: boolean;
    archived: boolean;
    topics?: string[];
}

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

const GITHUB_USERNAME = "4hbab";
const API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos`;

/**
 * Repos to include in the portfolio, in display order.
 * Only repos whose *name* appears here are shown.
 * The first N entries (see FEATURED_COUNT) are marked as "featured".
 */
const REPO_WHITELIST: string[] = [
    "Clipz",
    "Crowdfunding-Solitidy",
    "expenses-tracker-react",
    "Bulky_MVC",
    "Book-Library-API",
];

/** How many leading whitelist entries are considered "featured". */
const FEATURED_COUNT = 3;

/**
 * Manual tag overrides per repo name.
 * If a repo is not listed here, tags fall back to the repo's primary language.
 */
const TAG_OVERRIDES: Record<string, string[]> = {
    Clipz: ["Angular", "Firebase", "FFmpeg", "TypeScript"],
    "Crowdfunding-Solitidy": ["Solidity", "Ethereum", "Web3.js", "React"],
    "expenses-tracker-react": ["React", "JavaScript", "CSS"],
    Bulky_MVC: ["ASP.NET Core", "C#", "MVC", "SQL Server"],
    "Book-Library-API": ["Node.js", "Express", "MongoDB", "REST"],
};

// ──────────────────────────────────────────────
// Fetch helper
// ──────────────────────────────────────────────

/**
 * Fetch all public repos for the configured GitHub user.
 *
 * Security notes:
 * – `GITHUB_TOKEN` is read from `process.env` on the SERVER only (build time).
 * – We set a short `User-Agent` header (required by GitHub API).
 * – Pagination is handled to ensure we get all repos.
 */
async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
    const token = process.env.GITHUB_TOKEN;

    const headers: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "portfolio-build",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const allRepos: GitHubRepo[] = [];
    let page = 1;
    const perPage = 100; // max per request

    // Paginate through all repos
    while (true) {
        const url = `${API_URL}?per_page=${perPage}&page=${page}&type=owner`;
        const res = await fetch(url, {
            headers,
            // Next.js fetch cache — revalidate once per build
            next: { revalidate: false },
        });

        if (!res.ok) {
            throw new Error(
                `GitHub API responded with ${res.status}: ${res.statusText}`
            );
        }

        const repos: GitHubRepo[] = await res.json();
        allRepos.push(...repos);

        // If we got fewer than perPage, we've reached the last page
        if (repos.length < perPage) break;
        page++;
    }

    return allRepos;
}

// ──────────────────────────────────────────────
// Mapping & filtering
// ──────────────────────────────────────────────

function mapReposToProjects(repos: GitHubRepo[]): Project[] {
    // Index repos by name for O(1) lookup
    const repoMap = new Map(repos.map((r) => [r.name, r]));

    return REPO_WHITELIST.filter((name) => repoMap.has(name)).map(
        (name, idx) => {
            const repo = repoMap.get(name)!;

            const tags =
                TAG_OVERRIDES[name] ??
                (repo.language ? [repo.language] : []);

            return {
                id: `project-${repo.id}`,
                title: formatRepoName(name),
                description: repo.description ?? "No description provided.",
                tags,
                language: repo.language,
                stars: repo.stargazers_count,
                repoUrl: repo.html_url,
                liveUrl: repo.homepage || undefined,
                featured: idx < FEATURED_COUNT,
            };
        }
    );
}

/** Turn "my-repo-name" / "My_Repo" into "My Repo Name" */
function formatRepoName(name: string): string {
    return name
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ──────────────────────────────────────────────
// Fallback data (used when API is unreachable)
// ──────────────────────────────────────────────

const FALLBACK_PROJECTS: Project[] = [
    {
        id: "project-1",
        title: "Clipz",
        description:
            "A video clip sharing platform with upload, streaming, and social features for content creators.",
        tags: ["Angular", "Firebase", "FFmpeg", "TypeScript"],
        language: "TypeScript",
        stars: 0,
        repoUrl: "https://github.com/4hbab/Clipz",
        featured: true,
    },
    {
        id: "project-2",
        title: "Crowdfunding Solitidy",
        description:
            "A decentralized crowdfunding platform built on Ethereum using Solidity smart contracts.",
        tags: ["Solidity", "Ethereum", "Web3.js", "React"],
        language: "Solidity",
        stars: 0,
        repoUrl: "https://github.com/4hbab/Crowdfunding-Solitidy",
        featured: true,
    },
    {
        id: "project-3",
        title: "Expenses Tracker React",
        description:
            "A React-based personal finance tracker for managing daily expenses with category-wise breakdowns and visualizations.",
        tags: ["React", "JavaScript", "CSS"],
        language: "JavaScript",
        stars: 0,
        repoUrl: "https://github.com/4hbab/expenses-tracker-react",
        featured: true,
    },
    {
        id: "project-4",
        title: "Bulky MVC",
        description:
            "An ASP.NET Core MVC web application implementing an online bookstore management system with full CRUD operations.",
        tags: ["ASP.NET Core", "C#", "MVC", "SQL Server"],
        language: "C#",
        stars: 0,
        repoUrl: "https://github.com/4hbab/Bulky_MVC",
        featured: false,
    },
    {
        id: "project-5",
        title: "Book Library API",
        description:
            "A RESTful API for managing a book library with CRUD operations, search, and categorization features.",
        tags: ["Node.js", "Express", "MongoDB", "REST"],
        language: "JavaScript",
        stars: 0,
        repoUrl: "https://github.com/4hbab/Book-Library-API",
        featured: false,
    },
];

// ──────────────────────────────────────────────
// Public API (consumed by server components)
// ──────────────────────────────────────────────

/**
 * Fetch and return portfolio projects.
 * Safe to call during `next build` — never throws.
 */
export async function fetchProjects(): Promise<Project[]> {
    try {
        const repos = await fetchGitHubRepos();
        const projects = mapReposToProjects(repos);

        if (projects.length === 0) {
            console.warn(
                "[projects] No whitelisted repos found via API — using fallback data."
            );
            return FALLBACK_PROJECTS;
        }

        return projects;
    } catch (err) {
        console.warn(
            "[projects] GitHub API fetch failed — using fallback data.",
            err instanceof Error ? err.message : err
        );
        return FALLBACK_PROJECTS;
    }
}

/** Derive the unique sorted tag list from a set of projects. */
export function getProjectTags(projects: Project[]): string[] {
    return Array.from(new Set(projects.flatMap((p) => p.tags))).sort();
}
