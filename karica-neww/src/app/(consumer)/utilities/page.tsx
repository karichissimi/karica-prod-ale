"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Flame, Upload, Info, FileText, Calendar, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillUpload } from "@/components/onboarding/BillUpload";
import { AnimatedStat } from "@/components/ui/animated-stat";
import { ScrollReveal } from "@/components/ui/animated-stat";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AreraExplanationPopup } from "@/components/consumer/AreraExplanationPopup";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from "recharts";
import { CardWithWatermark } from "@/components/ui/card-watermark";
import { SupplyCard } from "@/components/consumer/SupplyCard";

// ARERA profile for monthly distribution (same as home)
const ARERA_PROFILE: Record<number, number> = {
    1: 0.092, 2: 0.085, 3: 0.080, 4: 0.072, 5: 0.070, 6: 0.083,
    7: 0.095, 8: 0.088, 9: 0.078, 10: 0.075, 11: 0.082, 12: 0.100
};
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_FULL_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const ITALIAN_AVERAGE = 2700;

interface BillData {
    period_consumption: number | null;
    period_start: string | null;
    period_end: string | null;
    annual_consumption_projected: number | null;
    projection_method: string | null;
    projection_details: {
        months_covered?: number[];
        arera_profile?: Record<string, number>;
    } | null;
    supplier: string | null;
    pod: string | null;
    power_kw: number | null;
    price_kwh: number | null;
}

interface MonthData {
    mese: string;
    consumo: number;
    costoEur: number;
    isCovered: boolean;
    isCurrent: boolean;
    monthNum: number;
    weight: number;
}

export default function UtilitiesPage() {
    const [activeTab, setActiveTab] = useState("electric");
    const { user } = useAuth();
    const [billDialogOpen, setBillDialogOpen] = useState(false);
    const [areraPopupOpen, setAreraPopupOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
    const { uploadAndAnalyzeBill, loading: billLoading } = useOnboarding();
    const [billData, setBillData] = useState<BillData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBillData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('bill_uploads')
                    .select('ocr_data')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) throw error;

                if (data?.ocr_data) {
                    const ocr = data.ocr_data as Record<string, unknown>;
                    setBillData({
                        period_consumption: ocr.period_consumption as number | null,
                        period_start: ocr.period_start as string | null,
                        period_end: ocr.period_end as string | null,
                        annual_consumption_projected: ocr.annual_consumption_projected as number | null,
                        projection_method: ocr.projection_method as string | null,
                        projection_details: ocr.projection_details as BillData['projection_details'],
                        supplier: ocr.supplier as string | null,
                        pod: ocr.pod as string | null,
                        power_kw: ocr.power_kw as number | null,
                        price_kwh: ocr.price_kwh as number | null
                    });
                }
            } catch (err) {
                console.error('Error loading bill data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadBillData();
    }, [user]);

    const handleBillUpload = async (file: File) => {
        await uploadAndAnalyzeBill(file);
        setBillDialogOpen(false);
        window.location.reload();
    };

    const DEFAULT_PRICE_KWH = 0.25;
    const priceKwh = billData?.price_kwh || DEFAULT_PRICE_KWH;

    const generateMonthlyData = (): MonthData[] => {
        if (!billData?.annual_consumption_projected) return [];
        const annual = billData.annual_consumption_projected;
        const monthsCovered = billData.projection_details?.months_covered || [];
        const currentMonth = new Date().getMonth() + 1;

        return Object.entries(ARERA_PROFILE).map(([month, weight]) => {
            const monthNum = parseInt(month);
            const consumption = Math.round(annual * weight);
            const costoEur = Math.round(consumption * priceKwh * 100) / 100;
            const isCovered = monthsCovered.includes(monthNum);
            const isCurrent = monthNum === currentMonth;

            return {
                mese: MONTH_NAMES[monthNum - 1],
                consumo: consumption,
                costoEur,
                isCovered,
                isCurrent,
                monthNum,
                weight: weight * 100
            };
        });
    };

    const monthlyData = generateMonthlyData();
    const avgMonthly = billData?.annual_consumption_projected ? Math.round(billData.annual_consumption_projected / 12) : 0;
    const avgMonthlyEur = Math.round(avgMonthly * priceKwh * 100) / 100;
    const coveredMonthsCount = monthlyData.filter(m => m.isCovered).length;
    const selectedMonthData = selectedMonth ? monthlyData.find(d => d.monthNum === selectedMonth) : null;

    const getProjectionBadge = (clickable = false) => {
        const baseClasses = clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : "";
        const onClick = clickable ? () => setAreraPopupOpen(true) : undefined;

        switch (billData?.projection_method) {
            case 'historical_complete':
                return <Badge variant="default" className={`bg-green-500/10 text-green-600 border-green-500/20 ${baseClasses}`} onClick={onClick}>🟢 Dato reale {clickable && <Info className="h-3 w-3 ml-1" />}</Badge>;
            case 'historical_partial':
                return <Badge variant="default" className={`bg-yellow-500/10 text-yellow-600 border-yellow-500/20 ${baseClasses}`} onClick={onClick}>🟡 Parziale {clickable && <Info className="h-3 w-3 ml-1" />}</Badge>;
            case 'arera_projection':
                return <Badge variant="default" className={`bg-blue-500/10 text-blue-600 border-blue-500/20 ${baseClasses}`} onClick={onClick}>🔵 Proiezione ARERA {clickable && <Info className="h-3 w-3 ml-1" />}</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <ScrollReveal>
                <h1 className="text-3xl font-bold mb-2">Le tue <span className="font-brand text-primary">Utenze</span></h1>
                <p className="text-muted-foreground">Monitora e ottimizza i tuoi consumi di Luce e Gas.</p>
            </ScrollReveal>

            <Tabs defaultValue="electric" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="electric" className="rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">
                        <Zap className="w-4 h-4 mr-2" /> Luce
                    </TabsTrigger>
                    <TabsTrigger value="gas" className="rounded-lg data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 font-medium transition-all">
                        <Flame className="w-4 h-4 mr-2" /> Gas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="electric" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {!billData ? (
                        <Card className="p-8 text-center space-y-6 border-dashed border-2">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">Nessuna bolletta caricata</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Carica la tua ultima bolletta luce per vedere l'analisi dei consumi e scoprire quanto puoi risparmiare.
                                </p>
                            </div>
                            <Button size="lg" onClick={() => setBillDialogOpen(true)} className="gap-2">
                                <Upload className="h-5 w-5" /> Carica Bolletta Luce
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <SupplyCard onUpdateBill={() => setBillDialogOpen(true)} />

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 bg-card/50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Media Mensile</p>
                                            <p className="text-xl font-bold">~<AnimatedStat end={avgMonthlyEur} decimals={0} suffix="€" /></p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-card/50" onClick={() => setAreraPopupOpen(true)}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-accent/10">
                                            <TrendingUp className="h-5 w-5 text-accent" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">Totale Annuo</p>
                                            <p className="text-xl font-bold">~<AnimatedStat end={Math.round(billData.annual_consumption_projected! * priceKwh)} decimals={0} suffix="€" /></p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Monthly Consumption Chart */}
                            <CardWithWatermark className="p-6 glass-effect" watermarkPosition="bottom-right" watermarkSize="lg" watermarkOpacity={0.04}>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xl font-semibold">Consumi Mensili</h3>
                                    {getProjectionBadge(true)}
                                </div>
                                <div className="h-[250px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} onClick={(data: any) => {
                                            if (data && data.activePayload) {
                                                const clickedMonth = data.activePayload[0].payload.monthNum;
                                                setSelectedMonth(selectedMonth === clickedMonth ? null : clickedMonth);
                                            }
                                        }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                            <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                                            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} tickFormatter={value => `${value}`} />
                                            <ReferenceLine y={Math.round(ITALIAN_AVERAGE / 12)} stroke="hsl(var(--destructive) / 0.7)" strokeDasharray="5 3" strokeWidth={2} />
                                            <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} content={({ active, payload }) => {
                                                if (!active || !payload?.[0]) return null;
                                                const data = payload[0].payload as MonthData;
                                                return (
                                                    <div className="bg-card border rounded-lg p-3 shadow-lg">
                                                        <p className="font-semibold">{MONTH_FULL_NAMES[data.monthNum - 1]}</p>
                                                        <p className="text-lg font-bold text-primary">~{data.costoEur.toFixed(0)}€</p>
                                                        <p className="text-sm text-muted-foreground">{data.consumo.toLocaleString()} kWh</p>
                                                    </div>
                                                );
                                            }} />
                                            <Bar dataKey="consumo" radius={[4, 4, 0, 0]} cursor="pointer">
                                                {monthlyData.map((entry, index) => <Cell key={`cell-${index}`} fill={selectedMonth === entry.monthNum ? 'hsl(var(--primary))' : entry.isCurrent ? 'hsl(var(--primary) / 0.8)' : entry.isCovered ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--muted-foreground) / 0.3)'} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {selectedMonthData && (
                                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium">{MONTH_FULL_NAMES[selectedMonthData.monthNum - 1]}</p>
                                                <p className="text-2xl font-bold text-primary">~{selectedMonthData.costoEur.toFixed(0)}€</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">{selectedMonthData.consumo} kWh</p>
                                                <Badge variant="outline" className="mt-1">{selectedMonthData.isCovered ? 'Reale' : 'Stimato'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardWithWatermark>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="gas" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="p-8 text-center space-y-6 border-dashed border-2">
                        <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Flame className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Bolletta Gas</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                La gestione delle bollette Gas è in arrivo! Presto potrai monitorare anche i tuoi consumi di gas e risparmiare.
                            </p>
                        </div>
                        <Button size="lg" disabled className="gap-2">
                            <Upload className="h-5 w-5" /> Carica Bolletta Gas (Presto)
                        </Button>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-background shadow-sm">
                                <Info className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">Consulenza Energetica</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    La nostra missione è aiutarti a risparmiare su tutte le tue utenze. I nostri esperti stanno lavorando per integrarti le migliori offerte gas sul mercato.
                                </p>
                                <Button variant="outline" className="w-full sm:w-auto">Scopri di più</Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Carica Bolletta Luce</DialogTitle>
                    </DialogHeader>
                    <BillUpload onUpload={handleBillUpload} onSkip={() => setBillDialogOpen(false)} loading={billLoading} />
                </DialogContent>
            </Dialog>

            <AreraExplanationPopup open={areraPopupOpen} onOpenChange={setAreraPopupOpen} annualConsumption={billData?.annual_consumption_projected || null} projectionMethod={billData?.projection_method || null} monthsCovered={billData?.projection_details?.months_covered || []} selectedMonth={selectedMonth} onMonthSelect={setSelectedMonth} priceKwh={priceKwh} />
        </div>
    );
}
