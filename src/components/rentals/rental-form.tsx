"use client";

import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { RentalWithDetails, Customer, Product } from "@/types";
import type { RentalFormData } from "@/hooks/use-rentals";
import { useCustomers } from "@/hooks/use-customers";
import { useProducts } from "@/hooks/use-products";
import { formatCurrency } from "@/lib/utils";

interface RentalFormProps {
  rental: RentalWithDetails | null;
  onSubmit: (data: RentalFormData) => Promise<void>;
  onCancel: () => void;
}

const RentalForm: FC<RentalFormProps> = ({ rental, onSubmit, onCancel }) => {
  const { fetchCustomers } = useCustomers();
  const { fetchProducts } = useProducts();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const [formData, setFormData] = useState<RentalFormData>({
    customerId: rental?.customerId || "",
    productId: rental?.items[0]?.productId || "",
    quantity: rental?.items[0]?.quantity || 1,
    startDate: rental?.startDate || "",
    expectedReturnDate: rental?.expectedReturnDate || "",
    rateType: (rental?.items[0]?.rateType as "daily" | "weekly" | "monthly") || "daily",
    rateAmount: rental?.items[0]?.rateAmount || "",
    securityDeposit: rental?.securityDeposit || "",
    notes: rental?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
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

  // Update selected product when productId changes
  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === formData.productId);
      setSelectedProduct(product || null);

      // Set initial rate if product is selected
      if (product && !formData.rateAmount) {
        const rateAmount =
          formData.rateType === "daily" ? product.rentPricePerDay :
          formData.rateType === "weekly" ? product.rentPricePerWeek :
          product.rentPricePerMonth;

        if (rateAmount) {
          setFormData(prev => ({ ...prev, rateAmount: rateAmount.toString() }));
        }
      }
    } else {
      setSelectedProduct(null);
    }
  }, [formData.productId, products, formData.rateType]);

  // Calculate rental period and total amount
  useEffect(() => {
    if (formData.startDate && formData.expectedReturnDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.expectedReturnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const days = diffDays;
      const weeks = Math.ceil(diffDays / 7);
      const months = Math.ceil(diffDays / 30);

      setRentalPeriod({ days, weeks, months });

      // Calculate total amount
      if (formData.rateAmount && formData.quantity) {
        let periodCount = 0;
        if (formData.rateType === "daily") periodCount = days;
        else if (formData.rateType === "weekly") periodCount = weeks;
        else if (formData.rateType === "monthly") periodCount = months;

        const rate = parseFloat(formData.rateAmount) || 0;
        const total = rate * periodCount * formData.quantity;
        setTotalAmount(total);
      }
    }
  }, [formData.startDate, formData.expectedReturnDate, formData.rateAmount, formData.rateType, formData.quantity]);

  const handleChange = useCallback(
    (field: keyof RentalFormData, value: string | number) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const handleRateTypeChange = useCallback(
    (value: string) => {
      const rateType = value as "daily" | "weekly" | "monthly";
      setFormData((prev) => ({ ...prev, rateType }));

      // Update rate amount based on selected product
      if (selectedProduct) {
        const rateAmount =
          rateType === "daily" ? selectedProduct.rentPricePerDay :
          rateType === "weekly" ? selectedProduct.rentPricePerWeek :
          selectedProduct.rentPricePerMonth;

        if (rateAmount) {
          setFormData(prev => ({ ...prev, rateAmount: rateAmount.toString() }));
        }
      }

      if (errors.rateType) {
        setErrors((prev) => ({ ...prev, rateType: "" }));
      }
    },
    [selectedProduct, errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = "Customer is required";
    }

    if (!formData.productId) {
      newErrors.productId = "Product is required";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.expectedReturnDate) {
      newErrors.expectedReturnDate = "Return date is required";
    }

    if (formData.startDate && formData.expectedReturnDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.expectedReturnDate);
      if (end <= start) {
        newErrors.expectedReturnDate = "Return date must be after start date";
      }
    }

    if (!formData.rateAmount || parseFloat(formData.rateAmount) <= 0) {
      newErrors.rateAmount = "Rate amount is required and must be greater than 0";
    }

    if (selectedProduct && (selectedProduct.type !== "rent" && selectedProduct.type !== "both")) {
      newErrors.productId = "Selected product is not available for rental";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedProduct]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, onSubmit]
  );

  // Filter products based on search
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // Get available rate options for selected product
  const availableRates = selectedProduct ? [
    ...(selectedProduct.rentPricePerDay ? [{
      value: "daily",
      label: `Daily - ${formatCurrency(selectedProduct.rentPricePerDay)}`,
    }] : []),
    ...(selectedProduct.rentPricePerWeek ? [{
      value: "weekly",
      label: `Weekly - ${formatCurrency(selectedProduct.rentPricePerWeek)}`,
    }] : []),
    ...(selectedProduct.rentPricePerMonth ? [{
      value: "monthly",
      label: `Monthly - ${formatCurrency(selectedProduct.rentPricePerMonth)}`,
    }] : []),
  ] : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Customer *"
          value={formData.customerId}
          onChange={(e) => handleChange("customerId", e.target.value)}
          options={[
            { value: "", label: "Select a customer" },
            ...customers.map((customer) => ({
              value: customer.id,
              label: `${customer.name} - ${customer.phone}`,
            })),
          ]}
          error={errors.customerId}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Product * (search to find)
          </label>
          <Input
            type="search"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="mb-2"
          />
          <Select
            value={formData.productId}
            onChange={(e) => handleChange("productId", e.target.value)}
            options={[
              { value: "", label: "Select a product" },
              ...filteredProducts.map((product) => ({
                value: product.id,
                label: `${product.name}${product.sku ? ` (${product.sku})` : ""} - Stock: ${product.currentStock}`,
              })),
            ]}
            error={errors.productId}
          />
        </div>

        <Input
          label="Quantity *"
          type="number"
          min={1}
          value={formData.quantity}
          onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 1)}
          error={errors.quantity}
          placeholder="1"
        />

        <Input
          label="Start Date *"
          type="date"
          value={formData.startDate}
          onChange={(e) => handleChange("startDate", e.target.value)}
          error={errors.startDate}
        />

        <Input
          label="Expected Return Date *"
          type="date"
          value={formData.expectedReturnDate}
          onChange={(e) => handleChange("expectedReturnDate", e.target.value)}
          error={errors.expectedReturnDate}
        />

        {selectedProduct && availableRates.length > 0 && (
          <Select
            label="Rate Type *"
            value={formData.rateType}
            onChange={(e) => handleRateTypeChange(e.target.value)}
            options={availableRates}
            error={errors.rateType}
          />
        )}

        <Input
          label="Rate Amount *"
          type="number"
          step="0.01"
          value={formData.rateAmount}
          onChange={(e) => handleChange("rateAmount", e.target.value)}
          error={errors.rateAmount}
          placeholder="0.00"
        />

        <Input
          label="Security Deposit"
          type="number"
          step="0.01"
          value={formData.securityDeposit}
          onChange={(e) => handleChange("securityDeposit", e.target.value)}
          placeholder="0.00"
        />
      </div>

      {/* Rental Period Summary */}
      {rentalPeriod.days > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Rental Period Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">Total Days</p>
              <p className="text-2xl font-bold text-gray-900">{rentalPeriod.days}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">Total Weeks</p>
              <p className="text-2xl font-bold text-gray-900">{rentalPeriod.weeks}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">Total Months</p>
              <p className="text-2xl font-bold text-gray-900">{rentalPeriod.months}</p>
            </div>
          </div>
        </div>
      )}

      {/* Total Amount */}
      {totalAmount > 0 && (
        <div className="border-t pt-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">Total Rental Amount</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.quantity} × {formatCurrency(parseFloat(formData.rateAmount) || 0)} × {
                    formData.rateType === "daily" ? `${rentalPeriod.days} days` :
                    formData.rateType === "weekly" ? `${rentalPeriod.weeks} weeks` :
                    `${rentalPeriod.months} months`
                  }
                </p>
              </div>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
            </div>
            {formData.securityDeposit && parseFloat(formData.securityDeposit) > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">Security Deposit</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(parseFloat(formData.securityDeposit))}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
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
