"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useProducts } from "@/hooks/use-products";
import ProductList from "./product-list";
import ProductForm from "./product-form";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { MemoizedCardContent } from "@/components/ui/card";
import type { Product, ProductFormData, PaginatedResponse } from "@/types";

export default function ProductsContent() {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const { loading, error, fetchProducts, createProduct, updateProduct, deleteProduct } =
    useProducts();

  const loadProducts = useCallback(
    async (page: number, search: string) => {
      try {
        const data = await fetchProducts(page, 10, search);
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products:", err);
      }
    },
    [fetchProducts]
  );

  // Initial load
  useEffect(() => {
    loadProducts(currentPage, searchQuery);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        setSearchQuery(value);
        setCurrentPage(1);
        loadProducts(1, value);
      });
    },
    [loadProducts]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      startTransition(() => {
        setCurrentPage(page);
        loadProducts(page, searchQuery);
      });
    },
    [loadProducts, searchQuery]
  );

  const handleCreate = useCallback(async () => {
    setEditingProduct(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      try {
        await deleteProduct(id);
        loadProducts(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to delete product:", err);
      }
    },
    [deleteProduct, loadProducts, currentPage, searchQuery]
  );

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        if (editingProduct) {
          await updateProduct(editingProduct.id, data);
        } else {
          await createProduct(data);
        }
        setShowForm(false);
        setEditingProduct(null);
        loadProducts(currentPage, searchQuery);
      } catch (err) {
        console.error("Failed to save product:", err);
        throw err;
      }
    },
    [editingProduct, updateProduct, createProduct, loadProducts, currentPage, searchQuery]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingProduct(null);
  }, []);

  return (
    <MemoizedCardContent>
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate}>Add Product</Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <ProductList
            products={products?.data || []}
            pagination={products?.pagination}
            loading={loading || isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <ProductForm
          product={editingProduct}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </MemoizedCardContent>
  );
}
