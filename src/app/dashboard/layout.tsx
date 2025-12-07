import DashboardSidebar from "@/components/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex gap-6">
        <DashboardSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

