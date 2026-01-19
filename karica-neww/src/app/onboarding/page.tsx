"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { BillUpload } from '@/components/onboarding/BillUpload';
import { BillConfirmStep } from '@/components/snap-solve/BillConfirmStep';
import { ConsentsStep } from '@/components/onboarding/ConsentsStep';
import { OnboardingComplete } from '@/components/onboarding/OnboardingComplete';
import { AnalyzingLoader } from '@/components/onboarding/AnalyzingLoader';
import { BillPreview } from '@/components/onboarding/BillPreview';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import karicaLogo from '@/assets/karica-logo-2a.png';

const Onboarding = () => {
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const { signOut } = useAuth();
    const { toast } = useToast();
    const {
        currentStep,
        setCurrentStep,
        loading,
        analysisComplete,
        billData,
        billAnalysis,
        billFilePath,
        uploadedFile,
        consents,
        uploadAndAnalyzeBill,
        updateBillData,
        updateBillAnalysis,
        updateConsents,
        completeOnboarding,
        handleSkipBillUpload,
        proceedFromGame,
    } = useOnboarding();

    const handleSignOut = async () => {
        await signOut();
        toast({
            title: 'Logout effettuato',
            description: 'Puoi ora accedere con un altro account.',
        });
        navigate('/auth');
    };

    const steps = [
        { number: 1, title: 'Carica Bolletta' },
        { number: 2, title: 'Analisi' },
        { number: 3, title: 'Verifica Dati' },
        { number: 4, title: 'Consensi' },
        { number: 5, title: 'Completato' },
    ];

    const progress = (currentStep / steps.length) * 100;

    const handleCompleteOnboarding = async () => {
        const success = await completeOnboarding();
        if (success) {
            setCurrentStep(5);
        }
    };

    const handleBillConfirm = (updatedData: any) => {
        // Update with confirmed/edited data
        if (Object.keys(updatedData).length > 0) {
            updateBillAnalysis(updatedData);
        }
        // Move to consents step
        setCurrentStep(4);
    };

    const handleRetakeBill = () => {
        // Go back to upload step
        setCurrentStep(1);
    };

    // Show fullscreen game during analysis - user decides when to exit
    if (currentStep === 2) {
        return (
            <AnalyzingLoader
                isAnalysisComplete={analysisComplete}
                onAnalysisComplete={proceedFromGame}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background p-3 flex items-center justify-center animate-fade-in">
            <Card className="w-full max-w-2xl border-border bg-card shadow-lg">
                <CardHeader className="text-center space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="w-10" /> {/* Spacer for centering */}
                        <div className="mx-auto h-12 w-12 flex items-center justify-center animate-scale-in">
                            <img src={karicaLogo.src} alt="Karica" className="h-12 w-12 object-contain logo-hover logo-pulse" />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>

                    <div>
                        <h1 className="text-lg font-semibold text-foreground">Setup Account <span className="font-brand text-primary">Karica</span></h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Step {currentStep} di {steps.length - 1}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Progress value={progress} className="h-1.5" />
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            {steps.slice(0, -1).map((step) => (
                                <span
                                    key={step.number}
                                    className={currentStep >= step.number ? 'text-primary font-medium' : ''}
                                >
                                    {step.title}
                                </span>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4">
                    {currentStep === 1 && (
                        <BillUpload
                            onUpload={uploadAndAnalyzeBill}
                            onSkip={handleSkipBillUpload}
                            loading={loading}
                        />
                    )}

                    {currentStep === 3 && billAnalysis && (
                        <div className="space-y-4">
                            {/* Universal Bill Preview - works for both images and PDFs */}
                            {(uploadedFile || billFilePath) && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-foreground mb-2">Anteprima Bolletta</p>
                                    <BillPreview filePath={billFilePath || ''} file={uploadedFile} />
                                </div>
                            )}

                            <BillConfirmStep
                                billAnalysis={billAnalysis}
                                onConfirm={handleBillConfirm}
                                onRetake={handleRetakeBill}
                            />
                        </div>
                    )}

                    {/* Fallback if billAnalysis is null at step 3 (skip case) */}
                    {currentStep === 3 && !billAnalysis && (
                        <div className="space-y-4">
                            <BillConfirmStep
                                billAnalysis={{
                                    pod: null,
                                    supplier: null,
                                    annual_consumption_projected: null,
                                }}
                                onConfirm={handleBillConfirm}
                                onRetake={handleRetakeBill}
                            />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <ConsentsStep
                            consents={consents}
                            onUpdate={updateConsents}
                            onNext={handleCompleteOnboarding}
                            loading={loading}
                        />
                    )}

                    {currentStep === 5 && (
                        <OnboardingComplete onFinish={() => navigate('/')} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
