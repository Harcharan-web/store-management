"use client";

import { memo, type FC } from "react";
import Button from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import type { Customer } from "@/types";

interface CustomerListProps {
  customers: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

const CustomerList: FC<CustomerListProps> = ({
  customers,
  pagination,
  loading,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading...</div>;
  }

  if (!customers.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No customers found. Add your first customer to get started.
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
                Short Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Phone
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Address
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">
                Location
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{customer.name}</td>
                <td className="py-3 px-4 text-gray-700">
                  {customer.shortName || "-"}
                </td>
                <td className="py-3 px-4 text-gray-700">{customer.phone}</td>
                <td className="py-3 px-4 text-gray-700">
                  {customer.address || "-"}
                </td>
                <td className="py-3 px-4">
                  {customer.latitude && customer.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      📍 View Map
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(customer)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(customer.id)}
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

export default memo(CustomerList);
