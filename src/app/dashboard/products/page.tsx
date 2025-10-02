import { Suspense } from "react";
import ProductsContent from "@/components/products/products-content";
import { MemoizedCardHeader, MemoizedCardTitle } from "@/components/ui/card";
import Card from "@/components/ui/card";

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <MemoizedCardHeader>
          <MemoizedCardTitle>Products Management</MemoizedCardTitle>
        </MemoizedCardHeader>
        <Suspense
          fallback={
            <div className="p-6 pt-0">
              <div className="text-center py-8">Loading products...</div>
            </div>
          }
        >
          <ProductsContent />
        </Suspense>
      </Card>
    </div>
  );
}
