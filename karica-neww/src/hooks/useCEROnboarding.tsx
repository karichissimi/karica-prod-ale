import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface CERConsentsData {
  dataSharing: boolean;
  termsConditions: boolean;
  cerRules: boolean;
  strongIdCompleted: boolean;
  strongIdMethod?: string;
}

export const useCEROnboarding = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cerEligible, setCerEligible] = useState(false);
  const [cerOnboardingCompleted, setCerOnboardingCompleted] = useState(false);
  const [consents, setConsents] = useState<CERConsentsData>({
    dataSharing: false,
    termsConditions: false,
    cerRules: false,
    strongIdCompleted: false,
  });

  useEffect(() => {
    if (user) {
      checkCERStatus();
    }
  }, [user]);

  const checkCERStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('cer_onboarding_completed, cer_eligible, cer_onboarding_started_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setCerOnboardingCompleted(data?.cer_onboarding_completed || false);
      setCerEligible(data?.cer_eligible || false);

      // If onboarding was started, check which step we're on
      if (data?.cer_onboarding_started_at && !data?.cer_onboarding_completed) {
        const { data: consentsData } = await supabase
          .from('cer_consents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (consentsData) {
          setConsents({
            dataSharing: consentsData.data_sharing_consent,
            termsConditions: consentsData.terms_conditions_consent,
            cerRules: consentsData.cer_rules_consent,
            strongIdCompleted: consentsData.strong_id_completed,
            strongIdMethod: consentsData.strong_id_method || undefined,
          });

          // Determine current step based on progress
          if (consentsData.strong_id_completed) {
            setCurrentStep(3); // Timeline step
          } else if (consentsData.terms_conditions_consent) {
            setCurrentStep(2); // Strong ID step
          } else {
            setCurrentStep(1); // Consents step
          }
        }
      }
    } catch (error) {
      console.error('Error checking CER status:', error);
    }
  };

  const startOnboarding = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ 
          cer_onboarding_started_at: new Date().toISOString(),
          cer_eligible: true 
        })
        .eq('id', user.id);

      if (error) throw error;

      setCerEligible(true);
      setCurrentStep(1);
      toast.success('Onboarding CER avviato!');
    } catch (error: any) {
      console.error('Error starting CER onboarding:', error);
      toast.error('Errore durante l\'avvio dell\'onboarding');
    } finally {
      setLoading(false);
    }
  };

  const updateConsents = async (newConsents: Partial<CERConsentsData>) => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedConsents = { ...consents, ...newConsents };
      setConsents(updatedConsents);

      const { error } = await supabase
        .from('cer_consents')
        .upsert({
          user_id: user.id,
          data_sharing_consent: updatedConsents.dataSharing,
          terms_conditions_consent: updatedConsents.termsConditions,
          cer_rules_consent: updatedConsents.cerRules,
          strong_id_completed: updatedConsents.strongIdCompleted,
          strong_id_method: updatedConsents.strongIdMethod,
          strong_id_timestamp: updatedConsents.strongIdCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Consensi aggiornati');
    } catch (error: any) {
      console.error('Error updating CER consents:', error);
      toast.error('Errore durante l\'aggiornamento dei consensi');
    } finally {
      setLoading(false);
    }
  };

  const completeStrongID = async (method: string) => {
    await updateConsents({ 
      strongIdCompleted: true, 
      strongIdMethod: method 
    });
  };

  const completeCEROnboarding = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Validate all consents
      if (!consents.dataSharing || !consents.termsConditions || !consents.cerRules || !consents.strongIdCompleted) {
        toast.error('Completa tutti i passaggi obbligatori');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          cer_onboarding_completed: true,
          cer_onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setCerOnboardingCompleted(true);
      toast.success('Adesione CER completata! Attivazione in corso...');
    } catch (error: any) {
      console.error('Error completing CER onboarding:', error);
      toast.error('Errore durante il completamento dell\'adesione');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    setCurrentStep,
    loading,
    cerEligible,
    cerOnboardingCompleted,
    consents,
    startOnboarding,
    updateConsents,
    completeStrongID,
    completeCEROnboarding,
  };
};
