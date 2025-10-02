import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/auth";
import { desc, ilike, or, count } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, Product } from "@/types";

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
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.sku, `%${search}%`),
          ilike(products.category, `%${search}%`)
        )
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    // Get paginated data
    const productsList = await db
      .select()
      .from(products)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Product> = {
      data: productsList,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<Product>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Helper function to convert empty strings to null for numeric fields
    const parseNumericField = (value: any): string | null => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    const [product] = await db
      .insert(products)
      .values({
        name: body.name,
        description: body.description || null,
        sku: body.sku || null,
        category: body.category || null,
        unit: body.unit || null,
        type: body.type,
        currentStock: body.currentStock ? Number.parseInt(body.currentStock) : 0,
        minStockLevel: body.minStockLevel ? Number.parseInt(body.minStockLevel) : 0,
        salePrice: parseNumericField(body.salePrice),
        rentPricePerDay: parseNumericField(body.rentPricePerDay),
        rentPricePerWeek: parseNumericField(body.rentPricePerWeek),
        rentPricePerMonth: parseNumericField(body.rentPricePerMonth),
        securityDeposit: parseNumericField(body.securityDeposit),
        isActive: body.isActive ?? true,
      })
      .returning();

    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: product, message: "Product created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
