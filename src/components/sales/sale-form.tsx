"use client";

import { useState, useCallback, useEffect, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Textarea from "@/components/ui/textarea";
import type { SaleWithDetails, SaleFormData, Customer, Product } from "@/types";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface SaleFormProps {
  sale: SaleWithDetails | null;
  onSubmit: (data: SaleFormData) => Promise<void>;
  onCancel: () => void;
}

interface SaleItem {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: string;
  total: number;
}

const SaleForm: FC<SaleFormProps> = ({ sale, onSubmit, onCancel }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [customerId, setCustomerId] = useState(sale?.customerId || "");
  const [items, setItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod || "");
  const [notes, setNotes] = useState(sale?.notes || "");

  const [productSearch, setProductSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleAddProduct = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if product already added
    if (items.some(item => item.productId === productId)) {
      alert("This product is already added. Update the quantity instead.");
      return;
    }

    const newItem: SaleItem = {
      productId: product.id,
      productName: product.name,
      unit: product.unit || "piece",
      quantity: 1,
      unitPrice: product.salePrice || "0",
      total: Number(product.salePrice || 0),
    };

    setItems([...items, newItem]);
    setProductSearch("");
  }, [products, items]);

  const handleUpdateQuantity = useCallback((index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * Number(newItems[index].unitPrice);
    setItems(newItems);
  }, [items]);

  const handleUpdatePrice = useCallback((index: number, price: string) => {
    const newItems = [...items];
    newItems[index].unitPrice = price;
    newItems[index].total = newItems[index].quantity * Number(price);
    setItems(newItems);
  }, [items]);

  const handleRemoveItem = useCallback((index: number) => {
    setItems(items.filter((_, i) => i !== index));
  }, [items]);

  const calculateTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const filteredProducts = products.filter(p =>
    productSearch === "" ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerId) {
      newErrors.customerId = "Customer is required";
    }

    if (items.length === 0) {
      newErrors.items = "At least one product is required";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Payment method is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [customerId, items, paymentMethod]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validate()) {
        return;
      }

      setSubmitting(true);
      try {
        const apiData: SaleFormData = {
          customerId,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: "0",
          })),
          discount: "0",
          tax: "0",
          paymentStatus: paymentMethod === "borrow" ? "pending" : "paid",
          paymentMethod: paymentMethod as any,
          amountPaid: paymentMethod === "borrow" ? "0" : calculateTotal().toFixed(2),
          notes,
        };

        await onSubmit(apiData);
      } catch (err) {
        console.error("Form submission error:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [customerId, items, paymentMethod, notes, validate, onSubmit, calculateTotal]
  );

  if (loadingData) {
    return <div className="text-center py-8 text-gray-600">Loading...</div>;
  }

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

        <Select
          label="Payment Method *"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: "", label: "Select payment method" },
            ...PAYMENT_METHODS.map((method) => ({
              value: method.value,
              label: method.label,
            })),
          ]}
          error={errors.paymentMethod}
        />
      </div>

      {/* Product Selection */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>

        <Select
          label="Add Product"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleAddProduct(e.target.value);
            }
          }}
          options={[
            { value: "", label: "Select a product to add" },
            ...products.map((product) => ({
              value: product.id,
              label: `${product.name} - ${formatCurrency(product.salePrice || 0)}/${product.unit}`,
            })),
          ]}
        />

        {errors.items && (
          <p className="mt-2 text-sm font-medium text-red-600">{errors.items}</p>
        )}

        {/* Items List */}
        {items.length > 0 && (
          <div className="mt-4 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">Unit: {item.unit}</p>
                  </div>

                  <div>
                    <Input
                      label={`Quantity (${item.unit})`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(index, Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <Input
                      label="Unit Price"
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdatePrice(index, e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="h-11 flex items-center justify-between px-4 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="font-bold text-blue-900">
                        {formatCurrency(item.total)}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grand Total */}
      {items.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
            <span className="text-3xl font-bold text-green-900">
              {formatCurrency(calculateTotal())}
            </span>
          </div>
          {paymentMethod === "borrow" && (
            <p className="mt-2 text-sm text-orange-700">
              💳 This sale will be marked as credit (pending payment)
            </p>
          )}
        </div>
      )}

      <Textarea
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
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
