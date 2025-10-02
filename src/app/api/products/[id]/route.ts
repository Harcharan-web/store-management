import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse, Product } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: product },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Helper function to convert empty strings to null for numeric fields
    const parseNumericField = (value: any): string | null => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    const [updated] = await db
      .update(products)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: updated, message: "Product updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
