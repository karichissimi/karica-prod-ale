"use client";

import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('consumer' | 'partner' | 'admin')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading, isPartner, isAdmin } = useUserRole();
  const router = useRouter();
  const pathname = usePathname();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || pathname === '/onboarding') {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setOnboardingComplete(data.onboarding_completed || false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [user, pathname]);

  useEffect(() => {
    if (loading || checking || roleLoading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && role) {
      if (!allowedRoles.includes(role)) {
        if (isAdmin) router.replace('/admin-panel');
        else if (isPartner) router.replace('/partner-crm');
        else router.replace('/');
      }
    }

    if (pathname === '/onboarding') return;

    if (role === 'consumer' && onboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [user, loading, checking, roleLoading, role, allowedRoles, isAdmin, isPartner, pathname, onboardingComplete, router]);

  if (loading || checking || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && allowedRoles.length > 0 && role && !allowedRoles.includes(role)) return null;
  if (role === 'consumer' && onboardingComplete === false && pathname !== '/onboarding') return null;

  return <>{children}</>;
}
