import { usePartnerOnboarding } from '@/hooks/usePartnerOnboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, FileText, Settings, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import karicaLogo from '@/assets/karica-logo-2a.png';
import { PartnerProfileStep } from '@/components/partner-onboarding/PartnerProfileStep';
import { PartnerDocumentsStep } from '@/components/partner-onboarding/PartnerDocumentsStep';
import { PartnerTermsStep } from '@/components/partner-onboarding/PartnerTermsStep';
import { PartnerCompleteStep } from '@/components/partner-onboarding/PartnerCompleteStep';

const steps = [
  { id: 1, name: 'Profilo Aziendale', icon: Building2 },
  { id: 2, name: 'Documenti', icon: FileText },
  { id: 3, name: 'Termini B2B', icon: Settings },
  { id: 4, name: 'Completamento', icon: CheckCircle2 },
];

export default function PartnerOnboarding() {
  const {
    currentStep,
    loading,
    saving,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    completeOnboarding,
    partnerId,
  } = usePartnerOnboarding();

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

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <img src={karicaLogo} alt="Karica" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="font-brand">Karica</span> Partner Onboarding
          </h1>
          <p className="text-muted-foreground mt-2">
            Completa il tuo profilo per iniziare a ricevere richieste
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'border-primary/70 bg-primary/10'
                        : 'border-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].name}</CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Inserisci le informazioni della tua azienda'}
              {currentStep === 2 && 'Carica i documenti aziendali richiesti'}
              {currentStep === 3 && 'Leggi e accetta i termini di partnership B2B'}
              {currentStep === 4 && 'Verifica i dati e completa l\'onboarding'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <PartnerProfileStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 2 && (
              <PartnerDocumentsStep 
                formData={formData} 
                updateFormData={updateFormData}
                partnerId={partnerId}
              />
            )}
            {currentStep === 3 && (
              <PartnerTermsStep formData={formData} updateFormData={updateFormData} />
            )}
            {currentStep === 4 && (
              <PartnerCompleteStep formData={formData} />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || saving}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>

              {currentStep < 4 ? (
                <Button onClick={nextStep} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Avanti
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={completeOnboarding} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Completa Onboarding
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
