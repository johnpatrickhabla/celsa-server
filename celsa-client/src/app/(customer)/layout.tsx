import CustomerNavbar from "@/components/customer/CustomerNavbar";
import CustomerFooter from "@/components/customer/CustomerFooter";
import CartNotificationToast from "@/components/customer/CartNotificationToast";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CustomerNavbar />
      <main>{children}</main>
      <CustomerFooter />
      <CartNotificationToast />
    </>
  );
}
