"use client";

import { useState, useCallback, type FC, type FormEvent } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import type { Customer, CustomerFormData } from "@/types";

interface CustomerFormProps {
  customer: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
}

const CustomerForm: FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback(
    (field: keyof CustomerFormData, value: string) => {
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

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
          label="Customer Name *"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={errors.name}
          placeholder="Enter customer name"
        />

        <Input
          label="Phone Number *"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          error={errors.phone}
          placeholder="+1 (555) 123-4567"
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={errors.email}
          placeholder="customer@example.com"
        />

        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Customer address"
        />
      </div>

      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="Additional notes about the customer"
        rows={3}
      />

      <div className="flex justify-end gap-4 pt-6 border-t">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
