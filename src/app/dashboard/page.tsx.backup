"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card, { MemoizedCardContent } from "@/components/ui/card";

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  activeRentals: number;
  recentSales: number;
  lowStockProducts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/dashboard/stats");
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? "-",
      icon: "📦",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-900",
      link: "/dashboard/products",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? "-",
      icon: "👥",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-900",
      link: "/dashboard/customers",
    },
    {
      title: "Active Rentals",
      value: stats?.activeRentals ?? "-",
      icon: "🔄",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-900",
      link: "/dashboard/rentals",
    },
    {
      title: "Recent Sales (30d)",
      value: stats?.recentSales ?? "-",
      icon: "💰",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-900",
      link: "/dashboard/sales",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockProducts ?? "-",
      icon: "⚠️",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-900",
      link: "/dashboard/products",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Welcome to your store management system
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {statCards.map((card) => (
              <Link key={card.title} href={card.link}>
                <Card
                  className={`${card.color} border-2 hover:shadow-lg transition-all duration-200 cursor-pointer h-full`}
                >
                  <MemoizedCardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{card.icon}</span>
                      <div
                        className={`text-4xl font-bold ${card.textColor}`}
                      >
                        {card.value}
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {card.title}
                    </h3>
                  </MemoizedCardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200">
              <MemoizedCardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/dashboard/products"
                    className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Manage Products
                        </p>
                        <p className="text-sm text-gray-600">
                          Add, edit, or view products
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/customers"
                    className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Manage Customers
                        </p>
                        <p className="text-sm text-gray-600">
                          View and manage customer profiles
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/sales"
                    className="block p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Record Sale
                        </p>
                        <p className="text-sm text-gray-600">
                          Create a new sale transaction
                        </p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/rentals"
                    className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Create Rental
                        </p>
                        <p className="text-sm text-gray-600">
                          Start a new rental transaction
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </MemoizedCardContent>
            </Card>

            <Card className="border border-gray-200">
              <MemoizedCardContent className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  System Overview
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Total Products
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.totalProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Total Customers
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.totalCustomers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Active Rentals
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.activeRentals || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">
                      Sales (Last 30 Days)
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {stats?.recentSales || 0}
                    </span>
                  </div>
                  {stats && stats.lowStockProducts > 0 && (
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm font-medium text-red-700">
                        Low Stock Alert
                      </span>
                      <span className="text-lg font-bold text-red-900">
                        {stats.lowStockProducts} items
                      </span>
                    </div>
                  )}
                </div>
              </MemoizedCardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
