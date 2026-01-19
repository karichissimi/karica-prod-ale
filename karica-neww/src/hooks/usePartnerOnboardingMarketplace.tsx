"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketplaceOnboardingData {
  storeName: string;
  storeDescription: string;
  storeLogoUrl: string;
  shippingPolicy: string;
  returnPolicy: string;
  fiscalDocumentsUrl: string;
  productCategories: string[];
  termsAccepted: boolean;
}

export function usePartnerOnboardingMarketplace() {
  const { user } = useAuth();
  const router = useRouter();
  const navigate = (path: string, options?: any) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const [formData, setFormData] = useState<MarketplaceOnboardingData>({
    storeName: '',
    storeDescription: '',
    storeLogoUrl: '',
    shippingPolicy: '',
    returnPolicy: '',
    fiscalDocumentsUrl: '',
    productCategories: [],
    termsAccepted: false,
  });

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('id, onboarding_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching partner:', error);
        setLoading(false);
        return;
      }

      if (partner) {
        setPartnerId(partner.id);

        if (partner.onboarding_completed) {
          setOnboardingCompleted(true);
          navigate('/partner-crm', { replace: true });
          return;
        }

        // Fetch existing marketplace data
        const { data: marketplaceData } = await supabase
          .from('marketplace_partners')
          .select('*')
          .eq('partner_id', partner.id)
          .maybeSingle();

        if (marketplaceData) {
          setFormData(prev => ({
            ...prev,
            storeName: marketplaceData.store_name || '',
            storeDescription: marketplaceData.store_description || '',
            storeLogoUrl: marketplaceData.store_logo_url || '',
            shippingPolicy: marketplaceData.shipping_policy || '',
            returnPolicy: marketplaceData.return_policy || '',
            fiscalDocumentsUrl: marketplaceData.fiscal_documents_url || '',
            productCategories: marketplaceData.product_categories || [],
          }));
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (data: Partial<MarketplaceOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const saveProgress = async () => {
    if (!partnerId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('marketplace_partners')
        .upsert({
          partner_id: partnerId,
          store_name: formData.storeName || 'Store in configurazione',
          store_description: formData.storeDescription || null,
          store_logo_url: formData.storeLogoUrl || null,
          shipping_policy: formData.shippingPolicy || null,
          return_policy: formData.returnPolicy || null,
          fiscal_documents_url: formData.fiscalDocumentsUrl || null,
          product_categories: formData.productCategories,
        }, {
          onConflict: 'partner_id'
        });

      if (error) throw error;

      toast({
        title: 'Progresso salvato',
        description: 'I tuoi dati sono stati salvati',
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare i progressi',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const completeOnboarding = async () => {
    if (!partnerId) return;

    // Validate required fields
    if (!formData.storeName) {
      toast({
        title: 'Errore',
        description: 'Il nome dello store è obbligatorio',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.termsAccepted) {
      toast({
        title: 'Errore',
        description: 'Devi accettare i termini e le condizioni',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Save final marketplace data
      await supabase
        .from('marketplace_partners')
        .upsert({
          partner_id: partnerId,
          store_name: formData.storeName,
          store_description: formData.storeDescription || null,
          store_logo_url: formData.storeLogoUrl || null,
          shipping_policy: formData.shippingPolicy || null,
          return_policy: formData.returnPolicy || null,
          fiscal_documents_url: formData.fiscalDocumentsUrl || null,
          product_categories: formData.productCategories,
        }, {
          onConflict: 'partner_id'
        });

      // Mark partner onboarding as complete
      const { error } = await supabase
        .from('partners')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          terms_accepted_at: new Date().toISOString(),
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast({
        title: 'Onboarding completato!',
        description: 'Benvenuto nel portale Partner Marketplace',
      });

      navigate('/partner-crm', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile completare l\'onboarding',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    saveProgress();
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return {
    currentStep,
    loading,
    saving,
    formData,
    partnerId,
    onboardingCompleted,
    updateFormData,
    saveProgress,
    completeOnboarding,
    nextStep,
    prevStep,
  };
}
