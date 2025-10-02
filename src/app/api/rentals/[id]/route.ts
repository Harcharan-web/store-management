import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rentals, rentalItems, customers, products, users } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse, RentalWithDetails } from "@/types";

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

    const [rentalRow] = await db
      .select()
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.userId, users.id))
      .where(eq(rentals.id, id))
      .limit(1);

    if (!rentalRow) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rental not found" },
        { status: 404 }
      );
    }

    // Get rental items
    const items = await db
      .select()
      .from(rentalItems)
      .leftJoin(products, eq(rentalItems.productId, products.id))
      .where(eq(rentalItems.rentalId, id));

    const rentalWithDetails: RentalWithDetails = {
      ...rentalRow.rentals,
      customer: rentalRow.customers!,
      user: rentalRow.users!,
      items: items.map((item) => ({
        ...item.rental_items,
        product: item.products!,
      })),
    };

    return NextResponse.json<ApiResponse<RentalWithDetails>>(
      { success: true, data: rentalWithDetails },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching rental:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch rental" },
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
    if (!session || !session.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Calculate dates and totals
    const startDate = new Date(body.startDate);
    const expectedReturnDate = new Date(body.expectedReturnDate);
    const diffTime = Math.abs(expectedReturnDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let periodCount = 0;
    if (body.rateType === "daily") periodCount = diffDays;
    else if (body.rateType === "weekly") periodCount = Math.ceil(diffDays / 7);
    else if (body.rateType === "monthly") periodCount = Math.ceil(diffDays / 30);

    const rateAmount = parseFloat(body.rateAmount) || 0;
    const quantity = parseInt(body.quantity) || 1;
    const subtotal = rateAmount * periodCount * quantity;
    const securityDeposit = parseFloat(body.securityDeposit) || 0;
    const totalCharges = subtotal;

    // Update rental
    const [updated] = await db
      .update(rentals)
      .set({
        customerId: body.customerId,
        startDate: body.startDate,
        expectedReturnDate: body.expectedReturnDate,
        subtotal: subtotal.toFixed(2),
        securityDeposit: securityDeposit.toFixed(2),
        totalCharges: totalCharges.toFixed(2),
        amountDue: totalCharges.toFixed(2),
        notes: body.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rental not found" },
        { status: 404 }
      );
    }

    // Update rental items (delete old and create new)
    await db.delete(rentalItems).where(eq(rentalItems.rentalId, id));

    await db.insert(rentalItems).values({
      rentalId: id,
      productId: body.productId,
      quantity,
      rateType: body.rateType,
      rateAmount: rateAmount.toFixed(2),
      totalDays: diffDays,
      total: subtotal.toFixed(2),
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: updated, message: "Rental updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating rental:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update rental" },
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

    // Rental items will be deleted automatically due to cascade
    const [deleted] = await db
      .delete(rentals)
      .where(eq(rentals.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rental not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Rental deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting rental:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to delete rental" },
      { status: 500 }
    );
  }
}
