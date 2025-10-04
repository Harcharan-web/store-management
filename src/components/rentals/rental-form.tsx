"use client";

import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { RentalWithDetails, Customer, Product } from "@/types";
import { useCustomers } from "@/hooks/use-customers";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

interface RentalFormProps {
  rental: RentalWithDetails | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface RentalItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  rateType: "daily" | "weekly" | "monthly";
  rateAmount: string;
  currentStock: number;
}

const RentalForm: FC<RentalFormProps> = ({ rental, onSubmit, onCancel }) => {
  const { fetchCustomers } = useCustomers();
  const { fetchProducts } = useProducts();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const [customerId, setCustomerId] = useState(rental?.customerId || "");
  const [items, setItems] = useState<RentalItem[]>([]);
  const [startDate, setStartDate] = useState(rental?.startDate || "");
  const [expectedReturnDate, setExpectedReturnDate] = useState(rental?.expectedReturnDate || "");
  const [securityDeposit, setSecurityDeposit] = useState(rental?.securityDeposit || "");
  const [notes, setNotes] = useState(rental?.notes || "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [rentalPeriod, setRentalPeriod] = useState({ days: 0, weeks: 0, months: 0 });

  // Load customers and products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          fetchCustomers(1, 100),
          fetchProducts(1, 100),
        ]);
        setCustomers(customersData.data);
        // Filter products to only show rental items
        setProducts(productsData.data.filter(p => p.type === "rent" || p.type === "both"));
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    };
    loadData();
  }, [fetchCustomers, fetchProducts]);

  // Initialize items from existing rental
  useEffect(() => {
    if (rental && rental.items && rental.items.length > 0 && items.length === 0) {
      const initialItems = rental.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        unit: item.product.unit || "piece",
        quantity: item.quantity,
        rateType: (item.rateType || "daily") as "daily" | "weekly" | "monthly",
        rateAmount: item.rateAmount || "0",
        currentStock: item.product.currentStock || 0,
      }));
      setItems(initialItems);
    }
  }, [rental, items.length]);

  // Calculate rental period
  useEffect(() => {
    if (startDate && expectedReturnDate) {
      const start = new Date(startDate);
      const end = new Date(expectedReturnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const days = diffDays;
      const weeks = Math.ceil(diffDays / 7);
      const months = Math.ceil(diffDays / 30);

      setRentalPeriod({ days, weeks, months });
    }
  }, [startDate, expectedReturnDate]);

  const handleAddProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if product already added
    if (items.some(item => item.productId === productId)) {
      alert("This product is already added");
      return;
    }

    const newItem: RentalItem = {
      productId: product.id,
      productName: product.name,
      unit: product.unit || "piece",
      quantity: 1,
      rateType: "daily",
      rateAmount: product.rentPricePerDay || "0",
      currentStock: product.currentStock || 0,
    };
    setItems([...items, newItem]);
    setProductSearch("");
  }, [products, items]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems(items.filter((_, i) => i !== index));
  }, [items]);

  const handleItemChange = useCallback((index: number, field: keyof RentalItem, value: string | number) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;

      // If changing rate type, update the rate amount from product
      if (field === "rateType") {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newRateType = value as "daily" | "weekly" | "monthly";
          const rateAmount =
            newRateType === "daily" ? product.rentPricePerDay :
            newRateType === "weekly" ? product.rentPricePerWeek :
            product.rentPricePerMonth;

          return {
            ...item,
            rateType: newRateType,
            rateAmount: rateAmount || "0",
          };
        }
      }

      return { ...item, [field]: value };
    }));
  }, [items, products]);

  const calculateItemTotal = useCallback((item: RentalItem): number => {
    if (!startDate || !expectedReturnDate) return 0;

    let periodCount = 0;
    if (item.rateType === "daily") periodCount = rentalPeriod.days;
    else if (item.rateType === "weekly") periodCount = rentalPeriod.weeks;
    else if (item.rateType === "monthly") periodCount = rentalPeriod.months;

    const rate = parseFloat(item.rateAmount) || 0;
    return rate * periodCount * item.quantity;
  }, [startDate, expectedReturnDate, rentalPeriod]);

  const calculateGrandTotal = useCallback((): number => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  }, [items, calculateItemTotal]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerId) {
      newErrors.customerId = "Customer is required";
    }

    if (items.length === 0) {
      newErrors.items = "At least one product is required";
    }

    items.forEach((item, index) => {
      if (!item.quantity || item.quantity < 1) {
        newErrors[`quantity_${index}`] = "Quantity must be at least 1";
      }
      if (item.quantity > item.currentStock) {
        newErrors[`quantity_${index}`] = `Only ${item.currentStock} available in stock`;
      }
      if (!item.rateAmount || parseFloat(item.rateAmount) <= 0) {
        newErrors[`rateAmount_${index}`] = "Rate amount must be greater than 0";
      }
    });

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!expectedReturnDate) {
      newErrors.expectedReturnDate = "Return date is required";
    }

    if (startDate && expectedReturnDate) {
      const start = new Date(startDate);
      const end = new Date(expectedReturnDate);
      if (end <= start) {
        newErrors.expectedReturnDate = "Return date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerId, items, startDate, expectedReturnDate]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setSubmitting(true);
      try {
        const formData = {
          customerId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            rateType: item.rateType,
            rateAmount: item.rateAmount,
          })),
          startDate,
          expectedReturnDate,
          securityDeposit,
          notes,
        };
        await onSubmit(formData);
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [customerId, items, startDate, expectedReturnDate, securityDeposit, notes, validate, onSubmit]
  );

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    !items.some(item => item.productId === p.id) && (
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    )
  );

  const getAvailableRates = (item: RentalItem) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return [];

    return [
      ...(product.rentPricePerDay ? [{
        value: "daily",
        label: `Daily - ${formatCurrency(product.rentPricePerDay)}`,
      }] : []),
      ...(product.rentPricePerWeek ? [{
        value: "weekly",
        label: `Weekly - ${formatCurrency(product.rentPricePerWeek)}`,
      }] : []),
      ...(product.rentPricePerMonth ? [{
        value: "monthly",
        label: `Monthly - ${formatCurrency(product.rentPricePerMonth)}`,
      }] : []),
    ];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Customer *"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          options={[
            { value: "", label: "Select a customer" },
            ...customers.map((customer) => ({
              value: customer.id,
              label: `${customer.name} - ${customer.phone}`,
            })),
          ]}
          error={errors.customerId}
        />

        <Input
          label="Start Date *"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={errors.startDate}
        />

        <Input
          label="Expected Return Date *"
          type="date"
          value={expectedReturnDate}
          onChange={(e) => setExpectedReturnDate(e.target.value)}
          error={errors.expectedReturnDate}
        />

        <Input
          label="Security Deposit"
          type="number"
          step="0.01"
          value={securityDeposit}
          onChange={(e) => setSecurityDeposit(e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Rental Period Summary */}
      {rentalPeriod.days > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Rental Period</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-700">Days</p>
              <p className="text-xl font-bold text-gray-900">{rentalPeriod.days}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-700">Weeks</p>
              <p className="text-xl font-bold text-gray-900">{rentalPeriod.weeks}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-700">Months</p>
              <p className="text-xl font-bold text-gray-900">{rentalPeriod.months}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Products *</h3>

        {/* Add Product */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Add Product
          </label>
          <div className="flex gap-2">
            <Input
              type="search"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="flex-1"
            />
            <Select
              value=""
              onChange={(e) => e.target.value && handleAddProduct(e.target.value)}
              options={[
                { value: "", label: "Select product" },
                ...filteredProducts.map((product) => ({
                  value: product.id,
                  label: `${product.name} - Stock: ${product.currentStock} ${product.unit}`,
                })),
              ]}
              className="flex-1"
            />
          </div>
          {errors.items && <p className="text-red-600 text-sm mt-1">{errors.items}</p>}
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item, index) => {
              const availableRates = getAvailableRates(item);
              const itemTotal = calculateItemTotal(item);

              return (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-600">Stock: {item.currentStock} {item.unit}</p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={item.currentStock}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || "")}
                        error={errors[`quantity_${index}`]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Type *
                      </label>
                      <Select
                        value={item.rateType}
                        onChange={(e) => handleItemChange(index, "rateType", e.target.value)}
                        options={availableRates}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Amount *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rateAmount}
                        onChange={(e) => handleItemChange(index, "rateAmount", e.target.value)}
                        error={errors[`rateAmount_${index}`]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="text-lg font-bold text-blue-600 mt-2">
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>
                  </div>

                  {rentalPeriod.days > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {item.quantity} × {formatCurrency(parseFloat(item.rateAmount) || 0)} × {
                        item.rateType === "daily" ? `${rentalPeriod.days} days` :
                        item.rateType === "weekly" ? `${rentalPeriod.weeks} weeks` :
                        `${rentalPeriod.months} months`
                      }
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grand Total */}
      {items.length > 0 && rentalPeriod.days > 0 && (
        <div className="border-t pt-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-700">Estimated Rental Charges</p>
                <p className="text-xs text-gray-600 mt-1">
                  {items.length} product{items.length > 1 ? "s" : ""} × {rentalPeriod.days} days
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(calculateGrandTotal())}</p>
            </div>

            {securityDeposit && parseFloat(securityDeposit) > 0 && (
              <div className="pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Security Deposit (Held)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Will be adjusted at return time
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-green-600">
                    {formatCurrency(parseFloat(securityDeposit))}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-100 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
              <p className="text-xs text-gray-600 mb-2">Note: Actual charges will be calculated based on actual return date</p>
            </div>
          </div>
        </div>
      )}

      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Additional notes about the rental"
        rows={3}
      />

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : rental ? "Update Rental" : "Create Rental"}
        </Button>
      </div>
    </form>
  );
};

export default RentalForm;
