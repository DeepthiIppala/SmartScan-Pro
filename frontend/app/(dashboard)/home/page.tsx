'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BarcodeScanner from '@/components/BarcodeScanner';
import AIProductRecognition from '@/components/AIProductRecognition';
import AIVisualSearch from '@/components/AIVisualSearch';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { user } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);
  const processingBarcodeRef = useRef<string | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    loadCartCount();
  }, []);

  const loadCartCount = async () => {
    try {
      const cart = await api.cart.get();
      const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemCount(totalItems);
    } catch (error) {
      console.error('Failed to load cart count', error);
    }
  };

const handleScan = async (barcode: string) => {
  // CRITICAL: Check if ANY scan is currently being processed
  if (isProcessingRef.current) {
    console.log("A scan is already being processed, ignoring this call");
    return;
  }

  // Check if this specific barcode is already being processed
  if (processingBarcodeRef.current === barcode) {
    console.log("Already processing this barcode, ignoring duplicate");
    return;
  }

  // IMMEDIATELY set processing flags to prevent any other calls
  isProcessingRef.current = true;
  processingBarcodeRef.current = barcode;

  try {
    const product = await api.products.getByBarcode(barcode);
    await api.cart.addItem(barcode, 1);
    toast.success(`Added ${product.name} to cart!`);
    loadCartCount(); // Update cart count
  } catch {
    // Use warning toast instead of error for better UX
    toast("Product not found in database", {
      icon: "⚠️",
      duration: 3000,
    });
    // Log as info, not error, since this is expected behavior
    console.info("Product not found:", barcode);
  } finally {
    // Reset after 2 seconds to allow rescanning the same item
    setTimeout(() => {
      processingBarcodeRef.current = null;
      isProcessingRef.current = false;
    }, 2000);
  }
};

  const handleAIProductRecognized = (productData: { product_name: string; confidence: number }) => {
    toast.success(`AI identified: ${productData.product_name} (${productData.confidence * 100}% confident)`);
    console.log('AI Recognized Product:', productData);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Background Image Overlay */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/shopping-bg.png"
            alt="Shopping Background"
            fill
            className="object-cover opacity-100"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-cyan-50/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
        {/* Main Shopping Tools */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Welcome Card */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">
                  Welcome back, {user?.first_name || user?.email?.split("@")[0]}!
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Start scanning to add items to your cart
                </p>
              </div>
              <div className="bg-blue-50 border-2 border-[#4169E1] rounded-xl p-6 text-center">
                <p className="text-4xl sm:text-5xl font-bold text-[#4169E1]">
                  {cartItemCount}
                </p>
                <p className="text-sm text-gray-600 mt-1">Items Scanned</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:gap-8">
            {/* Scan Items Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100">
              <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="bg-[#4169E1] p-3 rounded-xl shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Scan Items
                  </h3>
                  <p className="text-sm text-gray-600">
                    Scan barcodes or enter manually
                  </p>
                </div>
              </div>
              <div className="p-6">
                <BarcodeScanner onScan={handleScan} />
              </div>
            </div>

            {/* Photo Recognition Card */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100">
              <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <div className="bg-[#4169E1] p-3 rounded-xl shadow-md">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Photo Search
                  </h3>
                  <p className="text-sm text-gray-600">
                    Identify products by taking photos
                  </p>
                </div>
              </div>
              <div className="p-6">
                <AIProductRecognition
                  onProductRecognized={handleAIProductRecognized}
                />
              </div>
            </div>

            {/* Visual Search Card */}

            <div className="p-2">
              <AIVisualSearch />
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-0 bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-lg">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900">
                How to Use Scan & Go
              </h4>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4169E1] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                  1
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">
                    Scan Items
                  </h5>
                  <p className="text-sm text-gray-600">
                    Use barcode scanner or take photos as you shop
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4169E1] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                  2
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">
                    Review Cart
                  </h5>
                  <p className="text-sm text-gray-600">
                    Check your items and proceed to checkout
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#4169E1] text-white rounded-full flex items-center justify-center text-lg font-bold shadow-md">
                  3
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1">
                    Exit & Go
                  </h5>
                  <p className="text-sm text-gray-600">
                    Show receipt at exit - no lines!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
