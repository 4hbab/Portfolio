import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
    // Global ignores must be an object with no other keys. Carrying `ignores`
    // alongside `rules` made this a normal config block instead, so these paths
    // were being linted all along — the Deno functions with a Next.js ruleset.
    // eslint-config-next already globally ignores .next/, out/, and build/.
    { ignores: ["coverage/**", "supabase/functions/**"] },
    ...nextVitals,
    ...nextTypeScript,
];

export default eslintConfig;
