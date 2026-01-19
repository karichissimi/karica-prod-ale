import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, LogOut } from 'lucide-react';
import { z } from 'zod';
import karicaLogo from '@/assets/karica-logo-2a.png';

const emailSchema = z.string().email('Email non valida');
const passwordSchema = z.string().min(6, 'La password deve avere almeno 6 caratteri');

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <img src={karicaLogo} alt="Karica" className="h-16 w-16 object-contain logo-hover logo-pulse" />
            </div>
            <CardTitle className="text-2xl">Pannello Admin</CardTitle>
            <CardDescription>Sei già connesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sei attualmente connesso come <strong>{user.email}</strong>
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/admin-panel')} 
                className="w-full"
              >
                Vai al Pannello Admin
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);
    
    if (!emailResult.success) {
      toast({
        title: 'Errore',
        description: emailResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    
    if (!passwordResult.success) {
      toast({
        title: 'Errore',
        description: passwordResult.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has admin role
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: data.user.id,
          _role: 'admin'
        });

        if (!hasAdminRole) {
          await supabase.auth.signOut();
          toast({
            title: 'Accesso negato',
            description: 'Non hai i permessi di amministratore.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Accesso effettuato',
          description: 'Benvenuto nel pannello amministratore.',
        });
        navigate('/admin-panel');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Errore di accesso';
      toast({
        title: 'Errore',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <img src={karicaLogo} alt="Karica" className="h-16 w-16 object-contain logo-hover logo-pulse" />
          </div>
          <CardTitle className="text-2xl">Pannello Admin</CardTitle>
          <CardDescription>
            Accedi con le tue credenziali amministratore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@karica.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
