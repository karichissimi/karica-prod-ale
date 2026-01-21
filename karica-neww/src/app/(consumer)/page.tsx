"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Zap, Users, Award, Upload, Info, Flame, Wrench, ArrowRight, Sparkles, Leaf, TrendingDown, Calendar } from "lucide-react";
import { AnimatedStat, ScrollReveal } from "@/components/ui/animated-stat";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedLogo from '@/components/AnimatedLogo';
import { WipDisclaimer } from "@/components/WipDisclaimer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillUpload } from "@/components/onboarding/BillUpload";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { AnalyzingLoader } from "@/components/onboarding/AnalyzingLoader";

import { NumberTicker } from "@/components/ui/number-ticker";
import { useHaptic } from "@/hooks/use-haptic";
import { Sparkline } from "@/components/ui/sparkline";
import { HeroIcon } from "@/components/ui/hero-icon";

export default function Index() {
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const { user } = useAuth();
    const { triggerHaptic } = useHaptic();

    // Dialog states
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data states
    const [hasElectricBill, setHasElectricBill] = useState(false);
    const [points, setPoints] = useState(13); // Hardcoded to 13 as requested
    const [userName, setUserName] = useState<string>("Utente");
    const [lastBillData, setLastBillData] = useState<any>(null);

    const {
        uploadAndAnalyzeBill,
        loading: billLoading,
        currentStep,
        analysisComplete,
        proceedFromGame
    } = useOnboarding();

    useEffect(() => {
        const loadDashboardData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Fetch user profile for name
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (profile?.full_name) {
                    // Get first name only for greeting
                    const firstName = profile.full_name.split(' ')[0];
                    setUserName(firstName);
                }

                // Check if user has uploaded any bill and get the latest
                const { data: bills, error } = await supabase
                    .from('bill_uploads')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (!error && bills && bills.length > 0) {
                    setHasElectricBill(true);
                    // Extract basic info from ocr_data if available
                    // This assumes ocr_data structure, adjusting based on valid data
                    const bill = bills[0];
                    if (bill.ocr_data) {
                        setLastBillData(bill.ocr_data);
                    }
                }

            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [user]);

    const handleBillUpload = async (file: File) => {
        triggerHaptic('success');
        await uploadAndAnalyzeBill(file);
    };

    const handleGameComplete = () => {
        proceedFromGame();
        setBillDialogOpen(false);
        window.location.reload();
    };

    return (
        <div className="space-y-6 pb-24">
            <WipDisclaimer storageKey="karica_wip_dismissed_home_v3" />

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4 animate-pulse max-w-7xl mx-auto">
                    <div className="h-40 bg-muted/50 rounded-xl w-full mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="h-64 bg-muted/50 rounded-xl md:col-span-2 md:row-span-2"></div>
                        <div className="h-32 bg-muted/50 rounded-xl"></div>
                        <div className="h-32 bg-muted/50 rounded-xl"></div>
                        <div className="h-32 bg-muted/50 rounded-xl"></div>
                        <div className="h-32 bg-muted/50 rounded-xl"></div>
                    </div>
                </div>
            )}

            {/* Dashboard Content */}
            {!loading && (
                <>
                    {/* Fullscreen Game/Loader */}
                    <AnimatePresence>
                        {currentStep === 2 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[60]"
                            >
                                <AnalyzingLoader
                                    isAnalysisComplete={analysisComplete}
                                    onAnalysisComplete={handleGameComplete}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header Section */}
                    <div className="flex flex-col gap-2 pt-2 px-1">
                        <div className="flex items-center gap-2 mb-1 text-primary font-medium text-xs uppercase tracking-wider">
                            <Sparkles className="h-3 w-3" />
                            <span>Dashboard</span>
                        </div>
                        <h1 className="text-3xl font-light text-foreground leading-tight">
                            Ciao <span className="font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-600">{userName}</span>
                        </h1>
                    </div>

                    {/* Bento Grid Layout */}
                    <BentoGrid>
                        {/* 1. Points & Gamification (Featured) */}
                        <BentoCard
                            featured={true}
                            title="Il tuo Livello"
                            subtitle="Continua a risparmiare per salire di grado"
                            icon={<Award className="h-5 w-5" />}
                            onClick={() => {
                                triggerHaptic('selection'); // Feedback on click
                                navigate('/gamification');
                            }}
                            className="bg-gradient-to-br from-background to-secondary/5 dark:from-[#203149] dark:to-[#0C86C7]/20 border-secondary/20"
                            renderVisual={() => <Award className="w-48 h-48 text-[#0C86C7] translate-x-10 translate-y-10 rotate-12" />}
                        >
                            <div className="mt-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-foreground">
                                        <NumberTicker value={points} />
                                    </span>
                                    <span className="text-sm uppercase font-medium text-muted-foreground">Punti Karica</span>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Badge variant="secondary" className="bg-[#45FF4A]/20 text-[#45FF4A] border border-[#45FF4A]/20 shadow-sm hover:bg-[#45FF4A]/30">
                                        Eco-Warrior
                                    </Badge>
                                </div>
                            </div>
                        </BentoCard>

                        {/* 2. Electric Bill (Consumi) */}
                        {!hasElectricBill ? (
                            <BentoCard
                                title="La tua Luce"
                                subtitle="Scopri quanto puoi risparmiare"
                                icon={<Upload className="h-5 w-5" />}
                                onClick={() => setBillDialogOpen(true)}
                                className="bg-primary/5 border-primary/20"
                            >
                                <div className="mt-2 flex flex-col items-start gap-4 h-full justify-between">
                                    <p className="text-sm text-muted-foreground">Carica la tua bolletta: l'AI analizzerà i costi per te in pochi secondi.</p>
                                    <Button size="sm" className="w-full bg-[#45FF4A] text-[#203149] hover:bg-[#45FF4A]/90">
                                        Analizza ora
                                    </Button>
                                </div>
                            </BentoCard>
                        ) : (
                            <BentoCard
                                title="La tua Luce"
                                subtitle="Analisi intelligente"
                                icon={<Zap className="h-5 w-5" />}
                                onClick={() => {
                                    triggerHaptic('selection');
                                    navigate('/utilities');
                                }}
                                className="group"
                            >
                                <div className="mt-2 space-y-1 relative">
                                    <p className="text-[10px] uppercase text-muted-foreground font-medium">Spesa prevista (Anno)</p>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">
                                                {lastBillData?.annual_consumption_projected
                                                    ? <NumberTicker value={Math.round(lastBillData.annual_consumption_projected * (lastBillData.price_kwh || 0.25))} currency={true} />
                                                    : "€ --"}
                                            </p>
                                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-2">
                                                <TrendingDown className="h-3 w-3" />
                                                <span>Puoi risparmiare!</span>
                                            </div>
                                        </div>
                                        <div className="h-12 w-24 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Sparkline
                                                data={[40, 35, 55, 45, 30, 35, 20]}
                                                width={96}
                                                height={48}
                                                color="#45FF4A"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </BentoCard>
                        )}



                        {/* 3. Gas (Placeholder) */}
                        <BentoCard
                            title="Il tuo Gas"
                            subtitle="In arrivo"
                            icon={<Flame className="h-5 w-5" />}
                            className="opacity-75"
                        >
                            <div className="mt-2 flex flex-col h-full justify-end">
                                <p className="text-xs text-muted-foreground">Stiamo lavorando per aiutarti a risparmiare anche sul gas.</p>
                            </div>
                        </BentoCard>

                        {/* 4. Upgrade (Interventions) */}
                        <BentoCard
                            title="Migliora Casa"
                            subtitle="Fotovoltaico & Efficienza"
                            icon={<Wrench className="h-5 w-5" />}
                            onClick={() => navigate('/interventions')}
                        >
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-2 text-green-600 font-medium text-xs bg-green-500/10 p-1.5 rounded w-fit">
                                    <Info className="h-3 w-3" />
                                    <span>Ecobonus 2026</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Scopri come aumentare il valore della tua casa.</p>
                            </div>
                        </BentoCard>

                        {/* 5. CER (Community) */}
                        <BentoCard
                            title="La tua Community"
                            subtitle="Energia Condivisa"
                            icon={<HeroIcon icon={Users} color="#A855F7" />}
                            onClick={() => navigate('/cer')}
                            className="md:col-span-2"
                        >
                            <div className="mt-2 flex justify-between items-center">
                                <p className="text-sm text-muted-foreground max-w-[200px]">Unisciti ai tuoi vicini: condividi energia pulita e guadagna insieme.</p>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0C86C7] to-cyan-400 flex items-center justify-center text-white shadow-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </BentoCard>

                    </BentoGrid>

                    {/* Bill Upload Dialog */}
                    <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Carica Bolletta</DialogTitle>
                            </DialogHeader>
                            <BillUpload onUpload={handleBillUpload} onSkip={() => setBillDialogOpen(false)} loading={billLoading} />
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}
