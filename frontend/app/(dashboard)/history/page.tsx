'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Transaction } from '@/lib/types';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.transactions.getHistory();
      console.log('Transaction history data:', data);
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#4169E1] p-3 rounded-xl shadow-md">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-sm text-gray-600 mt-0.5">View your past purchases and receipts</p>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700">Total Orders</span>
                  </div>
                  <span className="text-2xl font-bold text-[#4169E1]">{transactions.length}</span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4169E1] mx-auto mb-4"></div>
              <p className="text-gray-600">Loading history...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Transaction History</h2>
              <p className="text-gray-600 mb-6">Start shopping to see your purchase history here</p>
              <button
                onClick={() => window.location.href = '/products'}
                className="bg-[#4169E1] hover:bg-[#3557C1] text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transition-all cursor-pointer border border-gray-200 transform hover:scale-[1.01]"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <svg className="w-5 h-5 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{transaction.id}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                          ✓ Paid
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span>{transaction.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} item(s)</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-bold text-[#4169E1] mb-2">
                        ${transaction.total_amount.toFixed(2)}
                      </p>
                      <button className="inline-flex items-center gap-1 text-[#4169E1] hover:text-[#3557C1] text-sm font-semibold transition-colors">
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedTransaction(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order #{selectedTransaction.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-900 text-3xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-gray-600 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900">{formatDate(selectedTransaction.created_at)}</p>
              </div>

              {/* Items List */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#4169E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Items Purchased
                </h3>
                <div className="space-y-3">
                  {selectedTransaction.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{item.product?.name || 'Product'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.price_at_purchase.toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-[#4169E1] text-lg">
                        ${(item.price_at_purchase * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="text-lg font-bold text-gray-900">Total Paid:</span>
                  <span className="text-3xl font-bold text-[#4169E1]">
                    ${selectedTransaction.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* QR Code - Exit Pass */}
              <div className="text-center border-t-2 border-gray-200 pt-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <h3 className="text-lg font-bold text-green-800">
                      Exit Pass
                    </h3>
                  </div>
                  <p className="text-sm text-green-700">
                    Show this QR code at the exit to leave the store
                  </p>
                </div>
                {selectedTransaction.qr_code ? (
                  <div className="inline-block p-6 bg-white border-2 border-gray-300 rounded-xl shadow-lg">
                    <Image
                      src={selectedTransaction.qr_code}
                      alt="Exit Pass QR Code"
                      width={200}
                      height={200}
                      className="mx-auto"
                      unoptimized
                    />
                    <p className="text-xs text-gray-600 mt-3 font-medium">
                      Order #{selectedTransaction.id}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-700 font-semibold">QR code not available for this transaction</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
