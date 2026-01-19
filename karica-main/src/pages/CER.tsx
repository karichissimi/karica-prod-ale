import { useCEROnboarding } from "@/hooks/useCEROnboarding";
import { CERIntro } from "@/components/cer/CERIntro";
import { CERConsents } from "@/components/cer/CERConsents";
import { CERStrongID } from "@/components/cer/CERStrongID";
import { CERTimeline } from "@/components/cer/CERTimeline";
import { CERDashboard } from "@/components/cer/CERDashboard";
import { Card } from "@/components/ui/card";

const CER = () => {
  const {
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
  } = useCEROnboarding();

  // If CER onboarding is completed, show the dashboard
  if (cerOnboardingCompleted) {
    return <CERDashboard />;
  }

  // If user hasn't started the onboarding, show intro
  if (currentStep === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <CERIntro onStart={startOnboarding} loading={loading} />
      </div>
    );
  }

  // Onboarding flow
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-5">
        {/* Progress indicator */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full mx-1 ${
                  currentStep >= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Passo {currentStep} di 3
          </p>
        </div>

        {/* Step content */}
        {currentStep === 1 && (
          <CERConsents
            consents={consents}
            onUpdate={updateConsents}
            onNext={() => setCurrentStep(2)}
            loading={loading}
          />
        )}

        {currentStep === 2 && (
          <CERStrongID
            onComplete={completeStrongID}
            onNext={() => setCurrentStep(3)}
            loading={loading}
            strongIdCompleted={consents.strongIdCompleted}
          />
        )}

        {currentStep === 3 && (
          <CERTimeline
            onComplete={completeCEROnboarding}
            loading={loading}
          />
        )}
      </Card>
    </div>
  );
};

export default CER;
