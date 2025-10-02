import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rentals } from "@/db/schema";
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

    // Update rental status to returned
    const [updated] = await db
      .update(rentals)
      .set({
        status: "returned",
        actualReturnDate: new Date().toISOString().split('T')[0],
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

    return NextResponse.json<ApiResponse>(
      { success: true, data: updated, message: "Rental marked as returned" },
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
