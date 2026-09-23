// Mirrors visibleContent() in src/content/portfolio.ts. Anything the website hides
// must also be hidden from the assistant, so both filters must stay identical.
const LIST_KEYS = [
  "bio",
  "experience",
  "education",
  "skillGroups",
  "achievements",
  "projects",
  "links",
  "faqs",
] as const;

type Listed = { visible?: unknown; order?: unknown };

export function visiblePublishedContent<T extends Record<string, unknown>>(content: T): T {
  const next: Record<string, unknown> = { ...content };
  for (const key of LIST_KEYS) {
    const items = content[key];
    if (!Array.isArray(items)) continue;
    next[key] = (items as Listed[])
      .filter((item) => Boolean(item?.visible))
      .sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
  }
  return next as T;
}
