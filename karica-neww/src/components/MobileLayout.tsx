"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav } from "@/components/BottomNav";
import { ParallaxBackground } from "@/components/ParallaxBackground";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLeadNotifications } from "@/hooks/useLeadNotifications";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import karicaLogo from '@/assets/karica-logo-2a.png';

// Search routes configuration
const SEARCH_ROUTES = [
  { keywords: ['cer', 'comunità', 'energia', 'rinnovabile', 'condivisione'], route: '/cer', label: 'CER', icon: '🔋' },
  { keywords: ['interventi', 'intervento', 'risparmio', 'caldaia', 'pompa', 'calore', 'infissi', 'cappotto', 'fotovoltaico', 'pannelli'], route: '/interventions', label: 'Interventi', icon: '🔧' },
  { keywords: ['shop', 'prodotti', 'acquisti', 'marketplace', 'negozio'], route: '/marketplace', label: 'Shop', icon: '🛒' },
  { keywords: ['punti', 'gamification', 'premi', 'badge', 'livello'], route: '/gamification', label: 'Punti', icon: '🏆' },
  { keywords: ['messaggi', 'richieste', 'assistenza', 'chat'], route: '/messages', label: 'Messaggi', icon: '💬' },
  { keywords: ['profilo', 'account', 'impostazioni', 'dati'], route: '/profile', label: 'Profilo', icon: '👤' },
  { keywords: ['monitoraggio', 'consumi', 'energia', 'bolletta'], route: '/monitoring', label: 'Monitoraggio', icon: '📊' },
  { keywords: ['finanziamenti', 'prestiti', 'credito', 'pagamenti'], route: '/finance', label: 'Finanziamenti', icon: '💳' },
  { keywords: ['home', 'casa', 'karica', 'dashboard'], route: '/', label: 'Home', icon: '🏠' },
];

interface MobileLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onRefresh?: () => Promise<void>;
}

export function MobileLayout({ children, showSearch = true, onRefresh }: MobileLayoutProps) {
  const router = useRouter(); // Renamed from navigate for clarity, but keeping usage compatible implies navigate(path) maps to router.push(path)
  const navigate = (path: string) => router.push(path); // Adapter for minimal code change

  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name?: string | null; avatar_url?: string | null }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { unreadCount } = useLeadNotifications('consumer');
  const { isCollapsed, isAtTop } = useScrollHeader({ collapseThreshold: 40 });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    };

    loadProfile();
  }, [user]);

  const initials = useMemo(() => {
    if (!profile.full_name) return "U";
    return profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profile.full_name]);

  // Get search suggestions based on query
  const searchSuggestions = useMemo(() => {
    if (searchQuery.length < 1) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return SEARCH_ROUTES.filter(route =>
      route.keywords.some(keyword => keyword.includes(lowerQuery) || lowerQuery.includes(keyword)) ||
      route.label.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectSuggestion = (route: string) => {
    navigate(route);
    setSearchQuery("");
    setIsSearchExpanded(false);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.length >= 2) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchedRoute = SEARCH_ROUTES.find(route =>
        route.keywords.some(keyword => keyword.includes(lowerQuery) || lowerQuery.includes(keyword))
      );

      if (matchedRoute) {
        navigate(matchedRoute.route);
        setSearchQuery("");
        setIsSearchExpanded(false);
      }
    }
  };

  const defaultRefresh = useCallback(async () => {
    // Default refresh - reload the page data
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.location.reload();
  }, []);

  const handleRefresh = onRefresh || defaultRefresh;

  return (
    <div className="flex flex-col h-[100dvh] animate-fade-in relative overflow-hidden">
      <ParallaxBackground />

      {/* Smart Header - with safe area support for notch/status bar */}
      <header
        className={cn(
          "sticky top-0 z-50 glass-premium border-b border-border/30 transition-all duration-300",
          isCollapsed && !isSearchExpanded ? "pb-1.5 pt-[max(0.375rem,env(safe-area-inset-top))]" : "pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]",
          !isAtTop && "shadow-lg"
        )}
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <div className="px-3">
          <div className="flex items-center gap-2">
            {/* Theme Toggle - shrinks when collapsed */}
            <div className={cn(
              "transition-all duration-300",
              isCollapsed && !isSearchExpanded && "scale-90"
            )}>
              <ThemeToggle />
            </div>

            {/* Search Area */}
            {showSearch ? (
              <div className={cn(
                "flex-1 transition-all duration-300 relative",
                isSearchExpanded && "absolute left-0 right-0 px-3 z-10 bg-background/95 backdrop-blur-xl py-2"
              )}>
                {isSearchExpanded ? (
                  <div className="animate-fade-in">
                    <div className="flex items-center gap-2">
                      <SearchBar
                        placeholder="Cerca su Karica..."
                        onSearch={handleSearch}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setIsSearchExpanded(false); setSearchQuery(""); }}
                        className="h-8 w-8 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {searchSuggestions.length > 0 && (
                      <Card className="absolute left-3 right-3 mt-2 z-50 p-1 shadow-xl">
                        {searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.route}
                            onClick={() => handleSelectSuggestion(suggestion.route)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                          >
                            <span className="text-lg">{suggestion.icon}</span>
                            <span className="font-medium">{suggestion.label}</span>
                          </button>
                        ))}
                      </Card>
                    )}
                  </div>
                ) : isCollapsed ? (
                  <div className="flex items-center justify-center gap-2">
                    <img
                      src={karicaLogo.src}
                      alt="Karica"
                      className="h-6 w-6 object-contain transition-all duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSearchExpanded(true)}
                      className="h-7 w-7 rounded-full ml-auto"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <SearchBar
                      placeholder="Cerca su Karica..."
                      onSearch={handleSearch}
                    />
                    {/* Search Suggestions Dropdown for non-expanded state */}
                    {searchSuggestions.length > 0 && searchQuery.length >= 1 && (
                      <Card className="absolute left-0 right-0 mt-2 z-50 p-1 shadow-xl">
                        {searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.route}
                            onClick={() => handleSelectSuggestion(suggestion.route)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                          >
                            <span className="text-lg">{suggestion.icon}</span>
                            <span className="font-medium">{suggestion.label}</span>
                          </button>
                        ))}
                      </Card>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-2">
                <img
                  src={karicaLogo.src}
                  alt="Karica"
                  className={cn(
                    "object-contain logo-hover transition-all duration-300",
                    isCollapsed ? "h-6 w-6" : "h-8 w-8"
                  )}
                />
                <h1 className={cn(
                  "font-semibold bg-gradient-primary bg-clip-text text-transparent font-brand transition-all duration-300",
                  isCollapsed ? "text-base" : "text-lg"
                )}>
                  Karica
                </h1>
              </div>
            )}

            {/* Action buttons */}
            {!isSearchExpanded && (
              <div className="flex items-center gap-1.5">
                {/* Messages button with notification badge */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/messages")}
                  className={cn(
                    "rounded-full transition-all duration-300 hover:bg-primary/10 relative",
                    isCollapsed ? "h-7 w-7" : "h-8 w-8"
                  )}
                >
                  <MessageSquare className={cn(
                    "text-primary transition-all duration-300",
                    isCollapsed ? "h-3.5 w-3.5" : "h-4 w-4"
                  )} />
                  {unreadCount > 0 && (
                    <span className={cn(
                      "absolute bg-destructive text-destructive-foreground font-bold flex items-center justify-center rounded-full animate-scale-in badge-pulse",
                      isCollapsed
                        ? "-top-0.5 -right-0.5 text-[8px] min-w-[14px] h-3.5"
                        : "-top-1 -right-1 text-[9px] min-w-[16px] h-4"
                    )}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Avatar with animated ring */}
                <div
                  className={cn(
                    "relative cursor-pointer transition-all duration-300 group",
                    isCollapsed ? "scale-90" : "scale-100"
                  )}
                  onClick={() => navigate("/profile")}
                >
                  {/* Animated gradient ring */}
                  <div className="absolute -inset-0.5 bg-gradient-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow" />

                  <Avatar className={cn(
                    "relative transition-all duration-300 border-2 border-background",
                    isCollapsed ? "h-7 w-7" : "h-8 w-8"
                  )}>
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        data-scroll-container
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PullToRefresh onRefresh={handleRefresh} className="min-h-full">
          <PageTransition>
            <main className="p-3 pb-20">
              {children}
            </main>
          </PageTransition>
        </PullToRefresh>
      </div>

      <BottomNav />
    </div>
  );
}
