import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse, Customer } from "@/types";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Customer>>(
      { success: true, data: customer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch customer" },
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

    const [updated] = await db
      .update(customers)
      .set({
        name: body.name,
        shortName: body.shortName || null,
        phone: body.phone,
        address: body.address || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        city: body.city || null,
        state: body.state || null,
        pincode: body.pincode || null,
        notes: body.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Customer>>(
      {
        success: true,
        data: updated,
        message: "Customer updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to update customer" },
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
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Customer deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
