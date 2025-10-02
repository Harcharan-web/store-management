import { Suspense } from "react";
import Card, { MemoizedCardHeader, MemoizedCardTitle } from "@/components/ui/card";
import CustomersContent from "@/components/customers/customers-content";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
      </div>

      <Card className="border border-gray-200">
        <MemoizedCardHeader>
          <MemoizedCardTitle>Customer Management</MemoizedCardTitle>
        </MemoizedCardHeader>
        <Suspense fallback={<div className="p-6">Loading...</div>}>
          <CustomersContent />
        </Suspense>
      </Card>
    </div>
  );
}
