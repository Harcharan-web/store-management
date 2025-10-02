"use client";

import { useCallback, useState } from "react";
import type {
  ApiResponse,
  PaginatedResponse,
  Rental,
  RentalWithDetails,
} from "@/types";

export interface RentalFormData {
  customerId: string;
  productId: string;
  quantity: number;
  startDate: string;
  expectedReturnDate: string;
  rateType: "daily" | "weekly" | "monthly";
  rateAmount: string;
  securityDeposit?: string;
  notes?: string;
}

export function useRentals() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = useCallback(
    async (page = 1, limit = 10, search = "", status = "") => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
          ...(status && { status }),
        });

        const response = await fetch(`/api/rentals?${params}`);
        const data: ApiResponse<PaginatedResponse<RentalWithDetails>> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch rentals");
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

  const fetchRental = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rentals/${id}`);
      const data: ApiResponse<RentalWithDetails> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch rental");
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

  const createRental = useCallback(async (formData: RentalFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse<Rental> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create rental");
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

  const updateRental = useCallback(
    async (id: string, formData: RentalFormData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/rentals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data: ApiResponse<Rental> = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to update rental");
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

  const returnRental = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rentals/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: ApiResponse<Rental> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to return rental");
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

  const deleteRental = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rentals/${id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to delete rental");
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
    fetchRentals,
    fetchRental,
    createRental,
    updateRental,
    returnRental,
    deleteRental,
  };
}
