import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { contentSecurityPolicy } from "../src/lib/seo/csp";

/**
 * A <meta> CSP only governs what the parser reaches *after* it. Rendering the
 * tag from the layout put it after Next's own script tags, so most of the
 * document loaded outside the policy. Next controls the order of its head
 * output, so the only reliable way to place the tag first on a static export is
 * to write it into the emitted HTML.
 */
const OUT_DIR = "out";
const CSP_ATTRIBUTE = 'http-equiv="Content-Security-Policy"';

async function htmlFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const found = await Promise.all(entries.map(async (entry) => {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) return htmlFiles(path);
        return entry.name.endsWith(".html") ? [path] : [];
    }));
    return found.flat();
}

const policy = contentSecurityPolicy();
const tag = `<meta ${CSP_ATTRIBUTE} content="${policy}">`;

const files = await htmlFiles(OUT_DIR);
if (files.length === 0) throw new Error(`No HTML found in ${OUT_DIR}/. Run "next build" first.`);

let applied = 0;
for (const file of files) {
    const html = await readFile(file, "utf8");
    if (html.includes(CSP_ATTRIBUTE)) continue;

    const head = html.indexOf("<head>");
    if (head === -1) throw new Error(`${file} has no <head> to secure; refusing to ship it unprotected.`);

    await writeFile(file, html.slice(0, head + "<head>".length) + tag + html.slice(head + "<head>".length));
    applied += 1;
}

console.log(`Applied the content security policy to ${applied} of ${files.length} pages.`);
console.log(policy.split("; ").map((directive) => `  ${directive}`).join("\n"));
