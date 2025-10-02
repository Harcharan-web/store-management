import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, customers, sales, rentals } from "@/db/schema";
import { auth } from "@/auth";
import { count, eq, gte } from "drizzle-orm";
import type { ApiResponse } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total products
    const [{ totalProducts }] = await db
      .select({ totalProducts: count() })
      .from(products);

    // Get total customers
    const [{ totalCustomers }] = await db
      .select({ totalCustomers: count() })
      .from(customers);

    // Get active rentals
    const [{ activeRentals }] = await db
      .select({ activeRentals: count() })
      .from(rentals)
      .where(eq(rentals.status, "active"));

    // Get sales count for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [{ recentSales }] = await db
      .select({ recentSales: count() })
      .from(sales)
      .where(gte(sales.createdAt, thirtyDaysAgo));

    // Get low stock products count
    const lowStockProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.isActive, true));

    const lowStockCount = lowStockProducts.filter(
      (p: any) => p.currentStock <= p.minStockLevel
    ).length;

    const stats = {
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      activeRentals: activeRentals || 0,
      recentSales: recentSales || 0,
      lowStockProducts: lowStockCount,
    };

    return NextResponse.json<ApiResponse<typeof stats>>(
      { success: true, data: stats },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
