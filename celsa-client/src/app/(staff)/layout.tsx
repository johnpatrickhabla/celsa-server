import DashboardSidebar from "@/components/shared/DashboardSidebar";
import { STAFF_NAV } from "@/lib/nav-config";
import StaffGuard from "@/components/staff/StaffGuard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffGuard>
      <div className="d-flex">
        <DashboardSidebar items={STAFF_NAV} />
        <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
          {children}
        </div>
      </div>
    </StaffGuard>
  );
}
