import AccessDenied from "@/components/shared/AccessDenied";

export default function UnauthorizedPage() {
  return <AccessDenied requiredRole="admin" />;
}
