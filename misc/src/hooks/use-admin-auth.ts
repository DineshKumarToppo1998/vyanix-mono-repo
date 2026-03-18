
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mocking auth check. In real app, check session/JWT and role
    const checkAuth = async () => {
      // Simulate API call
      setTimeout(() => {
        const user = { role: 'ADMIN', name: 'Admin User' }; // Replace with real session check
        if (user && user.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          router.push('/login'); // Redirect unauthorized
        }
        setIsLoading(false);
      }, 500);
    };

    checkAuth();
  }, [router]);

  return { isAdmin, isLoading };
}
