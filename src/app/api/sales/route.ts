import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, customers, products, users } from "@/db/schema";
import { auth } from "@/auth";
import { desc, ilike, or, count, eq } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, SaleWithDetails } from "@/types";

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

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(sales.invoiceNumber, `%${search}%`),
          ilike(customers.name, `%${search}%`)
        )
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    // Get paginated data with relations
    const salesList = await db
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
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset);

    // Fetch items for each sale
    const salesWithItems = await Promise.all(
      salesList.map(async (sale) => {
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
          .where(eq(saleItems.saleId, sale.id));

        return {
          ...sale,
          items,
        };
      })
    );

    const response: PaginatedResponse<SaleWithDetails> = {
      data: salesWithItems as SaleWithDetails[],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<SaleWithDetails>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch sales" },
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

    // Generate invoice number
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${timestamp}-${random}`;

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

    // Create sale
    const [sale] = await db
      .insert(sales)
      .values({
        invoiceNumber,
        customerId: body.customerId,
        userId: session.user.id,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        paymentStatus: body.paymentStatus || "pending",
        paymentMethod: body.paymentMethod || null,
        amountPaid: amountPaid.toFixed(2),
        amountDue: amountDue.toFixed(2),
        notes: body.notes || null,
      })
      .returning();

    // Create sale items
    const items = await Promise.all(
      body.items.map(async (item: any) => {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        const itemDiscount = Number(item.discount || 0);
        const itemFinalTotal = itemTotal - itemDiscount;

        const [saleItem] = await db
          .insert(saleItems)
          .values({
            saleId: sale.id,
            productId: item.productId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice).toFixed(2),
            discount: itemDiscount.toFixed(2),
            total: itemFinalTotal.toFixed(2),
          })
          .returning();

        // Update product stock
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (product) {
          await db
            .update(products)
            .set({
              currentStock: product.currentStock - Number(item.quantity),
            })
            .where(eq(products.id, item.productId));
        }

        return saleItem;
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
      .where(eq(sales.id, sale.id));

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
      .where(eq(saleItems.saleId, sale.id));

    const response: SaleWithDetails = {
      ...completeSale,
      items: itemsWithProducts,
    } as SaleWithDetails;

    return NextResponse.json<ApiResponse<SaleWithDetails>>(
      { success: true, data: response, message: "Sale created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
