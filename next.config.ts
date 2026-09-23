import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/site";

// GitHub Pages serves a project site under /<repo>/, but `next dev` serves from
// the root. Both read the path from src/lib/site.ts so the studio's links and
// the router cannot disagree about where the site lives.
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
    output: "export",
    basePath: isProd ? BASE_PATH : "",
    assetPrefix: isProd ? BASE_PATH : "",
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
};

export default nextConfig;
