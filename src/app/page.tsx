import PortfolioApp from "@/components/PortfolioApp";
import { getBuildSnapshot } from "@/lib/content";

export default async function Home() {
    const snapshot = await getBuildSnapshot();
    return <PortfolioApp snapshot={snapshot} />;
}
