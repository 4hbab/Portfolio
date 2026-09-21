import { writeFile } from "node:fs/promises";
import { fallbackContent } from "../src/content/portfolio";
import { createResumeBlob } from "../src/components/resume/generateResume";

const output = process.argv[2];
if (!output) throw new Error("Usage: vite-node scripts/render-resume.tsx <output.pdf>");

const blob = await createResumeBlob(fallbackContent);
await writeFile(output, new Uint8Array(await blob.arrayBuffer()));
