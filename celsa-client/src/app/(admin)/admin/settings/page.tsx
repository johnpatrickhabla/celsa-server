"use client";

import DashboardTopbar from "@/components/shared/DashboardTopbar";
import AccountSettingsView from "@/components/shared/AccountSettingsView";

export default function AdminSettingsPage() {
  return (
    <>
      <DashboardTopbar title="System & Account Settings" roleLabel="Admin" />
      <AccountSettingsView roleLabel="Admin" showSystemSettings={true} />
    </>
  );
}
