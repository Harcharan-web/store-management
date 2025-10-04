"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Card, { MemoizedCardContent } from "@/components/ui/card";
import Input from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface StockProduct {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  unit: string;
  salePrice: string;
}

export default function StockOverview() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const observerTarget = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum: number, searchTerm: string, append = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "20",
          ...(searchTerm && { search: searchTerm }),
        });

        const response = await fetch(`/api/dashboard/stock?${params}`);
        const data = await response.json();

        if (data.success) {
          const newProducts = data.data.data;
          setProducts((prev) =>
            append ? [...prev, ...newProducts] : newProducts
          );
          setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Initial load
  useEffect(() => {
    fetchProducts(1, searchQuery, false);
  }, [searchQuery]);

  // Handle search input with debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 500); // 500ms debounce
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, searchQuery, true);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, searchQuery, fetchProducts]);

  if (products.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="mb-8">
      <Card className="border border-gray-200 shadow-lg">
        <MemoizedCardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                Product Stock Overview
              </h2>
              <p className="text-sm text-gray-600">
                Real-time inventory monitoring with search
              </p>
            </div>
            <Link href="/dashboard/products">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto">
                View All Products
              </button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <Input
              type="search"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    SKU
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Current Stock
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Min Level
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock =
                    product.currentStock <= product.minStockLevel;
                  const stockPercentage =
                    (product.currentStock / (product.minStockLevel * 2)) * 100;

                  return (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">
                          {product.name}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {product.sku || "-"}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`font-bold ${
                            isLowStock ? "text-red-600" : "text-gray-900"
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-600">
                        {product.minStockLevel} {product.unit}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isLowStock
                                  ? "bg-red-500"
                                  : stockPercentage < 50
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(stockPercentage, 100)}%`,
                              }}
                            />
                          </div>
                          {isLowStock && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(
                          parseFloat(product.salePrice || "0") *
                            product.currentStock
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {products.map((product) => {
              const isLowStock = product.currentStock <= product.minStockLevel;
              const stockPercentage =
                (product.currentStock / (product.minStockLevel * 2)) * 100;

              return (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        SKU: {product.sku || "N/A"}
                      </p>
                    </div>
                    {isLowStock && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Stock:</span>
                      <span
                        className={`font-bold ${
                          isLowStock ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Min Level:</span>
                      <span className="text-gray-900">
                        {product.minStockLevel} {product.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isLowStock
                            ? "bg-red-500"
                            : stockPercentage < 50
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Stock Value:</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(
                          parseFloat(product.salePrice || "0") *
                            product.currentStock
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-600">Loading more products...</p>
            </div>
          )}

          {/* Intersection Observer Target */}
          <div ref={observerTarget} className="h-4" />

          {/* No More Data */}
          {!hasMore && products.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                All products loaded ({products.length} total)
              </p>
            </div>
          )}

          {/* No Results */}
          {products.length === 0 && !loading && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No products found for "{searchQuery}"
              </p>
            </div>
          )}
        </MemoizedCardContent>
      </Card>
    </div>
  );
}
