import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { products } from "./products";
import { users } from "./users";

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "partial",
  "pending",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "upi",
  "bank_transfer",
  "cheque",
]);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    // Totals
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
    tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    // Payment
    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("pending"),
    paymentMethod: paymentMethodEnum("payment_method"),
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default(
      "0"
    ),
    amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(),

    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("sales_invoice_number_idx").on(table.invoiceNumber),
    index("sales_customer_id_idx").on(table.customerId),
    index("sales_user_id_idx").on(table.userId),
    index("sales_payment_status_idx").on(table.paymentStatus),
    index("sales_created_at_idx").on(table.createdAt),
  ]
);

export const saleItems = pgTable(
  "sale_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),

    quantity: integer("quantity").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("sale_items_sale_id_idx").on(table.saleId),
    index("sale_items_product_id_idx").on(table.productId),
  ]
);
