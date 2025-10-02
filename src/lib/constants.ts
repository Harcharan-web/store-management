export const ITEMS_PER_PAGE = 10;

export const PRODUCT_TYPES = [
  { value: "sale", label: "Sale Only" },
  { value: "rent", label: "Rent Only" },
  { value: "both", label: "Both Sale & Rent" },
] as const;

export const PRODUCT_UNITS = [
  "piece",
  "kg",
  "gram",
  "liter",
  "meter",
  "bag",
  "box",
  "bundle",
  "ton",
] as const;

export const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid", color: "green" },
  { value: "partial", label: "Partial", color: "yellow" },
  { value: "pending", label: "Pending", color: "red" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
] as const;

export const RENTAL_STATUSES = [
  { value: "active", label: "Active", color: "blue" },
  { value: "returned", label: "Returned", color: "green" },
  { value: "overdue", label: "Overdue", color: "red" },
  { value: "cancelled", label: "Cancelled", color: "gray" },
] as const;

export const RENTAL_RATE_TYPES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;
