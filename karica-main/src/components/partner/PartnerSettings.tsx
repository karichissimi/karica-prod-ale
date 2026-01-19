import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CameraCapture } from '@/components/CameraCapture';
import { 
  Building2, 
  Mail, 
  Phone, 
  FileText, 
  Bell, 
  Save,
  Upload,
  Camera,
  User,
  LogOut
} from 'lucide-react';

interface Partner {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  description: string | null;
  created_at?: string | null;
}

interface PartnerSettingsProps {
  partnerId: string;
  partnerEmail: string;
  onAvatarUpdate?: () => void;
}

const PartnerSettings = ({ partnerId, partnerEmail, onAvatarUpdate }: PartnerSettingsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_email: '',
    contact_phone: '',
    description: ''
  });
  const [notifications, setNotifications] = useState({
    email_new_lead: true,
    email_messages: true,
    email_reminders: false
  });

  useEffect(() => {
    loadPartnerData();
  }, [partnerEmail]);

  const loadPartnerData = async () => {
    try {
      // Get partner data
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('contact_email', partnerEmail)
        .maybeSingle();

      if (partnerError) throw partnerError;
      
      if (partnerData) {
        setPartner(partnerData);
        setFormData({
          company_name: partnerData.company_name || '',
          contact_email: partnerData.contact_email || '',
          contact_phone: partnerData.contact_phone || '',
          description: partnerData.description || ''
        });
      }

      // Get avatar from profiles
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();
        
        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    }
  };

  const handleCameraCapture = async (blob: Blob) => {
    const timestamp = new Date().getTime();
    await uploadAvatar(blob, `camera-${timestamp}.jpg`);
  };

  const uploadAvatar = async (file: Blob | File, fileName?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    
    if (!currentUser) return;

    // Validate file type
    if (file.type && !file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: "L'immagine deve essere inferiore a 2MB",
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = fileName?.split('.').pop() || 'jpg';
      const filePath = `${currentUser.id}/${Math.random()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      onAvatarUpdate?.();

      toast({
        title: 'Successo',
        description: 'Immagine profilo aggiornata',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Errore',
        description: "Impossibile caricare l'immagine",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file, file.name);
  };

  const handleSave = async () => {
    if (!partner) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          company_name: formData.company_name,
          contact_phone: formData.contact_phone,
          description: formData.description
        })
        .eq('id', partner.id);

      if (error) throw error;

      toast({
        title: 'Salvato',
        description: 'Le impostazioni sono state aggiornate',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le impostazioni',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Disconnesso',
      description: 'Sei stato disconnesso con successo',
    });
    navigate('/partner-auth', { replace: true });
  };

  const initials = formData.company_name
    ? formData.company_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'P';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Profilo Partner</h2>
        <p className="text-muted-foreground">Gestisci le informazioni del tuo profilo aziendale</p>
      </div>

      {/* Profile Card - Same style as consumer */}
      <Card className="p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 flex gap-1">
              <label 
                htmlFor="avatar-upload" 
                className="p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4" />
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
                className="p-2 bg-secondary text-secondary-foreground rounded-full cursor-pointer hover:bg-secondary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{formData.company_name || 'Nome Azienda'}</h3>
            <p className="text-muted-foreground">{formData.contact_email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Carica un'immagine o scatta una foto
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nome Azienda
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Es. Eco Solutions SRL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Contatto
            </Label>
            <Input
              id="contact_email"
              value={formData.contact_email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'email non può essere modificata
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Telefono
            </Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              placeholder="+39 123 456 7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrizione Azienda
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrivi i servizi offerti dalla tua azienda..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </Button>
          <Button onClick={handleSignOut} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifiche Email
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nuove Lead</p>
              <p className="text-sm text-muted-foreground">
                Ricevi una email quando arriva una nuova richiesta
              </p>
            </div>
            <Switch
              checked={notifications.email_new_lead}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, email_new_lead: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nuovi Messaggi</p>
              <p className="text-sm text-muted-foreground">
                Ricevi una email quando un cliente ti scrive
              </p>
            </div>
            <Switch
              checked={notifications.email_messages}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, email_messages: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Promemoria</p>
              <p className="text-sm text-muted-foreground">
                Ricevi promemoria per lead non gestite
              </p>
            </div>
            <Switch
              checked={notifications.email_reminders}
              onCheckedChange={(checked) => 
                setNotifications({ ...notifications, email_reminders: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Account Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Statistiche Account</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Partner dal</p>
            <p className="text-xl font-bold">
              {partner?.created_at 
                ? new Date(partner.created_at).toLocaleDateString('it-IT') 
                : '-'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Stato Account</p>
            <p className="text-xl font-bold text-green-500">Attivo</p>
          </div>
        </div>
      </Card>

      <CameraCapture 
        open={cameraOpen} 
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default PartnerSettings;
