"use client";

import DashboardTopbar from "@/components/shared/DashboardTopbar";
import AccountSettingsView from "@/components/shared/AccountSettingsView";

export default function StaffSettingsPage() {
  return (
    <>
      <DashboardTopbar title="Staff Account Settings" roleLabel="Staff" />
      <AccountSettingsView roleLabel="Staff" showSystemSettings={false} />
    </>
  );
}
