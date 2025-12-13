'use client';

import { useCallback, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BarcodeScanner from '@/components/BarcodeScanner';
import { api } from '@/lib/api';
import { ExitPassVerification } from '@/lib/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyExitPassPage() {
  const { isAdmin, loading } = useAuth();
  const [verification, setVerification] = useState<ExitPassVerification | null>(null);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems = useMemo(() => {
    if (!verification?.items) return 0;
    return verification.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [verification]);

  const handleScan = useCallback(async (qrValue: string) => {
    if (!qrValue) return;
    setLastScan(qrValue);
    setVerifying(true);
    setError(null);

    try {
      const result = await api.transactions.verifyExitPass(qrValue);
      setVerification(result);
      toast.success('Exit pass verified');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setVerification(null);
      setError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  }, []);

  const resetState = () => {
    setVerification(null);
    setLastScan(null);
    setError(null);
  };

  const NotAuthorized = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-xl w-full border border-gray-200 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.455 19h13.09A2.455 2.455 0 0021 16.545V7.455A2.455 2.455 0 0018.545 5H5.455A2.455 2.455 0 003 7.455v9.09A2.455 2.455 0 005.455 19z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
        <p className="text-gray-600 mb-4">Only authorized security/admin accounts can verify exit passes.</p>
      </div>
    </div>
  );

  const VerificationCard = () => {
    if (!verification) return null;

    const customerName =
      verification.customer?.first_name || verification.customer?.last_name
        ? `${verification.customer?.first_name || ''} ${verification.customer?.last_name || ''}`.trim()
        : verification.customer?.email;

    return (
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Order</p>
            <h2 className="text-2xl font-bold text-gray-900">#{verification.id}</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-3xl font-bold text-green-600">${verification.total_amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-800 font-semibold mb-1">Items</p>
            <p className="text-xl font-bold text-blue-900">{totalItems}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
            <p className="text-xs text-purple-800 font-semibold mb-1">Customer</p>
            <p className="text-sm font-bold text-purple-900">{customerName || 'Unknown'}</p>
            <p className="text-xs text-purple-700 truncate">{verification.customer?.email}</p>
          </div>
          <div className={`rounded-xl p-3 border ${verification.requires_audit ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-xs font-semibold mb-1 ${verification.requires_audit ? 'text-red-800' : 'text-green-800'}`}>
              Security Status
            </p>
            <p className={`text-sm font-bold ${verification.requires_audit ? 'text-red-700' : 'text-green-700'}`}>
              {verification.requires_audit ? 'Manual audit required' : 'Clear to exit'}
            </p>
            {verification.requires_audit && verification.audit_reason && (
              <p className="text-xs text-red-600 mt-1">{verification.audit_reason}</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Items</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {verification.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-600">Barcode: {item.product.barcode}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">Qty: {item.quantity}</p>
                  <p className="text-sm font-bold text-[#4169E1]">
                    ${(item.quantity * item.price_at_purchase).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      {!isAdmin && !loading ? (
        NotAuthorized
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-[#4169E1] text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 11v8m4-4H8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Security</p>
                  <h1 className="text-3xl font-bold text-gray-900">Exit Pass Verification</h1>
                  <p className="text-sm text-gray-600">Scan customer exit QR to validate purchase details</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Scanner</h2>
                  {lastScan && (
                    <button
                      onClick={resetState}
                      className="text-sm text-[#4169E1] hover:text-[#3557C1] font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <BarcodeScanner
                  onScan={handleScan}
                  manualLabel="Paste QR payload or transaction code"
                  manualPlaceholder="Scan QR or paste the decoded value here"
                  manualButtonText="Verify"
                />

                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Last scan</p>
                  <p className="text-sm font-mono text-gray-900 break-words max-h-24 overflow-hidden">
                    {lastScan || 'Waiting for scan...'}
                  </p>
                </div>

                {verifying && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-4 h-4 border-2 border-[#4169E1] border-t-transparent rounded-full animate-spin" />
                    Verifying exit pass...
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
                    {error}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {verification ? (
                  <VerificationCard />
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#4169E1] flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Awaiting scan</h3>
                        <p className="text-sm text-gray-600">Scan an exit QR code to view purchase details.</p>
                      </div>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                      <li>Use the device camera or paste the decoded QR payload manually.</li>
                      <li>Only signed exit passes generated after payment are accepted.</li>
                      <li>Audit-required orders will be flagged for manual review.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
