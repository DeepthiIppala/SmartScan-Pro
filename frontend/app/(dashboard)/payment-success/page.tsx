'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Transaction } from '@/lib/types';
import { api } from '@/lib/api';

function PaymentSuccessContent() {
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
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-gray-200">
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
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Payment Successful!
              </h1>
              <p className="text-gray-600 text-lg">
                Thank you for your purchase. Your order has been processed successfully.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading order details...</p>
              </div>
            ) : transaction ? (
              <>
                {/* Order Summary */}
                <div className="border-t border-b border-gray-300 py-6 mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-semibold text-gray-900">#{transaction.id}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="font-semibold text-gray-900">
                      {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                    <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-3xl font-bold text-green-500">
                      ${transaction.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

              {/* SECURITY AUDIT ALERT */}
              {transaction.requires_audit && (
                <div className="mb-6 bg-gradient-to-br from-red-900 to-orange-900 border-2 border-red-500 rounded-lg p-6 text-center animate-pulse">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      🔒 SECURITY VERIFICATION REQUIRED
                    </h2>
                    <p className="text-red-200 text-sm font-semibold">
                      {transaction.audit_reason}
                    </p>
                  </div>

                  <div className="bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg mb-4">
                    <p className="text-gray-900 font-bold text-lg">
                      ⚠️ STOP AT EXIT
                    </p>
                    <p className="text-gray-800 text-sm mt-1">
                      Please proceed to security verification station
                    </p>
                  </div>

                  <div className="text-white text-sm space-y-1">
                    <p className="font-semibold">A security officer will verify your items</p>
                    <p className="text-red-300">This is a standard random check for store safety</p>
                  </div>
                </div>
              )}

              {/* EXIT PASS QR CODE */}
              {transaction.qr_code && (
                <div className={`mb-6 ${transaction.requires_audit ? 'bg-gradient-to-br from-orange-900 to-red-900 border-2 border-orange-500' : 'bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500'} rounded-lg p-6 text-center`}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      🎫 EXIT PASS
                    </h2>
                    <p className={`${transaction.requires_audit ? 'text-orange-200' : 'text-green-200'} text-sm`}>
                      {transaction.requires_audit
                        ? 'Show this QR code to security officer at verification station'
                        : 'Show this QR code to security when leaving the store'}
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
                    <p className={`${transaction.requires_audit ? 'text-orange-300' : 'text-green-300'}`}>
                      Order #{transaction.id} - {transaction.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                <div className="space-y-3">
                  {transaction.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border-2 border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          ${item.price_at_purchase.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-green-500">
                        ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Order details not available</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={() => router.push('/history')}
              className="flex-1 px-6 py-3 bg-[#4169E1] text-white font-semibold rounded-lg hover:bg-[#3557C1] focus:outline-none focus:ring-2 focus:ring-[#4169E1] transition-colors shadow-md hover:shadow-lg"
            >
              View Order History
            </button>
            <button
              onClick={() => router.push('/products')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors shadow-md hover:shadow-lg"
            >
              Continue Shopping
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              A confirmation email has been sent to your registered email address.
            </p>
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-white"><div className="text-gray-900">Loading...</div></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
