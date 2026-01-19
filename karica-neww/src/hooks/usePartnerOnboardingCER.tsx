"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CEROnboardingData {
  cerName: string;
  cerFiscalCode: string;
  cerAddress: string;
  memberCount: number | null;
  role: string;
  statuteDocumentUrl: string;
  appointmentDocumentUrl: string;
  termsAccepted: boolean;
}

export function usePartnerOnboardingCER() {
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

  const [formData, setFormData] = useState<CEROnboardingData>({
    cerName: '',
    cerFiscalCode: '',
    cerAddress: '',
    memberCount: null,
    role: 'president',
    statuteDocumentUrl: '',
    appointmentDocumentUrl: '',
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
        .select('id, onboarding_completed, company_name, vat_number, contact_phone, description')
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

        // Fetch existing CER manager data
        const { data: cerManager } = await supabase
          .from('cer_managers')
          .select('*')
          .eq('partner_id', partner.id)
          .maybeSingle();

        if (cerManager) {
          setFormData(prev => ({
            ...prev,
            cerName: cerManager.cer_name || '',
            cerFiscalCode: cerManager.cer_fiscal_code || '',
            cerAddress: cerManager.cer_address || '',
            memberCount: cerManager.member_count || null,
            role: cerManager.role || 'president',
            statuteDocumentUrl: cerManager.statute_document_url || '',
            appointmentDocumentUrl: cerManager.appointment_document_url || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (data: Partial<CEROnboardingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const saveProgress = async () => {
    if (!partnerId) return;

    setSaving(true);
    try {
      // Upsert CER manager record
      const { error } = await supabase
        .from('cer_managers')
        .upsert({
          partner_id: partnerId,
          cer_name: formData.cerName || null,
          cer_fiscal_code: formData.cerFiscalCode || null,
          cer_address: formData.cerAddress || null,
          member_count: formData.memberCount,
          role: formData.role,
          statute_document_url: formData.statuteDocumentUrl || null,
          appointment_document_url: formData.appointmentDocumentUrl || null,
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
    if (!formData.cerName) {
      toast({
        title: 'Errore',
        description: 'Il nome della CER è obbligatorio',
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
      // Save final CER manager data
      await supabase
        .from('cer_managers')
        .upsert({
          partner_id: partnerId,
          cer_name: formData.cerName,
          cer_fiscal_code: formData.cerFiscalCode || null,
          cer_address: formData.cerAddress || null,
          member_count: formData.memberCount,
          role: formData.role,
          statute_document_url: formData.statuteDocumentUrl || null,
          appointment_document_url: formData.appointmentDocumentUrl || null,
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
        description: 'Benvenuto nel portale Presidente CER',
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
    setCurrentStep(prev => Math.min(prev + 1, 3));
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
