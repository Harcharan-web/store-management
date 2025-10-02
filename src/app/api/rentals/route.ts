import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rentals, rentalItems, customers, products, users } from "@/db/schema";
import { auth } from "@/auth";
import { desc, ilike, or, count, eq, and } from "drizzle-orm";
import type { ApiResponse, PaginatedResponse, RentalWithDetails } from "@/types";

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
    const status = searchParams.get("status") || "";

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          ilike(rentals.rentalNumber, `%${search}%`),
          ilike(customers.name, `%${search}%`),
          ilike(customers.phone, `%${search}%`)
        )
      );
    }
    if (status) {
      whereConditions.push(eq(rentals.status, status as any));
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    // Get paginated data with relations
    const rentalsList = await db
      .select()
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.userId, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(rentals.createdAt))
      .limit(limit)
      .offset(offset);

    // Get rental items for each rental
    const rentalsWithDetails: RentalWithDetails[] = await Promise.all(
      rentalsList.map(async (row) => {
        const items = await db
          .select()
          .from(rentalItems)
          .leftJoin(products, eq(rentalItems.productId, products.id))
          .where(eq(rentalItems.rentalId, row.rentals.id));

        return {
          ...row.rentals,
          customer: row.customers!,
          user: row.users!,
          items: items.map((item) => ({
            ...item.rental_items,
            product: item.products!,
          })),
        };
      })
    );

    const response: PaginatedResponse<RentalWithDetails> = {
      data: rentalsWithDetails,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    };

    return NextResponse.json<ApiResponse<PaginatedResponse<RentalWithDetails>>>(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching rentals:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to fetch rentals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Generate rental number
    const rentalNumber = `RNT-${Date.now()}`;

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

    // Create rental
    const [rental] = await db
      .insert(rentals)
      .values({
        rentalNumber,
        customerId: body.customerId,
        userId: session.user.id,
        startDate: body.startDate,
        expectedReturnDate: body.expectedReturnDate,
        status: "active",
        subtotal: subtotal.toFixed(2),
        securityDeposit: securityDeposit.toFixed(2),
        totalCharges: totalCharges.toFixed(2),
        amountDue: totalCharges.toFixed(2),
        notes: body.notes || null,
      })
      .returning();

    // Create rental item
    await db.insert(rentalItems).values({
      rentalId: rental.id,
      productId: body.productId,
      quantity,
      rateType: body.rateType,
      rateAmount: rateAmount.toFixed(2),
      totalDays: diffDays,
      total: subtotal.toFixed(2),
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: rental, message: "Rental created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating rental:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Failed to create rental" },
      { status: 500 }
    );
  }
}
