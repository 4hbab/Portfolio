import { writeFile } from "node:fs/promises";
import { visibleContent } from "../src/content/portfolio";
import { getBuildSnapshot } from "../src/lib/content";
import { createResumeBlob } from "../src/components/resume/generateResume";

const output = process.argv[2];
if (!output) throw new Error("Usage: npm run resume:pdf -- <output.pdf>");

// Renders the published resume, falling back to the bundled content when
// Supabase is unreachable, so the output matches what visitors download.
const snapshot = await getBuildSnapshot();
const blob = await createResumeBlob(visibleContent(snapshot.content));
await writeFile(output, new Uint8Array(await blob.arrayBuffer()));
console.log(`Wrote ${output} from published revision ${snapshot.revision}.`);
