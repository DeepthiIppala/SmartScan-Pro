'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProtectedRoute from '@/components/ProtectedRoute';
import CartItemComponent from '@/components/CartItemComponent';
import AIRecommendations from '@/components/AIRecommendations';
import { Cart } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await api.cart.get();
      setCart(data);
    } catch (error) {
      toast.error('Failed to load cart');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      const response = await api.cart.updateItem(itemId, quantity);
      setCart(response.cart);
      toast.success('Quantity updated');
    } catch (error) {
      toast.error('Failed to update quantity');
      console.error(error);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await api.cart.removeItem(itemId);
      setCart(response.cart);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
      console.error(error);
    }
  };

  const handleCheckout = () => {
    if (cart && cart.items.length > 0) {
      router.push('/checkout');
    }
  };

  const cartTotal = cart?.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  ) || 0;

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
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-sm text-gray-600 mt-1">
              {cart?.items.length || 0} {cart?.items.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4169E1] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart...</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="bg-white shadow-lg rounded-2xl p-8 sm:p-12 text-center border border-gray-200">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Add items to get started!</p>
              <button
                onClick={() => router.push('/products')}
                className="px-6 py-3 bg-[#4169E1] text-white rounded-xl font-semibold hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-[#4169E1] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Cart Items Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Recommendations */}
                <AIRecommendations />

                {/* Cart Items */}
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>

              {/* Cart Summary - Sticky on desktop */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 lg:sticky lg:top-20">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-medium">Subtotal</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                      <span className="font-medium">Total Items</span>
                      <span className="font-semibold">{cart.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-[#4169E1]">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full px-6 py-4 bg-[#4169E1] text-white rounded-xl font-semibold hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-[#4169E1] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={() => router.push('/products')}
                      className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
