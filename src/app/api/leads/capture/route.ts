import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ success: false, error: "Invalid email" }, { status: 400 });
    const [existing] = await db.query.customers.findMany({ where: eq(customers.email, email), limit: 1 });
    if (existing) await db.update(customers).set({ updatedAt: new Date() }).where(eq(customers.id, existing.id));
    else await db.insert(customers).values({ email, totalOrders: 0, totalSpentCents: 0 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LeadCaptureAPI]", error);
    // Lead capture is important, but a temporary CRM write failure must not expose internals.
    return NextResponse.json({ success: false, error: "Unable to save email" }, { status: 500 });
  }
}
