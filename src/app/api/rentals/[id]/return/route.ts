import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rentals, rentalItems } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/types";

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Get current rental and items
    const [rental] = await db
      .select()
      .from(rentals)
      .where(eq(rentals.id, id));

    if (!rental) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Rental not found" },
        { status: 404 }
      );
    }

    const items = await db
      .select()
      .from(rentalItems)
      .where(eq(rentalItems.rentalId, id));

    // Update each rental item with returned quantity and date
    for (const returnItem of body.items) {
      const item = items.find(i => i.id === returnItem.id);
      if (item) {
        const newQuantityReturned = (item.quantityReturned || 0) + returnItem.quantityReturned;
        await db
          .update(rentalItems)
          .set({
            quantityReturned: newQuantityReturned,
            returnDate: body.returnDate,
          })
          .where(eq(rentalItems.id, returnItem.id));
      }
    }

    // Check if all items are fully returned
    const updatedItems = await db
      .select()
      .from(rentalItems)
      .where(eq(rentalItems.rentalId, id));

    const allReturned = updatedItems.every(item =>
      (item.quantityReturned || 0) >= item.quantity
    );

    const someReturned = updatedItems.some(item =>
      (item.quantityReturned || 0) > 0
    );

    // Determine new status
    let newStatus = rental.status;
    if (allReturned) {
      newStatus = "returned";
    } else if (someReturned) {
      newStatus = "partial_return";
    }

    // Calculate actual charges (from frontend calculation)
    const actualRentalCharges = parseFloat(body.actualRentalCharges) || 0;
    const lateFee = parseFloat(body.lateFee) || 0;
    const damageCharges = parseFloat(body.damageCharges) || 0;
    const securityDeposit = body.depositReturned ? (parseFloat(rental.securityDeposit || "0") || 0) : 0;

    // Calculate final amount
    const finalAmount = actualRentalCharges + lateFee + damageCharges - securityDeposit;

    // Update rental with actual charges and return data
    const [updated] = await db
      .update(rentals)
      .set({
        status: newStatus as any,
        actualReturnDate: allReturned ? body.returnDate : null,
        nextReturnDate: !allReturned ? body.nextReturnDate : null,
        // Update total charges to actual charges
        totalCharges: actualRentalCharges.toFixed(2),
        // Track return payment details
        returnPaymentMethod: body.returnPaymentMethod,
        returnPaymentAmount: body.returnPaymentAmount,
        returnNotes: body.returnNotes || null,
        // Update amount due based on final calculation
        amountDue: finalAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Failed to update rental" },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: updated,
        message: allReturned
          ? "Rental completed and returned"
          : "Partial return processed successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error returning rental:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to return rental" },
      { status: 500 }
    );
  }
}
