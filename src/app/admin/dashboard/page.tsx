import { AdminSidebar } from "@/components/admin/sidebar";
import { DashboardContent } from "@/components/admin/dashboard-content";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-black">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your platform&apos;s performance.
            </p>
          </div>
          
          <DashboardContent />
        </div>
      </main>
    </div>
  );
}
