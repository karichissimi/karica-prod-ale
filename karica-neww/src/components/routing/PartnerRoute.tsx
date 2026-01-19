"use client";

import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';

interface PartnerRouteProps {
  children: React.ReactNode;
  skipOnboardingCheck?: boolean;
}

type PartnerType = 'cer_president' | 'intervention' | 'marketplace';

export function PartnerRoute({ children, skipOnboardingCheck = false }: PartnerRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isPartner, isAdmin } = useUserRole();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || skipOnboardingCheck || isAdmin) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const { data: partner } = await supabase
          .from('partners')
          .select('onboarding_completed, partner_type')
          .eq('user_id', user.id)
          .maybeSingle();

        setOnboardingStatus(partner?.onboarding_completed ?? false);
        setPartnerType(partner?.partner_type as PartnerType ?? null);
      } catch (error) {
        console.error('Error checking partner onboarding:', error);
        setOnboardingStatus(false);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (!authLoading && !roleLoading && user && isPartner) {
      checkOnboardingStatus();
    } else if (!authLoading && !roleLoading) {
      setCheckingOnboarding(false);
    }
  }, [user, authLoading, roleLoading, isPartner, isAdmin, skipOnboardingCheck]);

  useEffect(() => {
    if (authLoading || roleLoading || checkingOnboarding) return;

    if (!user) {
      router.replace('/partner-auth');
      return;
    }

    if (!isPartner && !isAdmin) {
      router.replace('/');
      return;
    }

    if (isPartner && !skipOnboardingCheck && onboardingStatus === false) {
      const onboardingRoute = getOnboardingRoute(partnerType);
      router.replace(onboardingRoute);
    }
  }, [user, authLoading, roleLoading, checkingOnboarding, isPartner, isAdmin, onboardingStatus, partnerType, skipOnboardingCheck, router]);

  if (authLoading || roleLoading || checkingOnboarding) {
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
  if (!isPartner && !isAdmin) return null;
  if (isPartner && !skipOnboardingCheck && onboardingStatus === false) return null;

  return <>{children}</>;
}

function getOnboardingRoute(partnerType: PartnerType | null): string {
  switch (partnerType) {
    case 'cer_president':
      return '/partner-onboarding/cer';
    case 'marketplace':
      return '/partner-onboarding/marketplace';
    case 'intervention':
    default:
      return '/partner-onboarding';
  }
}
