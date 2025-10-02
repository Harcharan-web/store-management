"use client";

import { memo, type FC } from "react";
import Button from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ProductListProps {
  products: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

const ProductList: FC<ProductListProps> = ({
  products,
  pagination,
  loading,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!products.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No products found. Add your first product to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                SKU
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Category
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Type
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Stock
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Sale Price
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Status
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                <td className="py-3 px-4 text-gray-700">
                  {product.sku || "-"}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {product.category || "-"}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {product.currentStock} {product.unit}
                </td>
                <td className="py-3 px-4 font-semibold text-gray-900">
                  {product.salePrice ? formatCurrency(product.salePrice) : "-"}
                </td>
                <td className="py-3 px-4">
                  {product.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default memo(ProductList);
