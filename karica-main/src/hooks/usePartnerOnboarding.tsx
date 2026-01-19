import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface PartnerOnboardingData {
  companyName: string;
  vatNumber: string;
  phone: string;
  description: string;
  businessDocumentUrl: string | null;
  termsAccepted: boolean;
}

export function usePartnerOnboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  
  const [formData, setFormData] = useState<PartnerOnboardingData>({
    companyName: '',
    vatNumber: '',
    phone: '',
    description: '',
    businessDocumentUrl: null,
    termsAccepted: false,
  });

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (partner) {
        setPartnerId(partner.id);
        setOnboardingCompleted(partner.onboarding_completed || false);
        
        // Pre-fill form with existing data
        setFormData({
          companyName: partner.company_name || '',
          vatNumber: partner.vat_number || '',
          phone: partner.contact_phone || '',
          description: partner.description || '',
          businessDocumentUrl: partner.business_document_url || null,
          termsAccepted: !!partner.terms_accepted_at,
        });

        // If onboarding is already completed, redirect to CRM
        if (partner.onboarding_completed) {
          navigate('/partner-crm', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile verificare lo stato dell\'onboarding',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (data: Partial<PartnerOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const saveProgress = async () => {
    if (!partnerId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          company_name: formData.companyName,
          vat_number: formData.vatNumber,
          contact_phone: formData.phone,
          description: formData.description,
          business_document_url: formData.businessDocumentUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId);

      if (error) throw error;
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
    console.log('completeOnboarding called', { partnerId, formData });
    
    if (!partnerId) {
      console.error('No partnerId available');
      toast({
        title: 'Errore',
        description: 'ID Partner non trovato. Riprova il login.',
        variant: 'destructive',
      });
      return false;
    }

    // Validate required fields
    if (!formData.companyName.trim()) {
      toast({
        title: 'Errore',
        description: 'Il nome dell\'azienda è obbligatorio',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.vatNumber.trim()) {
      toast({
        title: 'Errore',
        description: 'La Partita IVA è obbligatoria',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.termsAccepted) {
      toast({
        title: 'Errore',
        description: 'Devi accettare i termini e le condizioni',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      console.log('Updating partner with data:', {
        company_name: formData.companyName,
        vat_number: formData.vatNumber,
        contact_phone: formData.phone,
        description: formData.description,
        business_document_url: formData.businessDocumentUrl,
        partnerId,
      });

      const { data, error } = await supabase
        .from('partners')
        .update({
          company_name: formData.companyName,
          vat_number: formData.vatNumber,
          contact_phone: formData.phone,
          description: formData.description,
          business_document_url: formData.businessDocumentUrl,
          terms_accepted_at: new Date().toISOString(),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error('No rows updated - partner may not exist or RLS policy blocking');
        toast({
          title: 'Errore',
          description: 'Nessun partner trovato da aggiornare. Riprova il login.',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Onboarding completato!',
        description: 'Benvenuto nel CRM Partner di Karica',
      });

      navigate('/partner-crm', { replace: true });
      return true;
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Errore',
        description: error?.message || 'Impossibile completare l\'onboarding',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    saveProgress();
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return {
    currentStep,
    setCurrentStep,
    loading,
    saving,
    formData,
    updateFormData,
    onboardingCompleted,
    partnerId,
    nextStep,
    prevStep,
    saveProgress,
    completeOnboarding,
  };
}
