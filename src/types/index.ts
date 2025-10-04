import type {
  customers,
  products,
  sales,
  saleItems,
  rentals,
  rentalItems,
  users,
} from "@/db/schema";

// Database model types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;

export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;

export type RentalItem = typeof rentalItems.$inferSelect;
export type NewRentalItem = typeof rentalItems.$inferInsert;

// Extended types with relations
export type SaleWithDetails = Sale & {
  customer: Customer;
  user: User;
  items: (SaleItem & { product: Product })[];
};

export type RentalWithDetails = Rental & {
  customer: Customer;
  user: User;
  items: (RentalItem & { product: Product })[];
};

// API Response types
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Form types
export type ProductFormData = {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit: string;
  type: "sale" | "rent" | "both";
  currentStock: number;
  minStockLevel?: number;
  salePrice?: string;
  rentPricePerDay?: string;
  rentPricePerWeek?: string;
  rentPricePerMonth?: string;
  securityDeposit?: string;
  isActive: boolean;
};

export type CustomerFormData = {
  name: string;
  shortName?: string;
  phone: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  city?: string;
  state?: string;
  pincode?: string;
  notes?: string;
};

export type SaleFormData = {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: string;
    discount?: string;
  }[];
  discount?: string;
  tax?: string;
  paymentStatus: "paid" | "partial" | "pending";
  paymentMethod?: "cash" | "card" | "upi" | "bank_transfer" | "cheque";
  amountPaid?: string;
  notes?: string;
};

export type RentalFormData = {
  customerId: string;
  startDate: string;
  expectedReturnDate: string;
  items: {
    productId: string;
    quantity: number;
    rateType: "daily" | "weekly" | "monthly";
    rateAmount: string;
  }[];
  securityDeposit?: string;
  notes?: string;
};
