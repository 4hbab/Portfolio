import AdminApp from "@/components/admin/AdminApp";
import { fallbackContent } from "@/content/portfolio";

export default function AdminPage() {
    return <AdminApp fallback={fallbackContent} />;
}

