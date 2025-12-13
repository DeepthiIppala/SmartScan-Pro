'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminRootPage() {
  const router = useRouter();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAdmin) {
        router.replace('/admin/verify-exit-pass');
      } else {
        router.replace('/home');
      }
    }
  }, [isAdmin, loading, router]);

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-700">Redirecting...</div>
      </div>
    </ProtectedRoute>
  );
}
