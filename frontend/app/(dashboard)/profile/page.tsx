'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  itemsPurchased: number;
  favoriteCategory?: string;
}

export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    itemsPurchased: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const transactions = await api.transactions.getHistory();

      const stats: UserStats = {
        totalOrders: transactions.length,
        totalSpent: transactions.reduce((sum, t) => sum + t.total_amount, 0),
        itemsPurchased: transactions.reduce((sum, t) =>
          sum + (t.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0
        )
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#4169E1] p-3 rounded-xl shadow-md">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-[#4169E1] to-[#3557C1] text-white text-5xl font-bold shadow-xl border-4 border-white ring-4 ring-blue-100 mb-4">
                    {user?.first_name?.charAt(0).toUpperCase()}
                  </div>

                  {/* User Info */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : "My Profile"}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4 break-all px-4">
                    {user?.email}
                  </p>

                  {/* Account Type Badge */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md mb-6"
                    style={{
                      backgroundColor: isAdmin ? "#f3e8ff" : "#dbeafe",
                      border: `2px solid ${isAdmin ? "#a855f7" : "#4169E1"}`,
                    }}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: isAdmin ? "#9333ea" : "#4169E1" }}
                    >
                      {isAdmin ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      )}
                    </svg>
                    <span
                      className="font-bold text-sm"
                      style={{ color: isAdmin ? "#9333ea" : "#4169E1" }}
                    >
                      {isAdmin ? "Administrator" : "Customer"}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/history")}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-[#4169E1] text-[#4169E1] rounded-xl font-semibold hover:bg-[#4169E1] hover:text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      View Order History
                    </button>

                    <button
                      onClick={() => router.push("/cart")}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-[#4169E1] text-[#4169E1] rounded-xl font-semibold hover:bg-[#4169E1] hover:text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      Go to Cart
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => router.push("/admin/home")}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-500 text-purple-700 rounded-xl font-semibold hover:bg-purple-500 hover:text-white transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Admin Dashboard
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Statistics & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statistics Cards */}
              <div className="grid sm:grid-cols-3 gap-4">
                {/* Total Orders */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-[#4169E1] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <svg
                        className="w-6 h-6 text-[#4169E1]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-[#4169E1]">
                      {loading ? "..." : userStats.totalOrders}
                    </p>
                  </div>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-green-500 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-green-600">
                      {loading ? "..." : `$${userStats.totalSpent.toFixed(2)}`}
                    </p>
                  </div>
                </div>

                {/* Items Purchased */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-purple-500 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Items Bought</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {loading ? "..." : userStats.itemsPurchased}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <svg
                      className="w-7 h-7 text-[#4169E1]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Account Information
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Email Address
                    </label>
                    <p className="text-base font-medium text-gray-900 break-all">
                      {user?.email}
                    </p>
                  </div>

                  {/* Account Type */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Account Type
                    </label>
                    <p className="text-base font-medium text-gray-900">
                      {isAdmin ? "Administrator Account" : "Customer Account"}
                    </p>
                  </div>

                  {/* Member Since */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Member Since
                    </label>
                    <p className="text-base font-medium text-gray-900">
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <svg
                    className="w-7 h-7 text-[#4169E1]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Quick Links
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push("/products")}
                    className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-gray-200 hover:border-[#4169E1] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
                        <svg
                          className="w-6 h-6 text-[#4169E1]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          Browse Products
                        </p>
                        <p className="text-xs text-gray-600">
                          Explore our catalog
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => router.push("/home")}
                    className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-gray-200 hover:border-[#4169E1] transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
                        <svg
                          className="w-6 h-6 text-[#4169E1]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">Home</p>
                        <p className="text-xs text-gray-600">
                          Back to dashboard
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
