"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { AnalyzingLoader } from '@/components/onboarding/AnalyzingLoader';
import { AnimatePresence, motion } from 'framer-motion';

// Projection method types - same as BillConfirmStep
type ProjectionMethod = 'historical_complete' | 'historical_partial' | 'arera_projection' | 'direct';

// Extended bill data interface - aligned with Snap & Solve
export interface BillAnalysisData {
    pod: string | null;
    supplier: string | null;
    period_start?: string | null;
    period_end?: string | null;
    period_consumption?: number | null;
    annual_consumption_reported?: number | null;
    annual_period_start?: string | null;
    annual_period_end?: string | null;
    annual_consumption?: number | null;
    annual_consumption_projected?: number | null;
    projection_method?: ProjectionMethod | null;
    projection_details?: {
        months_covered: number[];
        months_projected: number[];
        total_weight: number;
        confidence: 'alta' | 'media' | 'bassa';
        historical_consumption?: number;
        projected_addition?: number;
        arera_profile: Record<number, number>;
    } | null;
    tariff_type?: 'monorario' | 'biorario' | 'triorario' | null;
    power_kw?: number | null;
    customer_code?: string | null;
    price_kwh?: number | null;
}

// Legacy interface for backward compatibility
export interface BillData {
    pod: string;
    supplier: string;
    annualConsumption: number;
}

export interface ConsentsData {
    service: boolean;
    monitoring: boolean;
    marketing: boolean;
}

interface OnboardingContextType {
    currentStep: number;
    setCurrentStep: (step: number) => void;
    loading: boolean;
    analysisComplete: boolean;
    billData: BillData;
    billAnalysis: BillAnalysisData | null;
    billFilePath: string;
    uploadedFile: File | null;
    consents: ConsentsData;
    uploadAndAnalyzeBill: (file: File) => Promise<any>;
    updateBillData: (data: Partial<BillData>) => void;
    updateBillAnalysis: (data: Partial<BillAnalysisData>) => void;
    updateConsents: (data: Partial<ConsentsData>) => void;
    completeOnboarding: () => Promise<boolean>;
    handleSkipBillUpload: () => void;
    proceedFromGame: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const { toast } = useToast();
    const { session } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [billFilePath, setBillFilePath] = useState<string>('');
    const [analysisComplete, setAnalysisComplete] = useState(false);

    // New state to controll game visibility globally
    const [showGame, setShowGame] = useState(false);

    // Store the original file for preview
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    // New full bill analysis data
    const [billAnalysis, setBillAnalysis] = useState<BillAnalysisData | null>(null);

    // Legacy billData for backward compatibility
    const [billData, setBillData] = useState<BillData>({
        pod: '',
        supplier: '',
        annualConsumption: 0,
    });
    const [consents, setConsents] = useState<ConsentsData>({
        service: false,
        monitoring: false,
        marketing: false,
    });

    const uploadAndAnalyzeBill = async (file: File) => {
        setLoading(true);
        setAnalysisComplete(false);
        setUploadedFile(file); // Store original file for preview

        // Instead of just setting step, we explicitly show game
        setShowGame(true);
        setCurrentStep(2);

        try {
            if (!session) {
                throw new Error('Non autenticato');
            }

            console.log('Preparing file for upload...', file.name, file.type, file.size);

            // Convert file to base64 for better mobile compatibility
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            const payload = {
                fileName: file.name,
                fileType: file.type,
                fileData: base64
            };

            console.log('Calling analyze-bill edge function with JSON payload...');

            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

            const response = await fetch(
                `${supabaseUrl}/functions/v1/analyze-bill`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = 'Errore analisi bolletta';
                try {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Analysis completed successfully');

            if (data?.data) {
                // Store full analysis data
                setBillAnalysis(data.data);

                // Also update legacy billData for compatibility
                const annualConsumption = data.data.annual_consumption_projected ||
                    data.data.annual_consumption || 0;
                setBillData({
                    pod: data.data.pod || '',
                    supplier: data.data.supplier || '',
                    annualConsumption,
                });

                // Store file path for preview
                if (data.file_path) {
                    setBillFilePath(data.file_path);
                }

                // Mark analysis as complete but DON'T change step
                // User will click button in game to proceed
                setAnalysisComplete(true);
                setLoading(false);
            }

            return data;
        } catch (error) {
            console.error('Error analyzing bill:', error);
            toast({
                title: 'Errore',
                description: error instanceof Error ? error.message : 'Errore durante l\'analisi della bolletta',
                variant: 'destructive',
            });
            setShowGame(false); // Hide game on error
            setCurrentStep(1); // Go back to upload step
            setLoading(false);
            throw error;
        }
    };

    // Called when user clicks "Vedi Risultati" in game
    const proceedFromGame = () => {
        if (analysisComplete && billAnalysis) {
            setShowGame(false);
            setCurrentStep(3);
            // If we are NOT in onboarding (e.g. from dashboard), we might want to refresh
            // But for now currentStep 3 leads to BillReviewStep in Onboarding
            // Layout/Consumer logic might need to handle this differently
        }
    };

    const updateBillData = (data: Partial<BillData>) => {
        setBillData((prev) => ({ ...prev, ...data }));
    };

    const updateConsents = (data: Partial<ConsentsData>) => {
        setConsents((prev) => ({ ...prev, ...data }));
    };

    const completeOnboarding = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non autenticato');

            // Validate required consents
            if (!consents.service || !consents.monitoring) {
                toast({
                    title: 'Consensi richiesti',
                    description: 'I consensi per il servizio e il monitoraggio sono obbligatori',
                    variant: 'destructive',
                });
                return false;
            }

            // Update profile with bill data
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    pod: billData.pod,
                    energy_supplier: billData.supplier,
                    annual_consumption_kwh: billData.annualConsumption,
                    onboarding_completed: true,
                    onboarding_completed_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Save consents
            const { error: consentsError } = await supabase
                .from('user_consents')
                .upsert({
                    user_id: user.id,
                    service_consent: consents.service,
                    monitoring_consent: consents.monitoring,
                    marketing_consent: consents.marketing,
                }, { onConflict: 'user_id' });

            if (consentsError) throw consentsError;

            toast({
                title: 'Onboarding completato',
                description: 'Benvenuto su Karica!',
            });

            navigate('/');
            return true;
        } catch (error) {
            console.error('Error completing onboarding:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile completare l\'onboarding',
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateBillAnalysis = (data: Partial<BillAnalysisData>) => {
        setBillAnalysis(prev => prev ? { ...prev, ...data } : data as BillAnalysisData);

        // Also update legacy billData
        if (data.pod !== undefined || data.supplier !== undefined || data.annual_consumption_projected !== undefined) {
            setBillData(prev => ({
                pod: data.pod ?? prev.pod,
                supplier: data.supplier ?? prev.supplier,
                annualConsumption: data.annual_consumption_projected ?? data.annual_consumption ?? prev.annualConsumption,
            }));
        }
    };

    const handleSkipBillUpload = () => {
        setBillAnalysis({
            pod: null,
            supplier: null,
            annual_consumption_projected: null,
        });
        setBillData({ pod: '', supplier: '', annualConsumption: 0 });
        setCurrentStep(3);
    };

    return (
        <OnboardingContext.Provider value={{
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
        }}>
            {children}

            {/* Global Game Overlay */}
            <AnimatePresence>
                {showGame && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60]"
                    >
                        <AnalyzingLoader
                            isAnalysisComplete={analysisComplete}
                            onAnalysisComplete={proceedFromGame}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
