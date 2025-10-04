import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/auth";
import { eq, ilike, or, count, and } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse } from "@/types";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(products.isActive, true)];

    if (search) {
      whereConditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        ) as any
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(and(...whereConditions));

    // Get paginated products
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
      .where(and(...whereConditions));

    // Sort by low stock first, then alphabetically
    const sortedProducts = allProducts
      .filter((p) => p.currentStock !== null && p.minStockLevel !== null)
      .sort((a, b) => {
        const aLow = (a.currentStock || 0) <= (a.minStockLevel || 0) ? 1 : 0;
        const bLow = (b.currentStock || 0) <= (b.minStockLevel || 0) ? 1 : 0;
        if (aLow !== bLow) return bLow - aLow;
        return a.name.localeCompare(b.name);
      });

    // Apply pagination
    const paginatedProducts = sortedProducts
      .slice(offset, offset + limit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        currentStock: p.currentStock || 0,
        minStockLevel: p.minStockLevel || 0,
        unit: p.unit || "piece",
        salePrice: p.salePrice || "0",
      }));

    const response: PaginatedResponse<typeof paginatedProducts[0]> = {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total: sortedProducts.length,
        totalPages: Math.ceil(sortedProducts.length / limit),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<typeof paginatedProducts[0]>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
