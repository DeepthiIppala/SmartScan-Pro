'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Transaction } from '@/lib/types';
import { api } from '@/lib/api';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction_id');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (transactionId) {
      loadTransaction();
    } else {
      setLoading(false);
    }
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      const transactions = await api.transactions.getHistory();
      const found = transactions.find((t) => t.id === parseInt(transactionId!));
      if (found) {
        setTransaction(found);
      }
    } catch (error) {
      console.error('Failed to load transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
          <div className="text-center mb-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-20 w-20 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Payment Successful!
            </h1>
            <p className="text-gray-400 text-lg">
              Thank you for your purchase. Your order has been processed successfully.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading order details...</p>
            </div>
          ) : transaction ? (
            <>
              {/* Order Summary */}
              <div className="border-t border-b border-gray-700 py-6 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="font-semibold text-white">#{transaction.id}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Total Items:</span>
                  <span className="font-semibold text-white">
                    {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">Order Date:</span>
                  <span className="font-semibold text-white">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                  <span className="text-lg font-semibold text-white">Total Amount:</span>
                  <span className="text-3xl font-bold text-green-400">
                    ${transaction.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* EXIT PASS QR CODE */}
              {transaction.qr_code && (
                <div className="mb-6 bg-gradient-to-br from-green-900 to-emerald-900 border-2 border-green-500 rounded-lg p-6 text-center">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      🎫 EXIT PASS
                    </h2>
                    <p className="text-green-200 text-sm">
                      Show this QR code to security when leaving the store
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg inline-block mb-4">
                    <img
                      src={transaction.qr_code}
                      alt="Exit Pass QR Code"
                      className="w-64 h-64 mx-auto"
                    />
                  </div>

                  <div className="text-white text-sm space-y-1">
                    <p className="font-semibold">✓ Payment Verified</p>
                    <p className="text-green-300">Order #{transaction.id} - {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Order Items</h2>
                <div className="space-y-3">
                  {transaction.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-white">{item.product.name}</p>
                        <p className="text-sm text-gray-400">
                          ${item.price_at_purchase.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-green-400">
                        ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Order details not available</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => router.push('/history')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              View Order History
            </button>
            <button
              onClick={() => router.push('/products')}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
