import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("product_type", ["sale", "rent", "both"]);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    sku: varchar("sku", { length: 100 }).unique(),
    category: varchar("category", { length: 100 }),
    unit: varchar("unit", { length: 50 }).notNull().default("piece"), // piece, kg, bag, box, etc.
    type: productTypeEnum("type").notNull().default("both"), // sale, rent, or both

    // Stock Management
    currentStock: integer("current_stock").notNull().default(0),
    minStockLevel: integer("min_stock_level").default(0),

    // Pricing for Sale
    salePrice: decimal("sale_price", { precision: 10, scale: 2 }),

    // Pricing for Rent
    rentPricePerDay: decimal("rent_price_per_day", { precision: 10, scale: 2 }),
    rentPricePerWeek: decimal("rent_price_per_week", {
      precision: 10,
      scale: 2,
    }),
    rentPricePerMonth: decimal("rent_price_per_month", {
      precision: 10,
      scale: 2,
    }),

    // Security deposit for rentals
    securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("products_name_idx").on(table.name),
    index("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.category),
    index("products_type_idx").on(table.type),
    index("products_is_active_idx").on(table.isActive),
    index("products_current_stock_idx").on(table.currentStock),
    index("products_created_at_idx").on(table.createdAt),
  ]
);
