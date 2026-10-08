import DashboardSidebar from "@/components/shared/DashboardSidebar";
import { STAFF_NAV } from "@/lib/nav-config";
import StaffGuard from "@/components/staff/StaffGuard";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffGuard>
      <div className="d-flex">
        <DashboardSidebar items={STAFF_NAV} variant="staff" />
        <div className="flex-grow-1" style={{ minHeight: "100vh", backgroundColor: "#f9f6f0" }}>
          {children}
        </div>
      </div>
    </StaffGuard>
  );
}
