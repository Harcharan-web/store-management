"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useCustomers } from "@/hooks/use-customers";
import CustomerList from "./customer-list";
import CustomerForm from "./customer-form";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { MemoizedCardContent } from "@/components/ui/card";
import type { Customer, CustomerFormData, PaginatedResponse } from "@/types";

export default function CustomersContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<PaginatedResponse<Customer> | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const { loading, error, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers();

  const loadCustomers = useCallback(
    async (page: number, search: string) => {
      try {
        const data = await fetchCustomers(page, 10, search);
        setCustomers(data);
      } catch (err) {
        console.error("Failed to load customers:", err);
      }
    },
    [fetchCustomers]
  );

  useEffect(() => {
    loadCustomers(currentPage, searchQuery);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        setSearchQuery(value);
        setCurrentPage(1);
        loadCustomers(1, value);
      });
    },
    [loadCustomers]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        setCurrentPage(page);
        loadCustomers(page, searchQuery);
      });
    },
    [loadCustomers, searchQuery]
  );

  const handleCreate = useCallback(async () => {
    setEditingCustomer(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this customer?")) return;

      try {
        await deleteCustomer(id);
        loadCustomers(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to delete customer:", err);
      }
    },
    [deleteCustomer, loadCustomers, currentPage, searchQuery]
  );

  const handleSubmit = useCallback(
    async (data: CustomerFormData) => {
      try {
        if (editingCustomer) {
          await updateCustomer(editingCustomer.id, data);
        } else {
          await createCustomer(data);
        }
        setShowForm(false);
        setEditingCustomer(null);
        loadCustomers(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to save customer:", err);
        throw err;
      }
    },
    [editingCustomer, updateCustomer, createCustomer, loadCustomers, currentPage, searchQuery]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingCustomer(null);
  }, []);

  return (
    <MemoizedCardContent>
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>Add Customer</Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <CustomerList
            customers={customers?.data || []}
            pagination={customers?.pagination}
            loading={loading || isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MemoizedCardContent>
  );
}
