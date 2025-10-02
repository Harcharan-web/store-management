import { Suspense } from "react";
import SalesContent from "@/components/sales/sales-content";
import { MemoizedCardHeader, MemoizedCardTitle } from "@/components/ui/card";
import Card from "@/components/ui/card";

export default function SalesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <MemoizedCardHeader>
          <MemoizedCardTitle>Sales Management</MemoizedCardTitle>
        </MemoizedCardHeader>
        <Suspense
          fallback={
            <div className="p-6 pt-0">
              <div className="text-center py-8">Loading sales...</div>
            </div>
          }
        >
          <SalesContent />
        </Suspense>
      </Card>
    </div>
  );
}
