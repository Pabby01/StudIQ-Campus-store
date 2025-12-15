import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-soft-gray-bg">
      <Sidebar />
      <main className="flex-1 w-full md:w-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
