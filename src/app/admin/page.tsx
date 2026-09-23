import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { fallbackContent } from "@/content/portfolio";

// The studio ships as a static page in the public site. The locks are in the
// database, but there is no reason for it to appear in search results.
export const metadata: Metadata = {
    title: "Content Studio",
    robots: { index: false, follow: false },
};

export default function AdminPage() {
    return <AdminApp fallback={fallbackContent} />;
}
