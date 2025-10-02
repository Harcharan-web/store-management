"use client";

import { useCallback, useState } from "react";
import type {
  ApiResponse,
  PaginatedResponse,
  SaleWithDetails,
  SaleFormData,
} from "@/types";

export function useSales() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = useCallback(
    async (page = 1, limit = 10, search = "") => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });

        const response = await fetch(`/api/sales?${params}`);
        const data: ApiResponse<PaginatedResponse<SaleWithDetails>> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch sales");
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

  const fetchSale = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sales/${id}`);
      const data: ApiResponse<SaleWithDetails> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch sale");
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

  const createSale = useCallback(async (formData: SaleFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<SaleWithDetails> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create sale");
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

  const updateSale = useCallback(
    async (id: string, formData: SaleFormData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/sales/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data: ApiResponse<SaleWithDetails> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to update sale");
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

  const deleteSale = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete sale");
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
    fetchSales,
    fetchSale,
    createSale,
    updateSale,
    deleteSale,
  };
}
