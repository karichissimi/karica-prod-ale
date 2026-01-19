import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Users, FileText, Settings, CheckCircle2 } from 'lucide-react';
import { usePartnerOnboardingCER } from '@/hooks/usePartnerOnboardingCER';
import { CERProfileStep } from '@/components/partner-onboarding/cer/CERProfileStep';
import { CERDocumentsStep } from '@/components/partner-onboarding/cer/CERDocumentsStep';
import { CERTermsStep } from '@/components/partner-onboarding/cer/CERTermsStep';
import { CERCompleteStep } from '@/components/partner-onboarding/cer/CERCompleteStep';
import karicaLogo from '@/assets/karica-logo-2a.png';

const steps = [
  { id: 'profile', name: 'Profilo CER', icon: Users },
  { id: 'documents', name: 'Documenti', icon: FileText },
  { id: 'terms', name: 'Termini', icon: Settings },
  { id: 'complete', name: 'Completamento', icon: CheckCircle2 },
];

const PartnerOnboardingCER = () => {
  const {
    currentStep,
    loading,
    saving,
    formData,
    partnerId,
    updateFormData,
    completeOnboarding,
    nextStep,
    prevStep,
  } = usePartnerOnboardingCER();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <img src={karicaLogo} alt="Karica" className="mx-auto h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold">
            <span className="font-brand">Karica</span> Presidente CER
          </h1>
          <p className="text-muted-foreground">Configura il tuo profilo per gestire la CER</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? 'text-primary' : isComplete ? 'text-primary/60' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`
                    p-2 rounded-full
                    ${isActive ? 'bg-primary text-primary-foreground' : 
                      isComplete ? 'bg-primary/20' : 'bg-muted'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs hidden sm:block">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{steps[currentStep].name}</CardTitle>
            <CardDescription>
              {currentStep === 0 && 'Inserisci le informazioni della tua Comunità Energetica Rinnovabile'}
              {currentStep === 1 && 'Carica i documenti richiesti per la verifica'}
              {currentStep === 2 && 'Leggi e accetta i termini del servizio'}
              {currentStep === 3 && 'Verifica i dati inseriti e completa la registrazione'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 0 && (
              <CERProfileStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 1 && (
              <CERDocumentsStep formData={formData} updateFormData={updateFormData} partnerId={partnerId} />
            )}
            {currentStep === 2 && (
              <CERTermsStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 3 && (
              <CERCompleteStep formData={formData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0 || saving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Avanti'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={completeOnboarding} disabled={saving}>
              {saving ? 'Completamento...' : 'Completa Onboarding'}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboardingCER;
