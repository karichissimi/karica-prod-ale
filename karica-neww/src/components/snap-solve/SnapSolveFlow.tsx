import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera, FileText, Home, Flame, CheckCircle2,
  AlertCircle, Loader2, ArrowRight, ArrowLeft, Sparkles, Upload, Ruler,
  RefreshCw, ThermometerSun, Calendar, Zap, Edit2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { CameraCapture } from "@/components/CameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { SnapSolveResults } from "./SnapSolveResults";
import { BillConfirmStep } from "./BillConfirmStep";
import { HeatingQuestionnaire, HeatingData } from "./HeatingQuestionnaire";
import { BuildingQuestionnaire, BuildingData } from "./BuildingQuestionnaire";

interface SnapSolveFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'intro' | 'bill_choice' | 'bill' | 'bill_confirm' | 'heating' | 'heating_questionnaire' | 'heating_confirm' | 'external' | 'external_questionnaire' | 'external_confirm' | 'sqm' | 'analyzing' | 'results';

interface StepData {
  billImage: File | null;
  billAnalysis: any | null;
  heatingImage: File | null;
  heatingAnalysis: any | null;
  externalImage: File | null;
  externalAnalysis: any | null;
  squareMeters: number | null;
}

interface ExistingBill {
  id: string;
  ocr_data: any;
  created_at: string;
}

export const SnapSolveFlow = ({ open, onOpenChange }: SnapSolveFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('intro');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState<'bill' | 'heating' | 'external'>('bill');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [existingBill, setExistingBill] = useState<ExistingBill | null>(null);
  const [checkingExistingBill, setCheckingExistingBill] = useState(false);
  const [stepData, setStepData] = useState<StepData>({
    billImage: null,
    billAnalysis: null,
    heatingImage: null,
    heatingAnalysis: null,
    externalImage: null,
    externalAnalysis: null,
    squareMeters: null,
  });

  // Check for existing bill when dialog opens
  useEffect(() => {
    const checkExistingBill = async () => {
      if (!open || !user) return;

      setCheckingExistingBill(true);
      try {
        const { data, error } = await supabase
          .from('bill_uploads')
          .select('id, ocr_data, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data && data.ocr_data) {
          setExistingBill(data);
        } else {
          setExistingBill(null);
        }
      } catch (err) {
        console.error('Error checking existing bill:', err);
        setExistingBill(null);
      } finally {
        setCheckingExistingBill(false);
      }
    };

    checkExistingBill();
  }, [open, user]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('intro');
      setStepData({
        billImage: null,
        billAnalysis: null,
        heatingImage: null,
        heatingAnalysis: null,
        externalImage: null,
        externalAnalysis: null,
        squareMeters: null,
      });
      setAnalysisId(null);
      setAnalysisProgress(0);
      setExistingBill(null);
    }
  }, [open]);

  const steps = [
    { id: 'bill', label: 'Bolletta', icon: FileText, description: 'Foto alla bolletta' },
    { id: 'heating', label: 'Impianto', icon: Flame, description: 'Caldaia o condizionatore' },
    { id: 'external', label: 'Edificio', icon: Home, description: 'Caratteristiche casa' },
    { id: 'sqm', label: 'Metratura', icon: Ruler, description: 'Superficie casa' },
  ];

  const getCurrentStepIndex = () => {
    const stepMap: Record<Step, number> = {
      'intro': -1,
      'bill_choice': 0,
      'bill': 0,
      'bill_confirm': 0,
      'heating': 1,
      'heating_questionnaire': 1,
      'heating_confirm': 1,
      'external': 2,
      'external_questionnaire': 2,
      'external_confirm': 2,
      'sqm': 3,
      'analyzing': 4,
      'results': 5
    };
    return stepMap[step];
  };

  // Use existing bill data for analysis
  const handleUseExistingBill = async () => {
    if (!existingBill?.ocr_data || !user) return;

    setIsAnalyzing(true);

    try {
      // Create analysis record
      const { data: newAnalysis, error } = await supabase
        .from('home_analysis')
        .insert({ user_id: user.id, status: 'analyzing' })
        .select('id')
        .single();

      if (error) throw error;

      const currentAnalysisId = newAnalysis.id;
      setAnalysisId(currentAnalysisId);

      // Set bill data from existing bill
      setStepData(prev => ({
        ...prev,
        billAnalysis: existingBill.ocr_data,
      }));

      // Update home_analysis with bill data
      await supabase
        .from('home_analysis')
        .update({
          bill_analysis: existingBill.ocr_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAnalysisId);

      toast.success('Bolletta caricata!');
      setStep('bill_confirm');

    } catch (error) {
      console.error('Error using existing bill:', error);
      toast.error('Errore nel caricamento. Riprova.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadNewBill = () => {
    setExistingBill(null);
    setStep('bill');
  };

  // Navigate to bill step (with choice if existing bill)
  const handleStartFromIntro = () => {
    if (existingBill) {
      setStep('bill_choice');
    } else {
      setStep('bill');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minuti fa`;
    if (diffHours < 24) return `${diffHours} ore fa`;
    if (diffDays === 1) return 'ieri';
    return `${diffDays} giorni fa`;
  };

  const handleStartCapture = (type: 'bill' | 'heating' | 'external') => {
    setCurrentCaptureType(type);
    setCameraOpen(true);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - handle edge cases from cloud storage
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidByExtension = ['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension || '');

    if (!validTypes.includes(file.type) && !isValidByExtension) {
      toast.error('Formato non supportato. Usa PDF, JPG o PNG.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File troppo grande. Massimo 10MB.');
      return;
    }

    // For files from cloud storage (Google Drive, etc.), ensure file is fully loaded
    // by reading it as ArrayBuffer first
    try {
      toast.info('Caricamento file in corso...');

      // Read file to ensure it's fully downloaded from cloud
      const arrayBuffer = await file.arrayBuffer();

      if (arrayBuffer.byteLength === 0) {
        toast.error('File vuoto. Riprova.');
        return;
      }

      // Determine MIME type
      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        if (fileExtension === 'pdf') mimeType = 'application/pdf';
        else if (fileExtension === 'jpg' || fileExtension === 'jpeg') mimeType = 'image/jpeg';
        else if (fileExtension === 'png') mimeType = 'image/png';
      }

      // Create a new File from the loaded buffer to ensure consistency
      const loadedFile = new File([arrayBuffer], file.name, { type: mimeType });

      // Process the fully loaded file
      await processFile(loadedFile);
    } catch (error) {
      console.error('File loading error:', error);
      toast.error('Errore nel caricamento del file. Riprova o usa la fotocamera.');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setIsAnalyzing(true);

    try {
      // Create analysis record if first step
      let currentAnalysisId = analysisId;
      if (!currentAnalysisId && user) {
        const { data: newAnalysis, error } = await supabase
          .from('home_analysis')
          .insert({ user_id: user.id, status: 'analyzing' })
          .select('id')
          .single();

        if (error) throw error;
        currentAnalysisId = newAnalysis.id;
        setAnalysisId(currentAnalysisId);
      }

      // Use existing analyze-bill function
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-bill`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Errore analisi bolletta');
      }

      const result = await response.json();

      setStepData(prev => ({
        ...prev,
        billImage: file,
        billAnalysis: result.data,
      }));

      // Update home_analysis with bill data
      if (currentAnalysisId) {
        await supabase
          .from('home_analysis')
          .update({
            bill_analysis: result.data,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAnalysisId);
      }

      toast.success(file.type === 'application/pdf' ? 'PDF analizzato!' : 'Bolletta analizzata!');
      // Go to bill confirmation step to show extracted data
      setStep('bill_confirm');

    } catch (error) {
      console.error('File processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'analisi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = async (blob: Blob) => {
    const file = new File([blob], `${currentCaptureType}_${Date.now()}.jpg`, { type: 'image/jpeg' });

    setCameraOpen(false);

    // For bill, reuse processFile
    if (currentCaptureType === 'bill') {
      await processFile(file);
      return;
    }

    setIsAnalyzing(true);

    try {
      // Create analysis record if first step
      let currentAnalysisId = analysisId;
      if (!currentAnalysisId && user) {
        const { data: newAnalysis, error } = await supabase
          .from('home_analysis')
          .insert({ user_id: user.id, status: 'analyzing' })
          .select('id')
          .single();

        if (error) throw error;
        currentAnalysisId = newAnalysis.id;
        setAnalysisId(currentAnalysisId);
      }

      // Use snap-solve function for heating/external
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', currentCaptureType);
      formData.append('analysisId', currentAnalysisId!);

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/snap-solve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      // Check for invalid image response
      if (!response.ok || result.error === 'invalid_image') {
        const errorMessage = result.message || result.error || 'Errore analisi';
        toast.error(errorMessage, {
          duration: 5000,
          description: result.expected ? `Riprova fotografando ${result.expected}` : undefined
        });
        // Don't throw - let user retry
        return;
      }

      if (currentCaptureType === 'heating') {
        setStepData(prev => ({
          ...prev,
          heatingImage: file,
          heatingAnalysis: result.data,
        }));
        // Go to confirmation step instead of directly to external
        setStep('heating_confirm');
      } else {
        setStepData(prev => ({
          ...prev,
          externalImage: file,
          externalAnalysis: result.data,
        }));
        // Go to confirmation step instead of directly to sqm
        setStep('external_confirm');
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast.error(error instanceof Error ? error.message : 'Errore durante l\'analisi');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runFinalAnalysis = async (id: string) => {
    setStep('analyzing');
    setAnalysisProgress(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Fetch complete analysis
      const { data: analysis, error } = await supabase
        .from('home_analysis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Import recommendations engine
      const { generateRecommendations, calculateCombinedEnergyClass, calculateExtraCostYearly, calculateDetails } =
        await import('@/lib/recommendations-engine');

      // Cast JSON types to proper interfaces
      const billData = analysis.bill_analysis as { annual_consumption?: number; confidence?: number } | null;
      const heatingData = analysis.heating_analysis as Record<string, unknown> | null;
      const externalData = analysis.external_analysis as Record<string, unknown> | null;
      const sqm = stepData.squareMeters;

      const recommendations = generateRecommendations(
        billData as any,
        heatingData as any,
        externalData as any,
        sqm
      );

      const energyClass = calculateCombinedEnergyClass(
        heatingData as any,
        externalData as any,
        billData?.annual_consumption,
        sqm
      );

      const extraCost = calculateExtraCostYearly(
        billData?.annual_consumption || 3000,
        energyClass,
        sqm
      );

      // Calculate transparency details
      const details = calculateDetails(
        billData?.annual_consumption || null,
        sqm,
        (billData?.confidence as number) || 0.5,
        (heatingData?.confidence as number) || 0.5,
        (externalData?.confidence as number) || 0.5
      );

      // Update with final results
      await supabase
        .from('home_analysis')
        .update({
          recommendations: recommendations as unknown as any,
          combined_energy_class: energyClass,
          estimated_extra_cost_yearly: extraCost,
          confidence_level: details.confidence_factors.overall,
          square_meters: sqm,
          calculation_details: details as unknown as any,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setTimeout(() => {
        setStep('results');
      }, 500);

    } catch (error) {
      console.error('Final analysis error:', error);
      clearInterval(progressInterval);
      toast.error('Errore nell\'elaborazione. Riprova.');
      setStep('intro');
    }
  };

  const handleSkipStep = () => {
    if (step === 'bill_choice') setStep('heating');
    else if (step === 'bill') setStep('heating');
    else if (step === 'bill_confirm') setStep('heating');
    else if (step === 'heating') setStep('external');
    else if (step === 'heating_questionnaire') setStep('external');
    else if (step === 'external') setStep('sqm');
    else if (step === 'external_questionnaire') setStep('sqm');
    else if (step === 'sqm' && analysisId) {
      runFinalAnalysis(analysisId);
    }
  };

  const handleBack = () => {
    if (step === 'bill_choice') setStep('intro');
    else if (step === 'bill') setStep(existingBill ? 'bill_choice' : 'intro');
    else if (step === 'bill_confirm') setStep('bill');
    else if (step === 'heating') setStep(stepData.billAnalysis ? 'bill_confirm' : 'bill');
    else if (step === 'heating_questionnaire') setStep('heating');
    else if (step === 'heating_confirm') setStep('heating');
    else if (step === 'external') setStep(stepData.heatingAnalysis ? 'heating_confirm' : 'heating');
    else if (step === 'external_questionnaire') setStep('external');
    else if (step === 'external_confirm') setStep('external');
    else if (step === 'sqm') setStep(stepData.externalAnalysis ? 'external_confirm' : 'external');
  };

  // Handle questionnaire completion for heating
  const handleHeatingQuestionnaireComplete = async (data: HeatingData) => {
    setIsAnalyzing(true);
    try {
      // Create analysis record if first step
      let currentAnalysisId = analysisId;
      if (!currentAnalysisId && user) {
        const { data: newAnalysis, error } = await supabase
          .from('home_analysis')
          .insert({ user_id: user.id, status: 'analyzing' })
          .select('id')
          .single();

        if (error) throw error;
        currentAnalysisId = newAnalysis.id;
        setAnalysisId(currentAnalysisId);
      }

      // Set heating data from questionnaire
      setStepData(prev => ({
        ...prev,
        heatingAnalysis: data,
      }));

      // Update home_analysis with heating data
      if (currentAnalysisId) {
        await supabase
          .from('home_analysis')
          .update({
            heating_analysis: data as unknown as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAnalysisId);
      }

      toast.success('Dati impianto salvati!');
      setStep('heating_confirm');
    } catch (error) {
      console.error('Questionnaire error:', error);
      toast.error('Errore nel salvataggio. Riprova.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle questionnaire completion for building
  const handleBuildingQuestionnaireComplete = async (data: BuildingData) => {
    setIsAnalyzing(true);
    try {
      // Create analysis record if first step
      let currentAnalysisId = analysisId;
      if (!currentAnalysisId && user) {
        const { data: newAnalysis, error } = await supabase
          .from('home_analysis')
          .insert({ user_id: user.id, status: 'analyzing' })
          .select('id')
          .single();

        if (error) throw error;
        currentAnalysisId = newAnalysis.id;
        setAnalysisId(currentAnalysisId);
      }

      // Set external/building data from questionnaire
      setStepData(prev => ({
        ...prev,
        externalAnalysis: data,
      }));

      // Update home_analysis with building data
      if (currentAnalysisId) {
        await supabase
          .from('home_analysis')
          .update({
            external_analysis: data as unknown as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAnalysisId);
      }

      toast.success('Dati edificio salvati!');
      setStep('external_confirm');
    } catch (error) {
      console.error('Building questionnaire error:', error);
      toast.error('Errore nel salvataggio. Riprova.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmBill = () => {
    toast.success('Dati bolletta confermati!');
    setStep('heating');
  };

  const handleConfirmHeating = () => {
    toast.success('Dati impianto confermati!');
    setStep('external');
  };

  const handleConfirmExternal = () => {
    toast.success('Dati edificio confermati!');
    setStep('sqm');
  };

  const handleRetakePhoto = (type: 'bill' | 'heating' | 'external') => {
    if (type === 'bill') {
      setStepData(prev => ({ ...prev, billImage: null, billAnalysis: null }));
      setStep('bill');
    } else if (type === 'heating') {
      setStepData(prev => ({ ...prev, heatingImage: null, heatingAnalysis: null }));
      setStep('heating');
    } else {
      setStepData(prev => ({ ...prev, externalImage: null, externalAnalysis: null }));
      setStep('external');
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, index) => {
        const StepIcon = s.icon;
        const currentIndex = getCurrentStepIndex();
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={s.id} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full transition-all
                ${isActive ? 'bg-primary text-primary-foreground scale-110' : ''}
                ${isCompleted ? 'bg-secondary text-secondary-foreground' : ''}
                ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
              `}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <StepIcon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 mx-1 transition-colors ${isCompleted ? 'bg-secondary' : 'bg-muted'
                  }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <Dialog open={open && step !== 'results'} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Analisi Smart
            </DialogTitle>
            <DialogDescription>
              {step === 'intro' && 'Scopri quanta energia brucia la tua casa'}
              {step === 'bill_choice' && 'Vuoi usare la bolletta già caricata?'}
              {step === 'bill' && 'Scatta una foto alla tua bolletta'}
              {step === 'bill_confirm' && 'Verifica i dati estratti dalla bolletta'}
              {step === 'heating' && 'Fotografa la caldaia o il condizionatore'}
              {step === 'heating_confirm' && 'Verifica i dati rilevati dall\'impianto'}
              {step === 'external' && 'Caratteristiche del tuo edificio'}
              {step === 'external_questionnaire' && 'Rispondi a 4 domande sulla tua casa'}
              {step === 'external_confirm' && 'Verifica i dati rilevati dell\'edificio'}
              {step === 'sqm' && 'Quanti metri quadri è la tua casa?'}
              {step === 'analyzing' && 'Stiamo analizzando i tuoi dati...'}
            </DialogDescription>
          </DialogHeader>

          {step !== 'intro' && step !== 'bill_choice' && step !== 'analyzing' && step !== 'sqm' && step !== 'bill_confirm' && step !== 'heating_confirm' && step !== 'external_confirm' && renderStepIndicator()}

          <div className="space-y-4">
            {step === 'intro' && (
              <>
                {checkingExistingBill ? (
                  <Card className="p-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Controllo bollette esistenti...</p>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {steps.map((s, index) => {
                        const StepIcon = s.icon;
                        return (
                          <Card key={s.id} className="p-4 flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{s.label}</p>
                              <p className="text-sm text-muted-foreground">{s.description}</p>
                            </div>
                            <StepIcon className="h-5 w-5 text-muted-foreground" />
                          </Card>
                        );
                      })}
                    </div>

                    <Card className="p-4 bg-secondary/10 border-secondary/20">
                      <p className="text-sm text-secondary flex items-start gap-2">
                        <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        L'AI analizzerà le foto e calcolerà quanto stai sprecando e come risparmiare
                      </p>
                    </Card>

                    <Button className="w-full" size="lg" onClick={handleStartFromIntro}>
                      Inizia Analisi
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </>
            )}

            {step === 'bill_choice' && existingBill && (
              <>
                <Card className="p-5 border-primary/30 bg-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">Bolletta già disponibile</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Caricata {formatTimeAgo(existingBill.created_at)}
                      </p>
                      {existingBill.ocr_data && (
                        <div className="mt-3 space-y-1 text-sm">
                          {existingBill.ocr_data.supplier && (
                            <p className="text-muted-foreground">
                              <span className="font-medium text-foreground">{existingBill.ocr_data.supplier}</span>
                            </p>
                          )}
                          {existingBill.ocr_data.pod && (
                            <p className="text-muted-foreground">
                              POD: ...{existingBill.ocr_data.pod.slice(-6)}
                            </p>
                          )}
                          {existingBill.ocr_data.annual_consumption && (
                            <p className="text-muted-foreground">
                              Consumo: <span className="font-medium text-foreground">{existingBill.ocr_data.annual_consumption} kWh/anno</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <div className="grid gap-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleUseExistingBill}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Usa questa bolletta
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUploadNewBill}
                    disabled={isAnalyzing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carica nuova bolletta
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep('heating')}
                  disabled={isAnalyzing}
                >
                  Salta questo passaggio
                </Button>
              </>
            )}

            {step === 'bill' && (
              <>
                {isAnalyzing ? (
                  <Card className="p-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Analizzando bolletta...</p>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Card
                        className="p-6 flex flex-col items-center justify-center gap-3 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleStartCapture('bill')}
                      >
                        <Camera className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">Scatta foto</p>
                      </Card>

                      <Card
                        className="p-6 flex flex-col items-center justify-center gap-3 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={handleFileUpload}
                      >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground text-center">Carica PDF</p>
                      </Card>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Cerca il POD e i consumi annuali sulla bolletta
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSkipStep}
                  disabled={isAnalyzing}
                >
                  Salta questo passaggio
                </Button>
              </>
            )}

            {step === 'bill_confirm' && stepData.billAnalysis && (
              <BillConfirmStep
                billAnalysis={stepData.billAnalysis}
                onConfirm={(updatedData) => {
                  // Update stepData with manually edited values
                  setStepData(prev => ({
                    ...prev,
                    billAnalysis: { ...prev.billAnalysis, ...updatedData }
                  }));

                  // Also update the home_analysis record if we have an analysisId
                  if (analysisId) {
                    supabase
                      .from('home_analysis')
                      .update({
                        bill_analysis: { ...stepData.billAnalysis, ...updatedData },
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', analysisId)
                      .then(() => console.log('Bill analysis updated'));
                  }

                  toast.success('Dati bolletta confermati!');
                  setStep('heating');
                }}
                onRetake={() => handleRetakePhoto('bill')}
              />
            )}

            {step === 'heating' && (
              <>
                <Card
                  className="p-8 flex flex-col items-center justify-center gap-4 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleStartCapture('heating')}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Analizzando...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground text-center">
                        Tocca per scattare una foto alla caldaia/condizionatore
                      </p>
                    </>
                  )}
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  Fotografa l'etichetta con marca e modello
                </p>

                <div className="relative flex items-center gap-4 my-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">oppure</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStep('heating_questionnaire')}
                  disabled={isAnalyzing}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rispondi a 3 domande veloci
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} disabled={isAnalyzing}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Indietro
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={handleSkipStep}
                    disabled={isAnalyzing}
                  >
                    Salta questo passaggio
                  </Button>
                </div>
              </>
            )}

            {step === 'heating_questionnaire' && (
              <HeatingQuestionnaire
                onComplete={handleHeatingQuestionnaireComplete}
                onBack={() => setStep('heating')}
                isLoading={isAnalyzing}
              />
            )}

            {step === 'external' && (
              <>
                <Card className="p-4 bg-primary/5 border-primary/20 mb-2">
                  <p className="text-sm text-center">
                    <strong>Rispondi a 4 domande veloci</strong> per valutare l'efficienza energetica del tuo edificio
                  </p>
                </Card>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setStep('external_questionnaire')}
                  disabled={isAnalyzing}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Inizia Questionario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <div className="relative flex items-center gap-4 my-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-xs text-muted-foreground">oppure se hai una villetta</span>
                  <div className="flex-1 border-t border-border" />
                </div>

                <Card
                  className="p-4 flex items-center justify-center gap-3 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleStartCapture('external')}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Analizzando...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Scatta foto all'esterno (facoltativo)
                      </p>
                    </>
                  )}
                </Card>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack} disabled={isAnalyzing}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Indietro
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={handleSkipStep}
                    disabled={isAnalyzing}
                  >
                    Salta questo passaggio
                  </Button>
                </div>
              </>
            )}

            {step === 'external_questionnaire' && (
              <BuildingQuestionnaire
                onComplete={handleBuildingQuestionnaireComplete}
                onBack={() => setStep('external')}
                isLoading={isAnalyzing}
              />
            )}

            {step === 'heating_confirm' && stepData.heatingAnalysis && (
              <>
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <Flame className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {stepData.heatingAnalysis.brand || 'Impianto'}
                        {stepData.heatingAnalysis.model && ` ${stepData.heatingAnalysis.model}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">Dati rilevati dall'immagine</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {stepData.heatingAnalysis.estimated_year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Anno: <strong>{stepData.heatingAnalysis.estimated_year}</strong></span>
                      </div>
                    )}
                    {stepData.heatingAnalysis.device_type && (
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                        <span>{stepData.heatingAnalysis.device_type.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {stepData.heatingAnalysis.fuel_type && (
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-muted-foreground" />
                        <span>Combustibile: <strong>{stepData.heatingAnalysis.fuel_type}</strong></span>
                      </div>
                    )}
                    {stepData.heatingAnalysis.energy_class && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>Classe: <Badge variant="secondary">{stepData.heatingAnalysis.energy_class}</Badge></span>
                      </div>
                    )}
                  </div>

                  {stepData.heatingAnalysis.confidence && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Affidabilità rilevamento: {Math.round(stepData.heatingAnalysis.confidence * 100)}%
                      </p>
                    </div>
                  )}
                </Card>

                <p className="text-sm text-center text-muted-foreground">
                  Questi dati sono corretti? Se no, puoi rifare la foto.
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleRetakePhoto('heating')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rifai Foto
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmHeating}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confermo, è corretto
                  </Button>
                </div>
              </>
            )}

            {step === 'external_confirm' && stepData.externalAnalysis && (
              <>
                <Card className="p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Home className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {stepData.externalAnalysis.building_type?.replace(/_/g, ' ') || 'Edificio'}
                      </h3>
                      <p className="text-sm text-muted-foreground">Caratteristiche rilevate</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {stepData.externalAnalysis.building_age_estimate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Epoca: <strong>{stepData.externalAnalysis.building_age_estimate.replace(/_/g, '-')}</strong></span>
                      </div>
                    )}
                    {stepData.externalAnalysis.window_type && (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>Infissi: <strong>{stepData.externalAnalysis.window_type.replace(/_/g, ' ')}</strong></span>
                      </div>
                    )}
                    {stepData.externalAnalysis.facade_condition && (
                      <div className="flex items-center gap-2">
                        <span>Facciata: <strong>{stepData.externalAnalysis.facade_condition}</strong></span>
                      </div>
                    )}
                    {stepData.externalAnalysis.estimated_class && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>Classe stimata: <Badge variant="secondary">{stepData.externalAnalysis.estimated_class}</Badge></span>
                      </div>
                    )}
                  </div>

                  {stepData.externalAnalysis.insulation_visible && stepData.externalAnalysis.insulation_visible !== 'nessuno_evidente' && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Isolamento visibile: {stepData.externalAnalysis.insulation_visible.replace(/_/g, ' ')}
                      </p>
                    </div>
                  )}
                </Card>

                <p className="text-sm text-center text-muted-foreground">
                  Questi dati corrispondono alla tua casa?
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleRetakePhoto('external')}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rifai Foto
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmExternal}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confermo, è corretto
                  </Button>
                </div>
              </>
            )}

            {step === 'sqm' && (
              <>
                <Card className="p-6 space-y-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary mb-2">
                      {stepData.squareMeters || 100} m²
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Superficie calpestabile approssimativa
                    </p>
                  </div>

                  <Slider
                    value={[stepData.squareMeters || 100]}
                    min={40}
                    max={250}
                    step={5}
                    onValueChange={(value) => setStepData(prev => ({ ...prev, squareMeters: value[0] }))}
                    className="py-4"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>40 m²</span>
                    <span>250 m²</span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {[60, 80, 100, 120, 150].map((size) => (
                      <Button
                        key={size}
                        variant={stepData.squareMeters === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStepData(prev => ({ ...prev, squareMeters: size }))}
                      >
                        {size} m²
                      </Button>
                    ))}
                  </div>
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  La superficie serve per calcolare la classe energetica (kWh/m²/anno)
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Indietro
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => analysisId && runFinalAnalysis(analysisId)}
                    disabled={!stepData.squareMeters}
                  >
                    Calcola Risultati
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {step === 'analyzing' && (
              <div className="py-8 space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  </div>
                  <p className="font-medium">Elaborazione AI in corso...</p>
                </div>

                <Progress value={analysisProgress} className="h-2" />

                <div className="text-sm text-muted-foreground text-center space-y-1">
                  {analysisProgress < 30 && <p>Analizzando i consumi...</p>}
                  {analysisProgress >= 30 && analysisProgress < 60 && <p>Valutando l'efficienza impianto...</p>}
                  {analysisProgress >= 60 && analysisProgress < 90 && <p>Calcolando classe energetica...</p>}
                  {analysisProgress >= 90 && <p>Generando raccomandazioni...</p>}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
        skipCrop={true}
        useBackCamera={true}
      />

      {step === 'results' && analysisId && (
        <SnapSolveResults
          open={true}
          onOpenChange={onOpenChange}
          analysisId={analysisId}
        />
      )}
    </>
  );
};
