"use client";

import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ConsumerRouteProps {
  children: React.ReactNode;
}

export function ConsumerRoute({ children }: ConsumerRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (role === 'admin') {
      router.replace('/admin-panel');
    } else if (role === 'partner') {
      router.replace('/partner-crm');
    }
  }, [user, authLoading, roleLoading, role, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user || role === 'admin' || role === 'partner') return null;

  return <>{children}</>;
}
