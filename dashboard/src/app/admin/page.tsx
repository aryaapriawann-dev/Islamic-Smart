import AdminLayout from "./AdminLayout";
import VisitorDashboard from "./visitor/page";

export default function AdminHome() {
  return (
    <AdminLayout>
      <VisitorDashboard />
    </AdminLayout>
  );
}
