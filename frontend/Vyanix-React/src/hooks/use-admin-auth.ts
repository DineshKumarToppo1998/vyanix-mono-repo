"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export function useAdminAuth() {
  const { user, isAuthenticated, initializing } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!initializing && isAuthenticated && !isAdmin) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, router, initializing]);

  return { isAdmin, isLoading: initializing };
}
