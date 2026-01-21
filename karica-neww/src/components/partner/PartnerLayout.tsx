import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bell,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useLeadNotifications } from '@/hooks/useLeadNotifications';
import karicaLogo from '@/assets/karica-logo-2a.png';

interface PartnerLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessages: number;
  unreadNotifications: number;
  partnerName?: string;
  partnerEmail?: string;
}

const PartnerLayout = ({
  children,
  activeTab,
  onTabChange,
  unreadMessages,
  unreadNotifications,
  partnerName,
  partnerEmail
}: PartnerLayoutProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { unreadCount: realTimeUnread } = useLeadNotifications('partner');

  // Use real-time unread count if available, otherwise fall back to prop
  const messagesUnread = realTimeUnread > 0 ? realTimeUnread : unreadMessages;

  useEffect(() => {
    loadPartnerAvatar();
  }, [partnerEmail]);

  const loadPartnerAvatar = async () => {
    if (!partnerEmail) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    if (currentUser) {
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: 'leads', label: 'Lead', icon: Users, badge: messagesUnread },
    { id: 'messages', label: 'Messaggi', icon: MessageSquare, badge: messagesUnread },
    { id: 'notifications', label: 'Notifiche', icon: Bell, badge: unreadNotifications },
    { id: 'settings', label: 'Profilo', icon: Settings, badge: 0 },
  ];

  const initials = partnerName
    ? partnerName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'P';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Same style as consumer app */}
      <header className="sticky top-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <img src={karicaLogo.src} alt="Karica" className="h-8 w-8 object-contain logo-hover" />
            <h1 className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent font-brand">
              Karica Partner
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Avatar
              className="h-8 w-8 cursor-pointer hover:ring-2 ring-primary transition-all"
              onClick={() => onTabChange('settings')}
            >
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>

      {/* Bottom Navigation - Same style as consumer app */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border/50 pb-safe">
        <div className="flex items-center justify-around px-1.5 py-1.5 max-w-screen-xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-spring hover:bg-primary/10 min-w-[56px] relative",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && "animate-scale-in")} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PartnerLayout;
