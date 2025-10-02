"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRentals } from "@/hooks/use-rentals";
import type { RentalFormData } from "@/hooks/use-rentals";
import RentalList from "./rental-list";
import RentalForm from "./rental-form";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { MemoizedCardContent } from "@/components/ui/card";
import type { RentalWithDetails, PaginatedResponse } from "@/types";

export default function RentalsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalWithDetails | null>(null);
  const [rentals, setRentals] = useState<PaginatedResponse<RentalWithDetails> | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const { loading, error, fetchRentals, createRental, updateRental, returnRental, deleteRental } =
    useRentals();

  const loadRentals = useCallback(
    async (page: number, search: string, status: string) => {
      try {
        const data = await fetchRentals(page, 10, search, status);
        setRentals(data);
      } catch (err) {
        console.error("Failed to load rentals:", err);
      }
    },
    [fetchRentals]
  );

  // Initial load
  useEffect(() => {
    loadRentals(currentPage, searchQuery, statusFilter);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        setSearchQuery(value);
        setCurrentPage(1);
        loadRentals(1, value, statusFilter);
      });
    },
    [loadRentals, statusFilter]
  );

  const handleStatusFilter = useCallback(
    (value: string) => {
      startTransition(() => {
        setStatusFilter(value);
        setCurrentPage(1);
        loadRentals(1, searchQuery, value);
      });
    },
    [loadRentals, searchQuery]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        setCurrentPage(page);
        loadRentals(page, searchQuery, statusFilter);
      });
    },
    [loadRentals, searchQuery, statusFilter]
  );

  const handleCreate = useCallback(async () => {
    setEditingRental(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((rental: RentalWithDetails) => {
    setEditingRental(rental);
    setShowForm(true);
  }, []);

  const handleReturn = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to mark this rental as returned?")) return;

      try {
        await returnRental(id);
        loadRentals(currentPage, searchQuery, statusFilter);
      } catch (err) {
        console.error("Failed to return rental:", err);
      }
    },
    [returnRental, loadRentals, currentPage, searchQuery, statusFilter]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this rental?")) return;

      try {
        await deleteRental(id);
        loadRentals(currentPage, searchQuery, statusFilter);
      } catch (err) {
        console.error("Failed to delete rental:", err);
      }
    },
    [deleteRental, loadRentals, currentPage, searchQuery, statusFilter]
  );

  const handleSubmit = useCallback(
    async (data: RentalFormData) => {
      try {
        if (editingRental) {
          await updateRental(editingRental.id, data);
        } else {
          await createRental(data);
        }
        setShowForm(false);
        setEditingRental(null);
        loadRentals(currentPage, searchQuery, statusFilter);
      } catch (err) {
        console.error("Failed to save rental:", err);
        throw err;
      }
    },
    [editingRental, updateRental, createRental, loadRentals, currentPage, searchQuery, statusFilter]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingRental(null);
  }, []);

  return (
    <MemoizedCardContent>
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6 gap-4">
            <div className="flex gap-4 flex-1 max-w-2xl">
              <Input
                type="search"
                placeholder="Search rentals..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                options={[
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "returned", label: "Returned" },
                  { value: "overdue", label: "Overdue" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />
            </div>
            <Button onClick={handleCreate}>Add Rental</Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <RentalList
            rentals={rentals?.data || []}
            pagination={rentals?.pagination}
            loading={loading || isPending}
            onEdit={handleEdit}
            onReturn={handleReturn}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <RentalForm
          rental={editingRental}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MemoizedCardContent>
  );
}
