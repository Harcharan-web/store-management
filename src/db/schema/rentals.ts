import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  text,
  date,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { products } from "./products";
import { users } from "./users";

export const rentalStatusEnum = pgEnum("rental_status", [
  "active",
  "returned",
  "overdue",
  "cancelled",
]);

export const rentals = pgTable(
  "rentals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rentalNumber: varchar("rental_number", { length: 50 }).notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    startDate: date("start_date").notNull(),
    expectedReturnDate: date("expected_return_date").notNull(),
    actualReturnDate: date("actual_return_date"),

    status: rentalStatusEnum("status").notNull().default("active"),

    // Totals
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    securityDeposit: decimal("security_deposit", {
      precision: 10,
      scale: 2,
    }).default("0"),
    totalCharges: decimal("total_charges", {
      precision: 10,
      scale: 2,
    }).notNull(),
    lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default("0"),
    damageCharges: decimal("damage_charges", {
      precision: 10,
      scale: 2,
    }).default("0"),

    // Payment tracking
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default(
      "0"
    ),
    amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),
    depositReturned: boolean("deposit_returned").default(false),

    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("rentals_rental_number_idx").on(table.rentalNumber),
    index("rentals_customer_id_idx").on(table.customerId),
    index("rentals_user_id_idx").on(table.userId),
    index("rentals_status_idx").on(table.status),
    index("rentals_start_date_idx").on(table.startDate),
    index("rentals_expected_return_date_idx").on(table.expectedReturnDate),
    index("rentals_created_at_idx").on(table.createdAt),
  ]
);

export const rentalItems = pgTable(
  "rental_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rentalId: uuid("rental_id")
      .notNull()
      .references(() => rentals.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    quantity: integer("quantity").notNull(),
    dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
    weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }),
    monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }),

    // Actual rate used
    rateType: varchar("rate_type", { length: 20 }).notNull(), // daily, weekly, monthly
    rateAmount: decimal("rate_amount", { precision: 10, scale: 2 }).notNull(),

    totalDays: integer("total_days"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("rental_items_rental_id_idx").on(table.rentalId),
    index("rental_items_product_id_idx").on(table.productId),
  ]
);
