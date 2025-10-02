import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { auth } from "@/auth";
import { desc, ilike, or, count } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, Customer } from "@/types";

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
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`)
        )
      );
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(customers)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    // Get paginated data
    const customersList = await db
      .select()
      .from(customers)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    const response: PaginatedResponse<Customer> = {
      data: customersList,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<Customer>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch customers" },
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

    const [customer] = await db
      .insert(customers)
      .values({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        notes: body.notes,
      })
      .returning();

    return NextResponse.json<ApiResponse<Customer>>(
      {
        success: true,
        data: customer,
        message: "Customer created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
