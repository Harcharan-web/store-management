import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, customers, products, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse, SaleWithDetails } from "@/types";

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

    const [sale] = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        discount: sales.discount,
        tax: sales.tax,
        total: sales.total,
        paymentStatus: sales.paymentStatus,
        paymentMethod: sales.paymentMethod,
        amountPaid: sales.amountPaid,
        amountDue: sales.amountDue,
        notes: sales.notes,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        customer: customers,
        user: users,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .where(eq(sales.id, id))
      .limit(1);

    if (!sale) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    const items = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        total: saleItems.total,
        createdAt: saleItems.createdAt,
        product: products,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    const response: SaleWithDetails = {
      ...sale,
      items,
    } as SaleWithDetails;

    return NextResponse.json<ApiResponse<SaleWithDetails>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch sale" },
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

    // Calculate totals
    const itemsTotal = body.items.reduce((sum: number, item: any) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      const itemDiscount = Number(item.discount || 0);
      return sum + (itemTotal - itemDiscount);
    }, 0);

    const subtotal = itemsTotal;
    const discount = Number(body.discount || 0);
    const tax = Number(body.tax || 0);
    const total = subtotal - discount + tax;
    const amountPaid = Number(body.amountPaid || 0);
    const amountDue = total - amountPaid;

    // Update sale
    const [updated] = await db
      .update(sales)
      .set({
        customerId: body.customerId,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentStatus: body.paymentStatus || "pending",
        paymentMethod: body.paymentMethod || null,
        amountPaid: amountPaid.toFixed(2),
        amountDue: amountDue.toFixed(2),
        notes: body.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(sales.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    // Delete existing sale items
    await db.delete(saleItems).where(eq(saleItems.saleId, id));

    // Create new sale items
    await Promise.all(
      body.items.map(async (item: any) => {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        const itemDiscount = Number(item.discount || 0);
        const itemFinalTotal = itemTotal - itemDiscount;

        await db.insert(saleItems).values({
          saleId: id,
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice).toFixed(2),
          discount: itemDiscount.toFixed(2),
          total: itemFinalTotal.toFixed(2),
        });
      })
    );

    // Fetch complete sale data with relations
    const [completeSale] = await db
      .select({
        id: sales.id,
        invoiceNumber: sales.invoiceNumber,
        customerId: sales.customerId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        discount: sales.discount,
        tax: sales.tax,
        total: sales.total,
        paymentStatus: sales.paymentStatus,
        paymentMethod: sales.paymentMethod,
        amountPaid: sales.amountPaid,
        amountDue: sales.amountDue,
        notes: sales.notes,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        customer: customers,
        user: users,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .leftJoin(users, eq(sales.userId, users.id))
      .where(eq(sales.id, id));

    const itemsWithProducts = await db
      .select({
        id: saleItems.id,
        saleId: saleItems.saleId,
        productId: saleItems.productId,
        quantity: saleItems.quantity,
        unitPrice: saleItems.unitPrice,
        discount: saleItems.discount,
        total: saleItems.total,
        createdAt: saleItems.createdAt,
        product: products,
      })
      .from(saleItems)
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(eq(saleItems.saleId, id));

    const response: SaleWithDetails = {
      ...completeSale,
      items: itemsWithProducts,
    } as SaleWithDetails;

    return NextResponse.json<ApiResponse<SaleWithDetails>>(
      { success: true, data: response, message: "Sale updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update sale" },
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
      .delete(sales)
      .where(eq(sales.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Sale deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to delete sale" },
      { status: 500 }
    );
  }
}
