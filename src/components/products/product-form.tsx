"use client";

import { useState, useCallback, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { Product, ProductFormData } from "@/types";
import { PRODUCT_TYPES, PRODUCT_UNITS } from "@/lib/constants";

interface ProductFormProps {
  product: Product | null;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

const ProductForm: FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || "",
    description: product?.description || "",
    sku: product?.sku || "",
    category: product?.category || "",
    unit: product?.unit || "piece",
    type: product?.type || "both",
    currentStock: product?.currentStock ?? "",
    minStockLevel: product?.minStockLevel ?? "",
    salePrice: product?.salePrice || "",
    rentPricePerDay: product?.rentPricePerDay || "",
    rentPricePerWeek: product?.rentPricePerWeek || "",
    rentPricePerMonth: product?.rentPricePerMonth || "",
    securityDeposit: product?.securityDeposit || "",
    isActive: product?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof ProductFormData, value: string | number | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.unit) {
      newErrors.unit = "Unit is required";
    }

    if (formData.type === "sale" || formData.type === "both") {
      if (!formData.salePrice) {
        newErrors.salePrice = "Sale price is required for sale items";
      }
    }

    if (formData.type === "rent" || formData.type === "both") {
      if (
        !formData.rentPricePerDay &&
        !formData.rentPricePerWeek &&
        !formData.rentPricePerMonth
      ) {
        newErrors.rentPricePerDay =
          "At least one rental price is required for rental items";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Product Name *"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          placeholder="Enter product name"
        />

        <Input
          label="SKU"
          value={formData.sku}
          onChange={(e) => handleChange("sku", e.target.value)}
          error={errors.sku}
          placeholder="Stock Keeping Unit"
        />

        <Input
          label="Category"
          value={formData.category}
          onChange={(e) => handleChange("category", e.target.value)}
          placeholder="e.g., Cement, Steel, etc."
        />

        <Select
          label="Unit *"
          value={formData.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
          options={PRODUCT_UNITS.map((unit) => ({
            value: unit,
            label: unit.charAt(0).toUpperCase() + unit.slice(1),
          }))}
          error={errors.unit}
        />

        <Select
          label="Product Type *"
          value={formData.type}
          onChange={(e) => handleChange("type", e.target.value)}
          options={PRODUCT_TYPES.map((type) => ({
            value: type.value,
            label: type.label,
          }))}
          error={errors.type}
        />

        <Input
          label="Current Stock"
          type="number"
          value={formData.currentStock}
          onChange={(e) => handleChange("currentStock", e.target.value)}
          min={0}
          placeholder="0"
        />

        <Input
          label="Minimum Stock Level"
          type="number"
          value={formData.minStockLevel}
          onChange={(e) => handleChange("minStockLevel", e.target.value)}
          min={0}
          placeholder="0"
        />
      </div>

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="Product description"
        rows={3}
      />

      {(formData.type === "sale" || formData.type === "both") && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Sale Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Sale Price *"
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={(e) => handleChange("salePrice", e.target.value)}
              error={errors.salePrice}
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {(formData.type === "rent" || formData.type === "both") && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Rental Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Rent Per Day"
              type="number"
              step="0.01"
              value={formData.rentPricePerDay}
              onChange={(e) => handleChange("rentPricePerDay", e.target.value)}
              error={errors.rentPricePerDay}
              placeholder="0.00"
            />

            <Input
              label="Rent Per Week"
              type="number"
              step="0.01"
              value={formData.rentPricePerWeek}
              onChange={(e) => handleChange("rentPricePerWeek", e.target.value)}
              placeholder="0.00"
            />

            <Input
              label="Rent Per Month"
              type="number"
              step="0.01"
              value={formData.rentPricePerMonth}
              onChange={(e) =>
                handleChange("rentPricePerMonth", e.target.value)
              }
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
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange("isActive", e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-800">
          Active Product
        </label>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
