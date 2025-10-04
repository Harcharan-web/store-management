"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card, { MemoizedCardContent } from "@/components/ui/card";
import StockOverview from "@/components/dashboard/stock-overview";

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
      textColor: "text-blue-600",
      iconBg: "bg-blue-100",
      link: "/dashboard/products",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers ?? "-",
      icon: "👥",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-600",
      iconBg: "bg-green-100",
      link: "/dashboard/customers",
    },
    {
      title: "Active Rentals",
      value: stats?.activeRentals ?? "-",
      icon: "🔄",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-600",
      iconBg: "bg-purple-100",
      link: "/dashboard/rentals",
    },
    {
      title: "Recent Sales (30d)",
      value: stats?.recentSales ?? "-",
      icon: "💰",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-600",
      iconBg: "bg-amber-100",
      link: "/dashboard/sales",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockProducts ?? "-",
      icon: "⚠️",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-600",
      iconBg: "bg-red-100",
      link: "/dashboard/products",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 -m-8 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome to your store management system
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8">
              {statCards.map((card) => (
                <Link key={card.title} href={card.link}>
                  <Card
                    className={`${card.color} border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer h-full`}
                  >
                    <MemoizedCardContent className="p-5 sm:p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`${card.iconBg} p-3 rounded-xl`}>
                          <span className="text-2xl sm:text-3xl">{card.icon}</span>
                        </div>
                        <div className={`text-3xl sm:text-4xl font-bold ${card.textColor}`}>
                          {card.value}
                        </div>
                      </div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        {card.title}
                      </h3>
                    </MemoizedCardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Product Stock Overview with Pagination and Search */}
            <StockOverview />

            {/* Quick Actions & System Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Quick Actions */}
              <Card className="border border-gray-200 shadow-lg">
                <MemoizedCardContent className="p-5 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <Link
                      href="/dashboard/products"
                      className="block p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 border border-blue-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-200 p-3 rounded-xl">
                          <span className="text-2xl">📦</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base sm:text-lg">
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
                      className="block p-4 sm:p-5 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-200 border border-green-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-200 p-3 rounded-xl">
                          <span className="text-2xl">👥</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base sm:text-lg">
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
                      className="block p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all duration-200 border border-amber-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-200 p-3 rounded-xl">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base sm:text-lg">
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
                      className="block p-4 sm:p-5 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-200 border border-purple-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-200 p-3 rounded-xl">
                          <span className="text-2xl">🔄</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-base sm:text-lg">
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

              {/* System Overview */}
              <Card className="border border-gray-200 shadow-lg">
                <MemoizedCardContent className="p-5 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
                    System Overview
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <span className="text-sm font-medium text-gray-700">
                          Total Products
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {stats?.totalProducts || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👥</span>
                        <span className="text-sm font-medium text-gray-700">
                          Total Customers
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {stats?.totalCustomers || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔄</span>
                        <span className="text-sm font-medium text-gray-700">
                          Active Rentals
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {stats?.activeRentals || 0}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm font-medium text-gray-700">
                          Sales (Last 30 Days)
                        </span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">
                        {stats?.recentSales || 0}
                      </span>
                    </div>

                    {stats && stats.lowStockProducts > 0 && (
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border-2 border-red-300">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⚠️</span>
                          <span className="text-sm font-medium text-red-700">
                            Low Stock Alert
                          </span>
                        </div>
                        <span className="text-xl font-bold text-red-900">
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
    </div>
  );
}
