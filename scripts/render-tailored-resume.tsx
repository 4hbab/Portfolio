import { execFileSync } from "node:child_process";
import { copyFile, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { buildTailoredCv } from "../src/components/resume/tailored";
import { renderTailoredLatex, skillLineWarnings } from "../src/components/resume/tailoredLatex";

// Usage: npm run cv:tailor -- <application-dir>
// Reads <application-dir>/cv.json, plus master.json, contact.json and resume.cls
// from the _profile folder beside it. They live outside this public repo on
// purpose: contact.json holds the phone number. Writes Sakif-Ahbab-CV.tex (for
// Overleaf, with resume.cls beside it) and compiles it to Sakif-Ahbab-CV.pdf with Tectonic.
const dir = process.argv[2];
if (!dir) throw new Error("Usage: npm run cv:tailor -- <application-dir>");

const applicationDir = resolve(dir);
const profileDir = process.env.CV_PROFILE_DIR ?? join(dirname(applicationDir), "_profile");
const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));

const cv = buildTailoredCv(
    await readJson(join(profileDir, "master.json")),
    await readJson(join(applicationDir, "cv.json")),
    await readJson(join(profileDir, "contact.json")),
);
for (const warning of skillLineWarnings(cv)) console.warn(`warning: ${warning}`);

const base = "Sakif-Ahbab-CV";
await writeFile(join(applicationDir, `${base}.tex`), renderTailoredLatex(cv));
await copyFile(join(profileDir, "resume.cls"), join(applicationDir, "resume.cls"));
try {
    execFileSync("tectonic", ["--keep-logs", "--chatter", "minimal", `${base}.tex`], { cwd: applicationDir, stdio: ["ignore", "ignore", "inherit"] });
} catch {
    throw new Error(`LaTeX failed for ${cv.meta.company}; see ${join(applicationDir, `${base}.log`)}.`);
}

const log = await readFile(join(applicationDir, `${base}.log`), "utf8");
const pages = Number(/Output written on [\s\S]*?\((\d+) pages?/.exec(log)?.[1] ?? 0);
await Promise.all(["log", "aux", "out"].map((ext) => rm(join(applicationDir, `${base}.${ext}`), { force: true })));
if (pages < 1 || pages > cv.maxPages) {
    throw new Error(`The CV for ${cv.meta.company} is ${pages} pages (limit ${cv.maxPages}). Drop a bullet or a project in cv.json.`);
}
console.log(`Wrote ${join(applicationDir, `${base}.pdf`)} (${pages} page${pages > 1 ? "s" : ""}) for ${cv.meta.role} at ${cv.meta.company}.`);
