import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";
import { LogOut, User, Mail, Phone, MapPin, Upload, Camera, Zap, Trophy, Star, FileText } from "lucide-react";
import { CameraCapture } from '@/components/CameraCapture';
import AnimatedLogo from '@/components/AnimatedLogo';
import { AnimatedAvatar, LevelBadge } from '@/components/ui/animated-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SupplyCard } from '@/components/consumer/SupplyCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillUpload } from "@/components/onboarding/BillUpload";
import { useOnboarding } from "@/hooks/useOnboarding";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const { uploadAndAnalyzeBill, loading: billLoading } = useOnboarding();
  const [profile, setProfile] = useState({
    full_name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    avatar_url: '',
  });

  // Mock stats - in production these would come from the database
  const userStats = {
    level: 5,
    achievements: 8,
    points: 1250,
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setProfileLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        address: data.address || '',
        avatar_url: data.avatar_url || '',
      });
    }
    setProfileLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare il profilo',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Successo',
        description: 'Profilo aggiornato correttamente',
      });
      setIsEditing(false);
    }

    setLoading(false);
  };

  const handleCameraCapture = async (blob: Blob) => {
    const timestamp = new Date().getTime();
    await uploadAvatar(blob, `camera-${timestamp}.jpg`);
  };

  const uploadAvatar = async (file: Blob | File, fileName?: string) => {
    if (!user) return;

    if (file.type && !file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: 'L\'immagine deve essere inferiore a 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = fileName?.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });

      toast({
        title: 'Successo',
        description: 'Immagine profilo aggiornata',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare l\'immagine',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    await uploadAvatar(file, file.name);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Disconnesso',
      description: 'Sei stato disconnesso con successo',
    });
  };

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 animate-fade-in">
        <AnimatedLogo className="h-12 w-12" />
        <div>
          <h2 className="text-3xl font-bold">Profilo Utente</h2>
          <p className="text-muted-foreground">Gestisci le tue informazioni personali</p>
        </div>
      </div>

      <Card variant="glass" className="p-6 animate-fade-in stagger-1">
        {profileLoading ? (
          <div className="flex items-center gap-6 mb-6">
            <Skeleton size="avatar-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton size="title" />
              <Skeleton size="text" className="w-1/2" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 mb-6">
            {/* Animated Avatar with gradient ring */}
            <div className="relative">
              <AnimatedAvatar
                src={profile.avatar_url}
                fallback={initials}
                size="xl"
                showRing={true}
                ringColor="gradient"
                badge={<LevelBadge level={userStats.level} />}
              />
              
              {/* Upload buttons */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                <label 
                  htmlFor="avatar-upload" 
                  className={cn(
                    "p-2 bg-primary text-primary-foreground rounded-full cursor-pointer transition-all duration-300",
                    "hover:bg-primary/90 hover:scale-110 shadow-lg",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setCameraOpen(true)}
                  disabled={uploading}
                  className={cn(
                    "p-2 bg-secondary text-secondary-foreground rounded-full cursor-pointer transition-all duration-300",
                    "hover:bg-secondary/90 hover:scale-110 shadow-lg",
                    uploading && "opacity-50 pointer-events-none"
                  )}
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{profile.full_name || 'Nome Utente'}</h3>
              <p className="text-muted-foreground">{profile.email}</p>
              
              {/* Achievement badges */}
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="gap-1 bg-primary/5 border-primary/30">
                  <Trophy className="h-3 w-3 text-primary" />
                  {userStats.achievements} Achievement
                </Badge>
                <Badge variant="outline" className="gap-1 bg-secondary/5 border-secondary/30">
                  <Star className="h-3 w-3 text-secondary" />
                  {userStats.points.toLocaleString()} Punti
                </Badge>
              </div>
            </div>
          </div>
        )}

        <Separator className="my-6" />

        <div className={cn(
          "space-y-4 transition-all duration-300",
          isEditing ? "opacity-100" : "opacity-80"
        )}>
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nome Completo
            </Label>
            <Input
              id="name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Mario Rossi"
              disabled={!isEditing}
              className={cn(!isEditing && "bg-muted/50")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">L'email non può essere modificata</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+39 123 456 7890"
              disabled={!isEditing}
              className={cn(!isEditing && "bg-muted/50")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Indirizzo
              {!profile.address && (
                <span className="flex items-center gap-1 ml-auto text-xs">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold text-[10px]">+5</span>
                </span>
              )}
            </Label>
            <Input
              id="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Via Roma 123, Milano"
              disabled={!isEditing}
              className={cn(!isEditing && "bg-muted/50")}
            />
            {!profile.address && isEditing && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Aggiungi l'indirizzo per guadagnare 5 punti!
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
              <Button 
                onClick={() => setIsEditing(false)} 
                variant="outline"
                disabled={loading}
              >
                Annulla
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                Modifica Profilo
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Esci
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Supply Data Section */}
      <SupplyCard 
        onUpdateBill={() => setBillDialogOpen(true)} 
        className="animate-fade-in stagger-2"
      />

      <Card variant="glow" className="p-6 animate-fade-in stagger-3">
        <h3 className="text-lg font-semibold mb-4">Statistiche Account</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 transition-all hover:scale-[1.02]">
            <p className="text-sm text-muted-foreground">Membro dal</p>
            <p className="text-xl font-bold text-secondary">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : '-'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 transition-all hover:scale-[1.02]">
            <p className="text-sm text-muted-foreground">Ultimo accesso</p>
            <p className="text-xl font-bold text-primary">Oggi</p>
          </div>
        </div>
      </Card>

      <CameraCapture 
        open={cameraOpen} 
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Bill Upload Dialog */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Aggiorna Bolletta
            </DialogTitle>
          </DialogHeader>
          <BillUpload 
            onUpload={async (file) => {
              await uploadAndAnalyzeBill(file);
              setBillDialogOpen(false);
              window.location.reload();
            }}
            onSkip={() => setBillDialogOpen(false)}
            loading={billLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
