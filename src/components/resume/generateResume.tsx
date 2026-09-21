import { pdf } from "@react-pdf/renderer";
import type { PortfolioContent } from "@/content/portfolio";
import { ResumeDocument } from "./ResumeDocument";

export async function createResumeBlob(content: PortfolioContent) {
    return pdf(<ResumeDocument content={content} />).toBlob();
}

