import { Suspense } from "react";
import RentalsContent from "@/components/rentals/rentals-content";
import { MemoizedCardHeader, MemoizedCardTitle } from "@/components/ui/card";
import Card from "@/components/ui/card";

export default function RentalsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <MemoizedCardHeader>
          <MemoizedCardTitle>Rentals Management</MemoizedCardTitle>
        </MemoizedCardHeader>
        <Suspense
          fallback={
            <div className="p-6 pt-0">
              <div className="text-center py-8">Loading rentals...</div>
            </div>
          }
        >
          <RentalsContent />
        </Suspense>
      </Card>
    </div>
  );
}
