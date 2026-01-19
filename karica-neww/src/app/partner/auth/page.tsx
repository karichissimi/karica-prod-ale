"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Users, Wrench, Store, ArrowLeft, ChevronRight, LogOut } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import karicaLogo from '@/assets/karica-logo-2a.png';

const emailSchema = z.string().email('Email non valida');
const passwordSchema = z.string().min(6, 'La password deve essere di almeno 6 caratteri');

interface InterventionType {
    id: string;
    name: string;
    description: string;
}

type PartnerType = 'cer_president' | 'intervention' | 'marketplace';

interface PartnerTypeOption {
    type: PartnerType;
    icon: React.ReactNode;
    title: string;
    description: string;
}

const partnerTypeOptions: PartnerTypeOption[] = [
    {
        type: 'cer_president',
        icon: <Users className="h-8 w-8" />,
        title: 'Presidente CER',
        description: 'Gestisci la tua Comunità Energetica Rinnovabile e i suoi membri',
    },
    {
        type: 'intervention',
        icon: <Wrench className="h-8 w-8" />,
        title: 'Partner Interventi',
        description: 'Esegui interventi di riqualificazione energetica per i clienti',
    },
    {
        type: 'marketplace',
        icon: <Store className="h-8 w-8" />,
        title: 'Partner Marketplace',
        description: 'Vendi prodotti per l\'efficienza energetica nel nostro store',
    },
];

const PartnerAuth = () => {
    const router = useRouter();
    const { signIn, signUp, signOut, user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const handleLogout = async () => {
        await signOut();
        toast({
            title: 'Logout effettuato',
            description: 'Puoi ora accedere con un altro account.',
        });
    };

    // Show options if already logged in
    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                            <img src={karicaLogo.src} alt="Karica" className="h-16 w-16 object-contain logo-hover logo-pulse" />
                        </div>
                        <CardTitle className="text-2xl">Partner CRM</CardTitle>
                        <CardDescription>Sei già connesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-center text-sm text-muted-foreground">
                            Sei attualmente connesso come <strong>{user.email}</strong>
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={() => router.push('/partner/crm')}
                                className="w-full"
                            >
                                Vai al Partner CRM
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleLogout}
                                className="w-full"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout e accedi con altro account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Partner type selection
    const [selectedPartnerType, setSelectedPartnerType] = useState<PartnerType | null>(null);
    const [showTypeSelection, setShowTypeSelection] = useState(true);

    // Intervention types (for intervention partners)
    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);

    // Forms
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        companyName: '',
        email: '',
        password: '',
        phone: '',
        description: '',
    });

    // CER-specific fields
    const [cerForm, setCerForm] = useState({
        cerName: '',
        cerFiscalCode: '',
        cerAddress: '',
        memberCount: '',
    });

    // Marketplace-specific fields
    const [marketplaceForm, setMarketplaceForm] = useState({
        storeName: '',
        storeDescription: '',
        productCategories: '',
    });

    useEffect(() => {
        loadInterventionTypes();
    }, []);

    const loadInterventionTypes = async () => {
        const { data } = await supabase
            .from('intervention_types')
            .select('*')
            .order('name');

        if (data) {
            setInterventionTypes(data);
        }
    };

    const handleSelectPartnerType = (type: PartnerType) => {
        setSelectedPartnerType(type);
    };

    const handleContinueToForm = () => {
        if (selectedPartnerType) {
            setShowTypeSelection(false);
        }
    };

    const handleBackToTypeSelection = () => {
        setShowTypeSelection(true);
        setSelectedPartnerType(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            emailSchema.parse(loginForm.email);
            passwordSchema.parse(loginForm.password);

            const { error } = await signIn(loginForm.email, loginForm.password);

            if (error) {
                toast({
                    title: 'Errore',
                    description: error.message === 'Invalid login credentials'
                        ? 'Credenziali non valide'
                        : error.message,
                    variant: 'destructive',
                });
            } else {
                const { data: sessionData } = await supabase.auth.getSession();
                const currentUserId = sessionData?.session?.user?.id;

                if (!currentUserId) {
                    toast({
                        title: 'Errore',
                        description: 'Sessione non valida',
                        variant: 'destructive',
                    });
                    setLoading(false);
                    return;
                }

                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', currentUserId)
                    .eq('role', 'partner')
                    .maybeSingle();

                if (roleData?.role === 'partner') {
                    toast({
                        title: 'Accesso effettuato',
                        description: 'Benvenuto nel CRM Partner!',
                    });
                    router.replace('/partner/crm');
                } else {
                    toast({
                        title: 'Accesso Negato',
                        description: 'Solo i partner possono accedere a questa sezione',
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut();
                }
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: 'Errore di validazione',
                    description: error.errors[0].message,
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            emailSchema.parse(resetEmail);

            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/partner/crm`,
            });

            if (error) {
                toast({
                    title: 'Errore',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Email inviata',
                    description: 'Controlla la tua casella email per resettare la password',
                });
                setShowForgotPassword(false);
                setResetEmail('');
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: 'Errore di validazione',
                    description: error.errors[0].message,
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            emailSchema.parse(signupForm.email);
            passwordSchema.parse(signupForm.password);

            if (!signupForm.companyName.trim()) {
                toast({
                    title: 'Errore',
                    description: 'Il nome dell\'azienda è obbligatorio',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            // Validate based on partner type
            if (selectedPartnerType === 'intervention' && selectedInterventions.length === 0) {
                toast({
                    title: 'Errore',
                    description: 'Seleziona almeno una tipologia di intervento',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            if (selectedPartnerType === 'cer_president' && !cerForm.cerName.trim()) {
                toast({
                    title: 'Errore',
                    description: 'Il nome della CER è obbligatorio',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            if (selectedPartnerType === 'marketplace' && !marketplaceForm.storeName.trim()) {
                toast({
                    title: 'Errore',
                    description: 'Il nome dello store è obbligatorio',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            const { error, userId } = await signUp(signupForm.email, signupForm.password, signupForm.companyName);

            if (error) {
                if (error.message.includes('already registered')) {
                    toast({
                        title: 'Errore',
                        description: 'Questo indirizzo email è già registrato',
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Errore',
                        description: error.message,
                        variant: 'destructive',
                    });
                }
                setLoading(false);
                return;
            }

            if (!userId) {
                setLoading(false);
                return;
            }

            // Create partner request with partner_type
            const { error: requestError } = await supabase
                .from('partner_requests')
                .insert({
                    user_id: userId,
                    company_name: signupForm.companyName,
                    contact_email: signupForm.email,
                    contact_phone: signupForm.phone || null,
                    description: signupForm.description || null,
                    intervention_types: selectedPartnerType === 'intervention' ? selectedInterventions : [],
                    partner_type: selectedPartnerType,
                    status: 'pending',
                });

            if (requestError) {
                console.error('Error creating partner request:', requestError);
                toast({
                    title: 'Errore',
                    description: 'Errore nella creazione della richiesta partner',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            toast({
                title: 'Richiesta inviata',
                description: 'La tua richiesta è stata inviata e sarà esaminata da un amministratore.',
            });

            await supabase.auth.signOut();

            // Reset forms
            setSignupForm({
                companyName: '',
                email: '',
                password: '',
                phone: '',
                description: '',
            });
            setSelectedInterventions([]);
            setCerForm({ cerName: '', cerFiscalCode: '', cerAddress: '', memberCount: '' });
            setMarketplaceForm({ storeName: '', storeDescription: '', productCategories: '' });
            setShowTypeSelection(true);
            setSelectedPartnerType(null);
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: 'Errore di validazione',
                    description: error.errors[0].message,
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleIntervention = (id: string) => {
        setSelectedInterventions(prev => {
            const isCurrentlySelected = prev.includes(id);
            return isCurrentlySelected
                ? prev.filter(i => i !== id)
                : [...prev, id];
        });
    };

    const renderPartnerTypeSelection = () => (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Che tipo di partner sei?</h3>
                <p className="text-sm text-muted-foreground">Seleziona la categoria che meglio descrive la tua attività</p>
            </div>

            <div className="grid gap-4">
                {partnerTypeOptions.map((option) => (
                    <div
                        key={option.type}
                        onClick={() => handleSelectPartnerType(option.type)}
                        className={`
              relative p-4 rounded-xl cursor-pointer transition-all duration-200
              border-2 flex items-center gap-4
              ${selectedPartnerType === option.type
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }
            `}
                    >
                        <div className={`
              p-3 rounded-lg
              ${selectedPartnerType === option.type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }
            `}>
                            {option.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">{option.title}</h4>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {selectedPartnerType === option.type && (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                        )}
                    </div>
                ))}
            </div>

            <Button
                onClick={handleContinueToForm}
                className="w-full"
                disabled={!selectedPartnerType}
            >
                Continua
                <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );

    const renderCERFields = () => (
        <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-muted-foreground">Informazioni CER</h4>
            <div className="space-y-2">
                <Label htmlFor="cer-name">Nome della CER *</Label>
                <Input
                    id="cer-name"
                    type="text"
                    placeholder="Es. CER Energia Verde Milano"
                    value={cerForm.cerName}
                    onChange={(e) => setCerForm({ ...cerForm, cerName: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cer-fiscal-code">Codice Fiscale CER</Label>
                <Input
                    id="cer-fiscal-code"
                    type="text"
                    placeholder="Es. 12345678901"
                    value={cerForm.cerFiscalCode}
                    onChange={(e) => setCerForm({ ...cerForm, cerFiscalCode: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="cer-address">Indirizzo Sede CER</Label>
                <Input
                    id="cer-address"
                    type="text"
                    placeholder="Via Roma 1, 20100 Milano"
                    value={cerForm.cerAddress}
                    onChange={(e) => setCerForm({ ...cerForm, cerAddress: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="member-count">Numero Membri Attuali</Label>
                <Input
                    id="member-count"
                    type="number"
                    placeholder="Es. 50"
                    value={cerForm.memberCount}
                    onChange={(e) => setCerForm({ ...cerForm, memberCount: e.target.value })}
                />
            </div>
        </div>
    );

    const renderInterventionFields = () => (
        <div className="space-y-3 border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Tipologie di Intervento Offerte *</Label>
                {selectedInterventions.length > 0 && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {selectedInterventions.length} selezionat{selectedInterventions.length === 1 ? 'a' : 'e'}
                    </span>
                )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-muted/30">
                {interventionTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Caricamento tipologie...
                    </p>
                ) : (
                    interventionTypes.map((type) => {
                        const isSelected = selectedInterventions.includes(type.id);
                        return (
                            <div
                                key={type.id}
                                onClick={() => toggleIntervention(type.id)}
                                className={`
                  flex items-start space-x-3 p-3 rounded-lg cursor-pointer
                  transition-all duration-200 border-2
                  ${isSelected
                                        ? 'bg-primary/10 border-primary shadow-sm'
                                        : 'bg-background border-transparent hover:bg-muted/50 hover:border-muted'
                                    }
                `}
                            >
                                <div
                                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${isSelected
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-primary'
                                        }`}
                                >
                                    {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                </div>
                                <div className="flex-1 grid gap-1.5 leading-none">
                                    <Label className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                        {type.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    const renderMarketplaceFields = () => (
        <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-muted-foreground">Informazioni Store</h4>
            <div className="space-y-2">
                <Label htmlFor="store-name">Nome Store *</Label>
                <Input
                    id="store-name"
                    type="text"
                    placeholder="Es. EcoShop Italia"
                    value={marketplaceForm.storeName}
                    onChange={(e) => setMarketplaceForm({ ...marketplaceForm, storeName: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="store-description">Descrizione Store</Label>
                <Textarea
                    id="store-description"
                    placeholder="Descrivi brevemente i prodotti che vendi..."
                    value={marketplaceForm.storeDescription}
                    onChange={(e) => setMarketplaceForm({ ...marketplaceForm, storeDescription: e.target.value })}
                    rows={3}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="product-categories">Categorie Prodotti</Label>
                <Input
                    id="product-categories"
                    type="text"
                    placeholder="Es. Pannelli solari, LED, Domotica"
                    value={marketplaceForm.productCategories}
                    onChange={(e) => setMarketplaceForm({ ...marketplaceForm, productCategories: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Separa le categorie con virgole</p>
            </div>
        </div>
    );

    const renderSignupForm = () => (
        <form onSubmit={handleSignup} className="space-y-4">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 -ml-2"
                onClick={handleBackToTypeSelection}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cambia tipo partner
            </Button>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="p-2 rounded-md bg-primary text-primary-foreground">
                    {partnerTypeOptions.find(o => o.type === selectedPartnerType)?.icon}
                </div>
                <div>
                    <p className="font-medium text-sm">
                        {partnerTypeOptions.find(o => o.type === selectedPartnerType)?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">Registrazione in corso</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="company-name">
                    {selectedPartnerType === 'cer_president' ? 'Nome Ente/Associazione' : 'Nome Azienda'} *
                </Label>
                <Input
                    id="company-name"
                    type="text"
                    placeholder={selectedPartnerType === 'cer_president' ? 'Es. Associazione Energia Verde' : 'Es. Eco Solutions SRL'}
                    value={signupForm.companyName}
                    onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="signup-email">Email *</Label>
                <Input
                    id="signup-email"
                    type="email"
                    placeholder="azienda@esempio.it"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="signup-phone">Telefono</Label>
                <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+39 123 456 7890"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="signup-password">Password *</Label>
                <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descrizione (opzionale)</Label>
                <Input
                    id="description"
                    type="text"
                    placeholder="Breve descrizione della tua attività"
                    value={signupForm.description}
                    onChange={(e) => setSignupForm({ ...signupForm, description: e.target.value })}
                />
            </div>

            {/* Render type-specific fields */}
            {selectedPartnerType === 'cer_president' && renderCERFields()}
            {selectedPartnerType === 'intervention' && renderInterventionFields()}
            {selectedPartnerType === 'marketplace' && renderMarketplaceFields()}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registrazione in corso...' : 'Invia Richiesta'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                La tua richiesta sarà esaminata da un amministratore prima dell'attivazione
            </p>
        </form>
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
            <Card className="w-full max-w-2xl shadow-elegant">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                        <img src={karicaLogo.src} alt="Karica" className="h-16 w-16 object-contain logo-hover logo-pulse" />
                    </div>
                    <CardTitle className="text-2xl"><span className="font-brand">Karica</span> Partner CRM</CardTitle>
                    <CardDescription>Gestisci le richieste dei clienti</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Accedi</TabsTrigger>
                            <TabsTrigger value="signup">Registrati come Partner</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            {showForgotPassword ? (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="reset-email">Email</Label>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            placeholder="azienda@esempio.it"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Inserisci l'email del tuo account partner. Riceverai un link per resettare la password.
                                    </p>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Invio in corso...' : 'Invia link di reset'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setShowForgotPassword(false)}
                                    >
                                        Torna al login
                                    </Button>
                                </form>
                            ) : (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="login-email">Email</Label>
                                        <Input
                                            id="login-email"
                                            type="email"
                                            placeholder="azienda@esempio.it"
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="login-password">Password</Label>
                                            <button
                                                type="button"
                                                className="text-xs text-primary hover:underline"
                                                onClick={() => setShowForgotPassword(true)}
                                            >
                                                Password dimenticata?
                                            </button>
                                        </div>
                                        <Input
                                            id="login-password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? 'Accesso in corso...' : 'Accedi'}
                                    </Button>
                                </form>
                            )}
                        </TabsContent>

                        <TabsContent value="signup">
                            {showTypeSelection ? renderPartnerTypeSelection() : renderSignupForm()}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default PartnerAuth;
