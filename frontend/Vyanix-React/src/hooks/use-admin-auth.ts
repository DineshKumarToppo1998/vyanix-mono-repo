"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function useAdminAuth() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isAdmin) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router, authLoading]);

  return { isAdmin, isLoading: authLoading };
}
