"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Banknote,
    Calculator,
    Building2,
    Clock,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    ArrowRight,
    Percent,
    Calendar,
    Euro,
    FileText,
    Shield
} from 'lucide-react';

interface LoanPartner {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    interest_rate_min: number;
    interest_rate_max: number;
    max_duration_months: number;
    min_amount: number;
    max_amount: number;
}

interface LoanRequest {
    id: string;
    amount_requested: number;
    duration_months: number;
    status: string;
    created_at: string;
    loan_partner?: LoanPartner;
}

type WizardStep = 'intro' | 'amount' | 'duration' | 'partner' | 'review' | 'confirm';

const loanPurposes = [
    { value: 'energy_efficiency', label: 'Efficienza Energetica', icon: '⚡' },
    { value: 'solar', label: 'Fotovoltaico', icon: '☀️' },
    { value: 'renovation', label: 'Ristrutturazione', icon: '🏠' },
    { value: 'heating', label: 'Impianto di Riscaldamento', icon: '🔥' },
];

export default function Finance() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loanPartners, setLoanPartners] = useState<LoanPartner[]>([]);
    const [myRequests, setMyRequests] = useState<LoanRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Wizard state
    const [step, setStep] = useState<WizardStep>('intro');
    const [amount, setAmount] = useState(10000);
    const [duration, setDuration] = useState(60);
    const [selectedPartner, setSelectedPartner] = useState<LoanPartner | null>(null);
    const [purpose, setPurpose] = useState('energy_efficiency');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Load loan partners
            const { data: partnersData, error: partnersError } = await supabase
                .from('loan_partners')
                .select('*')
                .eq('is_active', true)
                .order('interest_rate_min');

            if (partnersError) throw partnersError;
            setLoanPartners(partnersData || []);

            // Load my loan requests
            const { data: requestsData, error: requestsError } = await supabase
                .from('loan_requests')
                .select(`
          *,
          loan_partner:loan_partners(*)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (requestsError) throw requestsError;
            setMyRequests(requestsData || []);
        } catch (error) {
            console.error('Error loading finance data:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile caricare i dati.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyPayment = (principal: number, months: number, rate: number) => {
        const monthlyRate = rate / 100 / 12;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
        return Math.round(payment * 100) / 100;
    };

    const getEstimatedRate = (partner: LoanPartner) => {
        // Simple estimation - in reality would be based on credit score, etc.
        return (partner.interest_rate_min + partner.interest_rate_max) / 2;
    };

    const handleSubmitRequest = async () => {
        if (!user || !selectedPartner) return;

        setSubmitting(true);
        try {
            const estimatedRate = getEstimatedRate(selectedPartner);
            const monthlyPayment = calculateMonthlyPayment(amount, duration, estimatedRate);
            const commissionAmount = amount * ((selectedPartner as any).commission_rate || 0);

            const { error } = await supabase
                .from('loan_requests')
                .insert({
                    user_id: user.id,
                    loan_partner_id: selectedPartner.id,
                    amount_requested: amount,
                    duration_months: duration,
                    purpose,
                    interest_rate: estimatedRate,
                    monthly_payment: monthlyPayment,
                    commission_amount: commissionAmount,
                    status: 'pending',
                });

            if (error) throw error;

            toast({
                title: 'Richiesta inviata!',
                description: 'La tua richiesta di finanziamento è stata inoltrata con successo.',
            });

            setStep('confirm');
            loadData();
        } catch (error) {
            console.error('Error submitting loan request:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile inviare la richiesta. Riprova più tardi.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            pending: { variant: 'outline', icon: Clock, label: 'In Attesa' },
            reviewing: { variant: 'secondary', icon: FileText, label: 'In Revisione' },
            approved: { variant: 'default', icon: CheckCircle2, label: 'Approvato' },
            rejected: { variant: 'destructive', icon: null, label: 'Rifiutato' },
            disbursed: { variant: 'default', icon: CheckCircle2, label: 'Erogato' },
        };

        const config = variants[status] || variants.pending;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                {config.label}
            </Badge>
        );
    };

    const stepProgress: Record<WizardStep, number> = {
        intro: 0,
        amount: 20,
        duration: 40,
        partner: 60,
        review: 80,
        confirm: 100,
    };

    const renderStep = () => {
        switch (step) {
            case 'intro':
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Banknote className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">Richiedi un Finanziamento</h2>
                            <p className="text-muted-foreground">
                                Ottieni un prestito a tasso agevolato per i tuoi progetti di efficienza energetica
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {loanPurposes.map((p) => (
                                <Card
                                    key={p.value}
                                    className={`cursor-pointer transition-all ${purpose === p.value ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                    onClick={() => setPurpose(p.value)}
                                >
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <span className="text-2xl">{p.icon}</span>
                                        <span className="font-medium">{p.label}</span>
                                        {purpose === p.value && (
                                            <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button className="w-full" size="lg" onClick={() => setStep('amount')}>
                            Inizia
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                );

            case 'amount':
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Euro className="h-8 w-8 text-primary mx-auto" />
                            <h2 className="text-xl font-bold">Di quanto hai bisogno?</h2>
                            <p className="text-muted-foreground">
                                Seleziona l'importo del finanziamento
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="text-center">
                                <span className="text-4xl font-bold text-primary">
                                    {formatCurrency(amount)}
                                </span>
                            </div>

                            <Slider
                                value={[amount]}
                                onValueChange={(value) => setAmount(value[0])}
                                min={1000}
                                max={100000}
                                step={1000}
                                className="py-4"
                            />

                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{formatCurrency(1000)}</span>
                                <span>{formatCurrency(100000)}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {[5000, 15000, 30000].map((preset) => (
                                    <Button
                                        key={preset}
                                        variant={amount === preset ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setAmount(preset)}
                                    >
                                        {formatCurrency(preset)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep('intro')}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Indietro
                            </Button>
                            <Button className="flex-1" onClick={() => setStep('duration')}>
                                Continua
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );

            case 'duration':
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Calendar className="h-8 w-8 text-primary mx-auto" />
                            <h2 className="text-xl font-bold">In quante rate?</h2>
                            <p className="text-muted-foreground">
                                Scegli la durata del finanziamento
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="text-center">
                                <span className="text-4xl font-bold text-primary">
                                    {duration}
                                </span>
                                <span className="text-xl text-muted-foreground ml-2">mesi</span>
                            </div>

                            <Slider
                                value={[duration]}
                                onValueChange={(value) => setDuration(value[0])}
                                min={12}
                                max={120}
                                step={12}
                                className="py-4"
                            />

                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>12 mesi</span>
                                <span>120 mesi</span>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {[24, 48, 72, 96].map((preset) => (
                                    <Button
                                        key={preset}
                                        variant={duration === preset ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDuration(preset)}
                                    >
                                        {preset}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep('amount')}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Indietro
                            </Button>
                            <Button className="flex-1" onClick={() => setStep('partner')}>
                                Continua
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );

            case 'partner':
                const eligiblePartners = loanPartners.filter(
                    p => amount >= p.min_amount && amount <= p.max_amount && duration <= p.max_duration_months
                );

                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <Building2 className="h-8 w-8 text-primary mx-auto" />
                            <h2 className="text-xl font-bold">Scegli il Partner</h2>
                            <p className="text-muted-foreground">
                                Seleziona l'istituto finanziario
                            </p>
                        </div>

                        {eligiblePartners.length === 0 ? (
                            <Card className="p-6 text-center">
                                <p className="text-muted-foreground">
                                    Nessun partner disponibile per questi parametri.
                                    Prova a modificare l'importo o la durata.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {eligiblePartners.map((partner) => {
                                    const estimatedRate = getEstimatedRate(partner);
                                    const monthlyPayment = calculateMonthlyPayment(amount, duration, estimatedRate);

                                    return (
                                        <Card
                                            key={partner.id}
                                            className={`cursor-pointer transition-all ${selectedPartner?.id === partner.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                                            onClick={() => setSelectedPartner(partner)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <h3 className="font-semibold">{partner.name}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {partner.description}
                                                        </p>
                                                    </div>
                                                    {selectedPartner?.id === partner.id && (
                                                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Tasso indicativo</p>
                                                        <p className="font-semibold flex items-center gap-1">
                                                            <Percent className="h-3 w-3" />
                                                            {partner.interest_rate_min}% - {partner.interest_rate_max}%
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Rata mensile*</p>
                                                        <p className="font-semibold text-primary">
                                                            ~{formatCurrency(monthlyPayment)}/mese
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            *La rata indicata è puramente indicativa e potrebbe variare in base alla valutazione creditizia.
                        </p>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep('duration')}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Indietro
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setStep('review')}
                                disabled={!selectedPartner}
                            >
                                Continua
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );

            case 'review':
                if (!selectedPartner) return null;
                const finalRate = getEstimatedRate(selectedPartner);
                const finalPayment = calculateMonthlyPayment(amount, duration, finalRate);
                const totalInterest = (finalPayment * duration) - amount;

                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <FileText className="h-8 w-8 text-primary mx-auto" />
                            <h2 className="text-xl font-bold">Riepilogo Richiesta</h2>
                            <p className="text-muted-foreground">
                                Verifica i dettagli prima di inviare
                            </p>
                        </div>

                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Importo richiesto</span>
                                    <span className="font-bold text-lg">{formatCurrency(amount)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Durata</span>
                                    <span className="font-semibold">{duration} mesi</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Partner</span>
                                    <span className="font-semibold">{selectedPartner.name}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Tasso indicativo</span>
                                    <span className="font-semibold">{finalRate.toFixed(2)}%</span>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Rata mensile stimata</span>
                                        <span className="font-bold text-xl text-primary">{formatCurrency(finalPayment)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Interessi totali stimati: {formatCurrency(totalInterest)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                                I tuoi dati sono protetti e verranno utilizzati solo per la valutazione della richiesta di finanziamento.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep('partner')}>
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Indietro
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleSubmitRequest}
                                disabled={submitting}
                            >
                                {submitting ? 'Invio in corso...' : 'Invia Richiesta'}
                            </Button>
                        </div>
                    </div>
                );

            case 'confirm':
                return (
                    <div className="space-y-6 text-center">
                        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Richiesta Inviata!</h2>
                            <p className="text-muted-foreground">
                                La tua richiesta di finanziamento è stata inoltrata con successo.
                                Riceverai una risposta entro 48 ore lavorative.
                            </p>
                        </div>
                        <Button onClick={() => setStep('intro')} variant="outline">
                            Nuova Richiesta
                        </Button>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Banknote className="h-6 w-6 text-primary" />
                    Finanziamenti
                </h1>
                <p className="text-muted-foreground">
                    Prestiti agevolati per l'efficienza energetica
                </p>
            </div>

            {/* Progress bar for wizard */}
            {step !== 'intro' && step !== 'confirm' && (
                <div className="space-y-2">
                    <Progress value={stepProgress[step]} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                        Passaggio {Object.keys(stepProgress).indexOf(step)} di 5
                    </p>
                </div>
            )}

            {/* Wizard */}
            <Card>
                <CardContent className="pt-6">
                    {renderStep()}
                </CardContent>
            </Card>

            {/* My Requests */}
            {myRequests.length > 0 && step === 'intro' && (
                <div className="space-y-4">
                    <h2 className="font-semibold">Le Mie Richieste</h2>
                    <div className="space-y-3">
                        {myRequests.map((request) => (
                            <Card key={request.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">{formatCurrency(request.amount_requested)}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.duration_months} mesi • {request.loan_partner?.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {getStatusBadge(request.status)}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(request.created_at).toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
