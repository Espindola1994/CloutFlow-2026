import Link from "next/link";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  CreditCard,
  Layers,
  Activity
} from "lucide-react";

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-border/40 bg-card/30 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border/40">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Instahub Admin
          </span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-foreground">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/admin/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <ShoppingCart className="h-4 w-4" /> Orders
          </Link>
          <Link href="/admin/customers" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Users className="h-4 w-4" /> Customers
          </Link>
          <Link href="/admin/catalog" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Package className="h-4 w-4" /> Catalog
          </Link>
          <Link href="/admin/coupons" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <CreditCard className="h-4 w-4" /> Coupons
          </Link>
          <Link href="/admin/integrations" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Layers className="h-4 w-4" /> Integrations
          </Link>
          <Link href="/admin/analytics" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Activity className="h-4 w-4" /> Analytics
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-muted-foreground">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
      </div>
      
      <div className="p-4 border-t border-border/40">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
