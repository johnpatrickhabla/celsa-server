import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerFooter from "@/components/customer/CustomerFooter";
import CartNotificationToast from "@/components/customer/CartNotificationToast";
import CustomerPortalGuard from "@/components/customer/CustomerPortalGuard";
import SheinErrorToast from "@/components/customer/SheinErrorToast";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CustomerPortalGuard>
      <SheinErrorToast />
      <CustomerNavbar />
      <main>{children}</main>
      <CustomerFooter />
      <CartNotificationToast />
    </CustomerPortalGuard>
  );
}
