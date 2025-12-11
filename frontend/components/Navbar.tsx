'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Don't show navbar on auth pages
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password')) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-[#4169E1] shadow-lg sticky top-0 z-50">
      <div className="max-w-[1300] mx-auto px-8 sm:px-10 lg:px-16">
        <div className="flex justify-between h-25">
          <div className="flex items-center gap-10">
            {/* Logo - Clickable Home Link */}
            <Link
              href="/home"
              className="flex items-center gap-5 flex-shrink-0 hover:opacity-90 transition-opacity group"
            >
              <div className="hidden lg:block text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-[#4169E1] to-[#3557C1] bg-clip-text text-transparent">
                  <Image
                    src="/logo4.png"
                    alt="SmartScan Pro Logo"
                    width={100}
                    height={100}
                    className="rounded-xl shadow-lg group-hover:shadow-xl transition-shadow border-2 border-[#4169E1] ml-15"
                    priority
                  />
                </div>
                <div className="text-sm text-bold-black-700 font-semibold">
                  Smart Shopping, Instant Checkout
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:gap-4 md:ml-10">
              <Link
                href="/products"
                className={`px-5 py-3 rounded-xl text-md font- transition-all ${
                  pathname === "/products"
                    ? "bg-[#4169E1] text-white shadow-lg transform scale-105"
                    : "bg-white text-black-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 hover:border-[#4169E1] shadow-md hover:shadow-lg"
                }`}
              >
                Browse products
              </Link>
              <Link
                href="/cart"
                className={`px-5 py-3 rounded-xl text-md font-transition-all ${
                  pathname === "/cart"
                    ? "bg-[#4169E1] text-white shadow-lg transform scale-105"
                    : "bg-white text-black-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 hover:border-[#4169E1] shadow-md hover:shadow-lg"
                }`}
              >
                Cart
              </Link>
              <Link
                href="/history"
                className={`px-5 py-3 rounded-xl text-md font-transition-all ${
                  pathname === "/history"
                    ? "bg-[#4169E1] text-white shadow-lg transform scale-105"
                    : "bg-white text-black-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 hover:border-[#4169E1] shadow-md hover:shadow-lg"
                }`}
              >
                History
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/home"
                  className={`px-8 py-3 rounded-xl text-lg font-transition-all ${
                    pathname === "/admin/products"
                      ? "bg-[#4169E1] text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 hover:border-[#4169E1] shadow-md hover:shadow-lg"
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right Side - Desktop */}
          <div
            className="hidden md:flex items-center gap-5 relative"
            ref={profileDropdownRef}
          >
            {/* Profile Dropdown Button */}
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border-2 border-gray-200 hover:border-[#4169E1] shadow-sm hover:shadow-md transition-all"
            >
              {/* User Avatar Circle */}
              <div className="w-10 h-10 rounded-full bg-[#4169E1] flex items-center justify-center text-white font-bold shadow-md">
                {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
              </div>
              {/* Profile Info */}
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'My Profile'}
                </div>
                <div className="text-xs text-gray-600 truncate max-w-[150px]">
                  {user?.email}
                </div>
              </div>
              {/* Chevron Icon */}
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  profileDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden z-50">
                {/* User Info Header */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#4169E1] flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">
                        {user?.first_name && user?.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user?.email}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isAdmin ? "Admin" : "Customer"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-[#4169E1]"
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
                    <span className="text-sm font-semibold text-gray-700">
                      View Profile
                    </span>
                  </Link>

                  <Link
                    href="/history"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-[#4169E1]"
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
                    <span className="text-sm font-semibold text-gray-700">
                      Order History
                    </span>
                  </Link>

                  <Link
                    href="/cart"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-[#4169E1]"
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
                    <span className="text-sm font-semibold text-gray-700">
                      Shopping Cart
                    </span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t-2 border-gray-200 p-3">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-red-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
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
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4169E1] transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-[#4169E1] bg-gradient-to-b from-blue-50 to-cyan-50">
          <div className="px-4 pt-3 pb-3 space-y-2">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                pathname === "/products"
                  ? "bg-[#4169E1] text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 shadow-md"
              }`}
            >
              Browse Products
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                pathname === "/cart"
                  ? "bg-[#4169E1] text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 shadow-md"
              }`}
            >
              Cart
            </Link>
            <Link
              href="/history"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                pathname === "/history"
                  ? "bg-[#4169E1] text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 shadow-md"
              }`}
            >
              History
            </Link>
            {isAdmin && (
              <Link
                href="/admin/home"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  pathname === "/admin/products"
                    ? "bg-[#4169E1] text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-[#4169E1] hover:text-white border-2 border-gray-200 shadow-md"
                }`}
              >
                Admin
              </Link>
            )}
          </div>
          <div className="pt-4 pb-4 border-t-2 border-[#4169E1]">
            <div className="flex items-center px-4 mb-3">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-[#4169E1] flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
                  {user?.first_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1 bg-white px-3 py-2 rounded-xl border-2 border-gray-200 shadow-sm">
                <div className="text-sm font-bold text-gray-900">
                  {user?.first_name && user?.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : 'User'}
                </div>
                <div className="text-xs text-gray-600 truncate font-semibold">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="px-4">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
