import DashboardSidebar from "@/components/shared/DashboardSidebar";
import { ADMIN_NAV } from "@/lib/nav-config";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="d-flex">
        <DashboardSidebar items={ADMIN_NAV} variant="admin" />
        <div className="flex-grow-1" style={{ minHeight: "100vh", backgroundColor: "#f9f6f0" }}>
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
