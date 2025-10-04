"use client";

import { memo, type FC } from "react";
import Button from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import type { SaleWithDetails } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

interface SaleListProps {
  sales: SaleWithDetails[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  onEdit: (sale: SaleWithDetails) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

const SaleList: FC<SaleListProps> = ({
  sales,
  pagination,
  loading,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!sales.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No sales found. Create your first sale to get started.
      </div>
    );
  }

  const getPaymentStatusColor = (status: string) => {
    const statusConfig = PAYMENT_STATUSES.find(s => s.value === status);
    return statusConfig?.color || "gray";
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return "-";
    const methodConfig = PAYMENT_METHODS.find(m => m.value === method);
    return methodConfig?.label || method;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Invoice #
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Items
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Total
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Payment Status
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Payment Method
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-700">
                  {new Date(sale.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">
                  {sale.invoiceNumber}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {sale.customer?.name || "-"}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  <div className="space-y-1">
                    {sale.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="text-xs">
                        {item.product?.name} ({item.quantity} {item.product?.unit})
                      </div>
                    ))}
                    {sale.items.length > 2 && (
                      <div className="text-xs text-blue-600 font-medium">
                        +{sale.items.length - 2} more
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-gray-900">
                  {formatCurrency(sale.total)}
                </td>
                <td className="py-3 px-4">
                  {sale.paymentStatus === "paid" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  )}
                  {sale.paymentStatus === "partial" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Partial
                    </span>
                  )}
                  {sale.paymentStatus === "pending" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {getPaymentMethodLabel(sale.paymentMethod)}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(sale)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(sale.id)}
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

export default memo(SaleList);
