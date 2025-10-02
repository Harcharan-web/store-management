"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useSales } from "@/hooks/use-sales";
import SaleList from "./sale-list";
import SaleForm from "./sale-form";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { MemoizedCardContent } from "@/components/ui/card";
import type { SaleWithDetails, SaleFormData, PaginatedResponse } from "@/types";

export default function SalesContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<SaleWithDetails | null>(null);
  const [sales, setSales] = useState<PaginatedResponse<SaleWithDetails> | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const { loading, error, fetchSales, createSale, updateSale, deleteSale } =
    useSales();

  const loadSales = useCallback(
    async (page: number, search: string) => {
      try {
        const data = await fetchSales(page, 10, search);
        setSales(data);
      } catch (err) {
        console.error("Failed to load sales:", err);
      }
    },
    [fetchSales]
  );

  // Initial load
  useEffect(() => {
    loadSales(currentPage, searchQuery);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        setSearchQuery(value);
        setCurrentPage(1);
        loadSales(1, value);
      });
    },
    [loadSales]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        setCurrentPage(page);
        loadSales(page, searchQuery);
      });
    },
    [loadSales, searchQuery]
  );

  const handleCreate = useCallback(async () => {
    setEditingSale(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((sale: SaleWithDetails) => {
    setEditingSale(sale);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this sale?")) return;

      try {
        await deleteSale(id);
        loadSales(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to delete sale:", err);
      }
    },
    [deleteSale, loadSales, currentPage, searchQuery]
  );

  const handleSubmit = useCallback(
    async (data: SaleFormData) => {
      try {
        if (editingSale) {
          await updateSale(editingSale.id, data);
        } else {
          await createSale(data);
        }
        setShowForm(false);
        setEditingSale(null);
        loadSales(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to save sale:", err);
        throw err;
      }
    },
    [editingSale, updateSale, createSale, loadSales, currentPage, searchQuery]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingSale(null);
  }, []);

  return (
    <MemoizedCardContent>
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>Add Sale</Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <SaleList
            sales={sales?.data || []}
            pagination={sales?.pagination}
            loading={loading || isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <SaleForm
          sale={editingSale}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MemoizedCardContent>
  );
}
