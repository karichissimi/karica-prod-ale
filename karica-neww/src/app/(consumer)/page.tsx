"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Zap, Users, Award, FileText, Upload, Info, TrendingUp, ChevronRight, CheckCircle2, Flame, Wrench } from "lucide-react";
import { AnimatedStat, ScrollReveal } from "@/components/ui/animated-stat";
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

export default function Index() {
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const { user } = useAuth();

    // Dialog states
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Data states
    const [hasElectricBill, setHasElectricBill] = useState(false);
    const [points, setPoints] = useState(0);
    const [userName, setUserName] = useState<string>("Utente");

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

                // Check if user has uploaded any bill
                const { count, error } = await supabase
                    .from('bill_uploads')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!error) {
                    setHasElectricBill(count !== null && count > 0);
                }

                // Placeholder for points (mock for now or fetch from profile if added)
                // const { data: profile } = ...
                setPoints(0);

            } catch (err) {
                console.error('Error loading dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [user]);

    const handleBillUpload = async (file: File) => {
        // Just start the process, the hook manages step 2 which shows the game
        await uploadAndAnalyzeBill(file);
        // We don't close dialog immediately, we wait for game to finish
    };

    const handleGameComplete = () => {
        proceedFromGame(); // Move to step 3
        setBillDialogOpen(false); // Close dialog
        window.location.reload(); // Refresh dashboard
    };

    return (
        <div className="space-y-6 pb-20">
            <WipDisclaimer storageKey="karica_wip_dismissed_home_v2" />

            {/* Fullscreen Game/Loader when analyzing */}
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
            <ScrollReveal>
                <div className="flex items-center gap-4">
                    <AnimatedLogo className="h-14 w-14" />
                    <div>
                        <h2 className="text-3xl font-thin text-foreground">
                            Ciao, <span className="font-brand font-normal text-primary">{userName}</span>
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Ecco il riepilogo della tua energia
                        </p>
                    </div>
                </div>
            </ScrollReveal>

            {/* Utilities Status Cards */}
            <div className="grid grid-cols-2 gap-3">
                <ScrollReveal delay={100}>
                    <Card
                        className={`p-4 border-l-4 cursor-pointer hover:shadow-md transition-all ${hasElectricBill ? 'border-l-primary' : 'border-l-muted'}`}
                        onClick={() => navigate('/utilities')}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-full bg-primary/10">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            {hasElectricBill ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5">
                                    Attiva
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] px-1.5">
                                    Mancante
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-semibold text-sm">Luce</h3>
                        {hasElectricBill ? (
                            <p className="text-xs text-muted-foreground mt-1">Analisi completata</p>
                        ) : (
                            <p className="text-xs text-primary font-medium mt-1">Carica bolletta →</p>
                        )}
                    </Card>
                </ScrollReveal>

                <ScrollReveal delay={150}>
                    <Card
                        className="p-4 border-l-4 border-l-orange-500/30 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate('/utilities')}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 rounded-full bg-orange-500/10">
                                <Flame className="h-5 w-5 text-orange-500" />
                            </div>
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px] px-1.5">
                                Prossimamente
                            </Badge>
                        </div>
                        <h3 className="font-semibold text-sm">Gas</h3>
                        <p className="text-xs text-muted-foreground mt-1">In arrivo</p>
                    </Card>
                </ScrollReveal>
            </div>

            {/* Gamification Summary */}
            <ScrollReveal delay={200}>
                <Card className="p-4 bg-gradient-to-r from-background to-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-yellow-500/10">
                                <Award className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">I tuoi Punti Karica</p>
                                <h3 className="text-2xl font-bold text-foreground">
                                    <AnimatedStat end={points} />
                                </h3>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/gamification')} className="text-xs">
                            Vedi premi <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </Card>
            </ScrollReveal>

            {/* Quick Actions / CTA Grid */}
            <h3 className="text-lg font-semibold mt-4 mb-2">Azioni Rapide</h3>
            <div className="grid grid-cols-1 gap-3">
                <ScrollReveal delay={250}>
                    <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/cer')}>
                        <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Unisciti alla CER</h4>
                            <p className="text-xs text-muted-foreground">Scopri la Comunità Energetica della tua zona</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Card>
                </ScrollReveal>

                <ScrollReveal delay={300}>
                    <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/interventions')}>
                        <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                            <Wrench className="h-5 w-5 text-secondary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-sm">Interventi di Efficienza</h4>
                            <p className="text-xs text-muted-foreground">Migliora la tua classe energetica</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Card>
                </ScrollReveal>

                {!hasElectricBill && (
                    <ScrollReveal delay={350}>
                        <Card className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors border-primary/30 bg-primary/5" onClick={() => setBillDialogOpen(true)}>
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm text-primary">Carica Bolletta Luce</h4>
                                <p className="text-xs text-muted-foreground">Ottieni un'analisi gratuita dei consumi</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-primary" />
                        </Card>
                    </ScrollReveal>
                )}
            </div>

            {/* Incentives / Info Section */}
            <ScrollReveal delay={400}>
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-card to-muted border border-border">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Lo sapevi?</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sono disponibili nuovi incentivi statali per l'installazione di pompe di calore e fotovoltaico.
                                <span className="font-medium text-foreground cursor-pointer hover:underline ml-1" onClick={() => navigate('/interventions')}>
                                    Scopri se ne hai diritto
                                </span>.
                            </p>
                        </div>
                    </div>
                </div>
            </ScrollReveal>

            {/* Bill Upload Dialog */}
            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Carica Bolletta</DialogTitle>
                    </DialogHeader>
                    <BillUpload onUpload={handleBillUpload} onSkip={() => setBillDialogOpen(false)} loading={billLoading} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
