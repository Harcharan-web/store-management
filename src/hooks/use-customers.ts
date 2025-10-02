"use client";

import { useCallback, useState } from "react";
import type {
  ApiResponse,
  PaginatedResponse,
  Customer,
  CustomerFormData,
} from "@/types";

export function useCustomers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(
    async (page = 1, limit = 10, search = "") => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });

        const response = await fetch(`/api/customers?${params}`);
        const data: ApiResponse<PaginatedResponse<Customer>> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch customers");
        }

        return data.data!;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchCustomer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${id}`);
      const data: ApiResponse<Customer> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch customer");
      }

      return data.data!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (formData: CustomerFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<Customer> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create customer");
      }

      return data.data!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCustomer = useCallback(
    async (id: string, formData: CustomerFormData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data: ApiResponse<Customer> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to update customer");
        }

        return data.data!;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCustomer = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete customer");
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
