import { Suspense } from "react";
import Navigation from "@/components/layout/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <Navigation />
      </Suspense>
      <main>{children}</main>
    </div>
  );
}
