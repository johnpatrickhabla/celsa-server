import type { Metadata } from "next";
import "@/styles/globals.css";
import BootstrapClient from "@/components/shared/BootstrapClient";
import IdleTimeoutHandler from "@/components/shared/IdleTimeoutHandler";

export const metadata: Metadata = {
  title: "Celsa Handicrafts",
  description: "Sales Management System with Product Customization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BootstrapClient />
        <IdleTimeoutHandler />
        {children}
      </body>
    </html>
  );
}
