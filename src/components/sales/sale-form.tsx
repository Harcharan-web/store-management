"use client";

import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { SaleWithDetails, SaleFormData, Customer, Product } from "@/types";
import { PAYMENT_METHODS } from "@/lib/constants";

interface SaleFormProps {
  sale: SaleWithDetails | null;
  onSubmit: (data: SaleFormData) => Promise<void>;
  onCancel: () => void;
}

const SaleForm: FC<SaleFormProps> = ({ sale, onSubmit, onCancel }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    customerId: sale?.customerId || "",
    productId: sale?.items[0]?.productId || "",
    quantity: sale?.items[0]?.quantity || 1,
    unitPrice: sale?.items[0]?.unitPrice || "",
    totalPrice: sale?.total || "0",
    paymentMethod: sale?.paymentMethod || "",
    notes: sale?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Load customers and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers?limit=1000"),
          fetch("/api/products?limit=1000"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        if (customersData.success) {
          setCustomers(customersData.data.data);
        }

        if (productsData.success) {
          // Filter products that can be sold (type is "sale" or "both")
          const saleableProducts = productsData.data.data.filter(
            (p: Product) => p.type === "sale" || p.type === "both"
          );
          setProducts(saleableProducts);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Calculate total price when quantity or unit price changes
  useEffect(() => {
    const quantity = Number(formData.quantity) || 0;
    const unitPrice = Number(formData.unitPrice) || 0;
    const total = quantity * unitPrice;
    setFormData((prev) => ({ ...prev, totalPrice: total.toFixed(2) }));
  }, [formData.quantity, formData.unitPrice]);

  const handleChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

  const handleProductSelect = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        productId: product.id,
        unitPrice: product.salePrice || "",
      }));
      setProductSearch(product.name);
      setShowProductDropdown(false);
    }
  }, [products]);

  const filteredProducts = products.filter(p =>
    productSearch === "" ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = "Customer is required";
    }

    if (!formData.productId) {
      newErrors.productId = "Product is required";
    } else {
      const product = products.find(p => p.id === formData.productId);
      if (product && product.type !== "sale" && product.type !== "both") {
        newErrors.productId = "Product must be available for sale";
      }
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) {
      newErrors.unitPrice = "Valid unit price is required";
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, products]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setSubmitting(true);
      try {
        // Transform form data to match API expectations
        const apiData: SaleFormData = {
          customerId: formData.customerId,
          items: [{
            productId: formData.productId,
            quantity: Number(formData.quantity),
            unitPrice: formData.unitPrice,
            discount: "0",
          }],
          discount: "0",
          tax: "0",
          paymentStatus: "paid", // Assuming paid for simplicity
          paymentMethod: formData.paymentMethod as any,
          amountPaid: formData.totalPrice,
          notes: formData.notes,
        };

        await onSubmit(apiData);
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [formData, validate, onSubmit]
  );

  if (loadingData) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const selectedProduct = products.find(p => p.id === formData.productId);

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

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Product * (Search)
          </label>
          <Input
            type="text"
            placeholder="Search product by name or SKU..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowProductDropdown(true);
            }}
            onFocus={() => setShowProductDropdown(true)}
            error={errors.productId}
          />
          {showProductDropdown && productSearch && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b last:border-b-0"
                  onClick={() => handleProductSelect(product.id)}
                >
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="flex justify-between items-center mt-1">
                    {product.sku && (
                      <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                    )}
                    <div className="text-xs font-semibold text-blue-600">
                      ${product.salePrice || "0.00"}
                    </div>
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">No products found</div>
              )}
            </div>
          )}
        </div>

        <Select
          label="Product * (Dropdown)"
          value={formData.productId}
          onChange={(e) => {
            handleChange("productId", e.target.value);
            const product = products.find(p => p.id === e.target.value);
            if (product) {
              setProductSearch(product.name);
              handleChange("unitPrice", product.salePrice || "");
            }
          }}
          options={[
            { value: "", label: "Select a product" },
            ...products.map((product) => ({
              value: product.id,
              label: product.name,
            })),
          ]}
          error={errors.productId}
        />

        <Input
          label="Quantity *"
          type="number"
          min={1}
          value={formData.quantity}
          onChange={(e) => handleChange("quantity", Number(e.target.value))}
          error={errors.quantity}
          placeholder="Enter quantity"
        />

        <Input
          label="Unit Price *"
          type="number"
          step="0.01"
          value={formData.unitPrice}
          onChange={(e) => handleChange("unitPrice", e.target.value)}
          error={errors.unitPrice}
          placeholder="Auto-filled from product"
        />

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2">
            Total Price (Calculated)
          </label>
          <div className="h-11 flex items-center px-4 bg-blue-50 rounded-lg border border-blue-300">
            <span className="text-lg font-bold text-blue-900">
              ${formData.totalPrice}
            </span>
          </div>
        </div>

        <Select
          label="Payment Method *"
          value={formData.paymentMethod}
          onChange={(e) => handleChange("paymentMethod", e.target.value)}
          options={[
            { value: "", label: "Select payment method" },
            { value: "cash", label: "Cash" },
            { value: "card", label: "Card" },
            { value: "bank_transfer", label: "Bank Transfer" },
          ]}
          error={errors.paymentMethod}
        />
      </div>

      {selectedProduct && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Selected Product Details</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <p><span className="font-medium">Name:</span> {selectedProduct.name}</p>
            {selectedProduct.sku && (
              <p><span className="font-medium">SKU:</span> {selectedProduct.sku}</p>
            )}
            <p><span className="font-medium">Type:</span> <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{selectedProduct.type}</span></p>
            <p><span className="font-medium">Stock:</span> {selectedProduct.currentStock} {selectedProduct.unit}</p>
            <p><span className="font-medium">Sale Price:</span> ${selectedProduct.salePrice || "0.00"}</p>
          </div>
        </div>
      )}

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="Additional notes about the sale"
        rows={3}
      />

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : sale ? "Update Sale" : "Create Sale"}
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
