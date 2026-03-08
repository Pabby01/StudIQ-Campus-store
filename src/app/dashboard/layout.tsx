import Sidebar from "@/components/Sidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-soft-gray-bg overflow-x-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full overflow-x-hidden md:pl-64">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
