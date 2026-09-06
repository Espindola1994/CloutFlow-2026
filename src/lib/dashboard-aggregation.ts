export interface DashboardOrder {
  platform: string | null;
  service?: string | null;
  totalCents: number | string | null;
  paymentStatus: string | null;
}

export interface DashboardBreakdownItem {
  count: number;
  revenue: number;
  percentage: number;
}

export type DashboardBreakdown = Record<"instagram" | "tiktok" | "twitter" | "youtube", DashboardBreakdownItem>;

export function aggregateDashboardOrders(orders: DashboardOrder[], netRevenueDollars = 0): DashboardBreakdown {
  const breakdown: DashboardBreakdown = {
    instagram: { count: 0, revenue: 0, percentage: 0 },
    tiktok: { count: 0, revenue: 0, percentage: 0 },
    twitter: { count: 0, revenue: 0, percentage: 0 },
    youtube: { count: 0, revenue: 0, percentage: 0 },
  };
  for (const order of orders) {
    const platform = (order.platform || "instagram").toLowerCase() as keyof DashboardBreakdown;
    const status = (order.paymentStatus || "").toUpperCase();
    if (!breakdown[platform]) continue;
    breakdown[platform].count += 1;
    if (status === "PAID" || status === "COMPLETED" || status === "APPROVED") {
      breakdown[platform].revenue += Number(order.totalCents || 0) / 100;
    }
  }
  for (const item of Object.values(breakdown)) {
    item.percentage = netRevenueDollars > 0 ? Math.round((item.revenue / netRevenueDollars) * 100) : 0;
  }
  return breakdown;
}
