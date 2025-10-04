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

    // Get all active products for stock analysis
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        currentStock: products.currentStock,
        minStockLevel: products.minStockLevel,
        unit: products.unit,
        salePrice: products.salePrice,
      })
      .from(products)
      .where(eq(products.isActive, true));

    // Filter low stock products
    const lowStockCount = allProducts.filter(
      (p) => p.currentStock && p.minStockLevel && p.currentStock <= p.minStockLevel
    ).length;

    // Get stock summary (top 10 products sorted by stock level)
    const stockSummary = allProducts
      .filter((p) => p.currentStock !== null && p.minStockLevel !== null)
      .sort((a, b) => {
        // Sort by low stock first, then alphabetically
        const aLow = (a.currentStock || 0) <= (a.minStockLevel || 0) ? 1 : 0;
        const bLow = (b.currentStock || 0) <= (b.minStockLevel || 0) ? 1 : 0;
        if (aLow !== bLow) return bLow - aLow;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        currentStock: p.currentStock || 0,
        minStockLevel: p.minStockLevel || 0,
        unit: p.unit || "piece",
        salePrice: p.salePrice || "0",
      }));

    const stats = {
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0,
      activeRentals: activeRentals || 0,
      recentSales: recentSales || 0,
      lowStockProducts: lowStockCount,
      stockSummary,
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
