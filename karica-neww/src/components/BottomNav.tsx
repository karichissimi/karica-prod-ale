import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Users,
  ShoppingCart,
  Wrench,
  Zap
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import StaticLogo from "@/components/StaticLogo";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Karica", url: "/", icon: null, isCustom: true },
  { title: "CER", url: "/cer", icon: Users, iconActive: Users },
  { title: "Upgrade", url: "/interventions", icon: Wrench, iconActive: Wrench },
  { title: "Consumi", url: "/utilities", icon: Zap, iconActive: Zap },
  { title: "Shop", url: "/marketplace", icon: ShoppingCart, iconActive: ShoppingCart },
];

export function BottomNav() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Update active index based on pathname
  useEffect(() => {
    const index = navItems.findIndex(item => {
      if (item.url === '/') {
        return pathname === '/';
      }
      return pathname.startsWith(item.url);
    });

    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [pathname]);

  // Update indicator position based on active item
  useEffect(() => {
    if (navRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const items = navRef.current?.querySelectorAll('[data-nav-item]');
        const activeItem = items?.[activeIndex] as HTMLElement;

        if (activeItem) {
          const navRect = navRef.current?.getBoundingClientRect();
          const itemRect = activeItem.getBoundingClientRect();

          if (navRect) {
            setIndicatorStyle({
              left: itemRect.left - navRect.left + (itemRect.width / 2) - 20,
              width: 40,
            });
          }
        }
      }, 50);
    }
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong pb-[env(safe-area-inset-bottom,0px)]">
      {/* Animated indicator */}
      <div
        className="absolute top-0 h-0.5 bg-gradient-primary rounded-full transition-all duration-300 ease-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          transform: 'translateY(-50%)',
        }}
      />

      {/* Glow effect for indicator */}
      <div
        className="absolute top-0 h-2 rounded-full transition-all duration-300 ease-out blur-sm opacity-50"
        style={{
          left: indicatorStyle.left - 5,
          width: indicatorStyle.width + 10,
          background: 'var(--gradient-primary)',
        }}
      />

      <div
        ref={navRef}
        className="flex items-center justify-around px-1.5 py-2 max-w-screen-xl mx-auto"
      >
        {navItems.map((item, index) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            data-nav-item
            onClick={() => setActiveIndex(index)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] group"
            activeClassName="text-primary"
          >
            {({ isActive }) => {
              const IconComponent = isActive && item.iconActive ? item.iconActive : item.icon;

              return (
                <>
                  <div className={cn(
                    "relative transition-all duration-300",
                    isActive && "scale-110"
                  )}>
                    {item.isCustom ? (
                      <div className={cn(
                        "relative",
                        isActive && "animate-bounce-soft"
                      )}>
                        <StaticLogo
                          className={cn(
                            "h-7 w-7 transition-all duration-300",
                            isActive && "drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
                          )}
                        />
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse-soft" />
                        )}
                      </div>
                    ) : (
                      IconComponent && (
                        <div className="relative">
                          <IconComponent
                            className={cn(
                              "h-5 w-5 transition-all duration-300",
                              isActive
                                ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                                : "text-muted-foreground group-hover:text-foreground"
                            )}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm animate-glow-pulse" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.title}
                  </span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
