"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import AnimatedLogo from '@/components/AnimatedLogo';

const emailSchema = z.string().email('Email non valida');
const passwordSchema = z.string().min(6, 'La password deve essere di almeno 6 caratteri');

const Auth = () => {
    const router = useRouter();
    const navigate = (path: string) => router.push(path);
    const { signIn, signUp, signOut, user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({
        email: '',
        password: '',
        fullName: '',
    });

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
                toast({
                    title: 'Accesso effettuato',
                    description: 'Benvenuto su Karica!',
                });
                navigate('/');
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

            if (!signupForm.fullName.trim()) {
                toast({
                    title: 'Errore',
                    description: 'Il nome completo è obbligatorio',
                    variant: 'destructive',
                });
                setLoading(false);
                return;
            }

            const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);

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
            } else {
                toast({
                    title: 'Registrazione completata',
                    description: 'Account creato con successo!',
                });
                navigate('/onboarding');
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

    const handleSignOut = async () => {
        await signOut();
        toast({
            title: 'Logout effettuato',
            description: 'Puoi ora accedere con un altro account.',
        });
    };

    // Show options if already logged in
    if (user) {
        return (
            <div className="dark flex min-h-screen items-center justify-center p-3 animate-fade-in relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, hsl(210 40% 8%) 0%, hsl(210 40% 12%) 50%, hsl(160 40% 10%) 100%)' }}>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/15 rounded-full blur-3xl animate-pulse delay-1000" />

                <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl shadow-primary/10">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-3 flex items-center justify-center animate-scale-in">
                            <AnimatedLogo className="h-16 w-16" />
                        </div>
                        <CardTitle className="text-xl text-white font-brand">Karica</CardTitle>
                        <CardDescription className="text-xs text-white/60">Sei già connesso</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pb-6">
                        <p className="text-center text-sm text-white/70">
                            Sei attualmente connesso come <strong className="text-white">{user.email}</strong>
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={() => navigate('/')}
                                className="w-full"
                            >
                                Continua con questo account
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleSignOut}
                                className="w-full border-white/20 text-white hover:bg-white/10"
                            >
                                Logout e accedi con altro account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="dark flex min-h-screen items-center justify-center p-3 animate-fade-in relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(210 40% 8%) 0%, hsl(210 40% 12%) 50%, hsl(160 40% 10%) 100%)' }}>
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/15 rounded-full blur-3xl animate-pulse delay-1000" />

            <Card className="w-full max-w-md relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl shadow-primary/10">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-3 flex items-center justify-center animate-scale-in">
                        <AnimatedLogo className="h-16 w-16" />
                    </div>
                    <CardTitle className="text-xl text-white font-brand">Karica</CardTitle>
                    <CardDescription className="text-xs text-white/60">Gestisci il tuo consumo energetico</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-9 bg-white/5 border border-white/10">
                            <TabsTrigger
                                value="login"
                                className="text-sm text-white/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                            >
                                Accedi
                            </TabsTrigger>
                            <TabsTrigger
                                value="signup"
                                className="text-sm text-white/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300"
                            >
                                Registrati
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="animate-fade-in mt-4">
                            <form onSubmit={handleLogin} className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="login-email" className="text-xs text-white/80">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="tu@esempio.it"
                                        value={loginForm.email}
                                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                        required
                                        className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="login-password" className="text-xs text-white/80">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={loginForm.password}
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                        required
                                        className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-9 text-sm mt-4" disabled={loading}>
                                    {loading ? 'Accesso in corso...' : 'Accedi'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup" className="animate-fade-in mt-4">
                            <form onSubmit={handleSignup} className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-name" className="text-xs text-white/80">Nome Completo</Label>
                                    <Input
                                        id="signup-name"
                                        type="text"
                                        placeholder="Mario Rossi"
                                        value={signupForm.fullName}
                                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                                        required
                                        className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-email" className="text-xs text-white/80">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="tu@esempio.it"
                                        value={signupForm.email}
                                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                        required
                                        className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="signup-password" className="text-xs text-white/80">Password</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={signupForm.password}
                                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                        required
                                        className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-primary/50 focus:ring-primary/20"
                                    />
                                </div>

                                <Button type="submit" className="w-full h-9 text-sm mt-4" disabled={loading}>
                                    {loading ? 'Registrazione in corso...' : 'Registrati'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default Auth;
