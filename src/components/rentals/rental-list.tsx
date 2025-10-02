"use client";

import { memo, type FC } from "react";
import Button from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import type { RentalWithDetails } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RentalListProps {
  rentals: RentalWithDetails[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  onEdit: (rental: RentalWithDetails) => void;
  onReturn: (id: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

const RentalList: FC<RentalListProps> = ({
  rentals,
  pagination,
  loading,
  onEdit,
  onReturn,
  onDelete,
  onPageChange,
}) => {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!rentals.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rentals found. Create your first rental to get started.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "returned":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Rental #
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Customer
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Product
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                From Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                To Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Amount
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
            {rentals.map((rental) => (
              <tr key={rental.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">
                  {rental.rentalNumber}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900">{rental.customer.name}</p>
                    <p className="text-sm text-gray-600">{rental.customer.phone}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {rental.items && rental.items.length > 0 ? (
                    <div>
                      <p className="font-medium text-gray-900">
                        {rental.items[0].product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {rental.items[0].quantity}
                      </p>
                      {rental.items.length > 1 && (
                        <p className="text-xs text-gray-500">
                          +{rental.items.length - 1} more
                        </p>
                      )}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {formatDate(rental.startDate)}
                </td>
                <td className="py-3 px-4 text-gray-700">
                  {formatDate(rental.expectedReturnDate)}
                </td>
                <td className="py-3 px-4 font-semibold text-gray-900">
                  {formatCurrency(parseFloat(rental.totalCharges))}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                    {rental.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    {rental.status === "active" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onReturn(rental.id)}
                      >
                        Return
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(rental)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(rental.id)}
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

export default memo(RentalList);
