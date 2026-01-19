import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Construction, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WipDisclaimerProps {
  storageKey: string;
  title?: string;
  description?: string;
}

export function WipDisclaimer({ 
  storageKey, 
  title = "Funzionalità in sviluppo",
  description = "I dati visualizzati sono puramente illustrativi. Questa sezione è attualmente in fase di sviluppo e sarà disponibile a breve con dati reali."
}: WipDisclaimerProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      // Small delay for better UX
      const timer = setTimeout(() => setOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(storageKey, 'true');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center space-y-4">
          {/* Animated Icon */}
          <div className="mx-auto relative">
            <div className="p-4 rounded-2xl bg-gradient-primary animate-pulse-soft">
              <Construction className="h-10 w-10 text-primary-foreground" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-bounce-soft" />
          </div>
          
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Don't show again checkbox */}
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Checkbox 
              id="dontShowAgain" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              className="data-[state=checked]:bg-primary"
            />
            <label 
              htmlFor="dontShowAgain" 
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Non mostrare più questo messaggio
            </label>
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleClose}
            className="w-full bg-gradient-primary hover:opacity-90 transition-all duration-300 text-primary-foreground font-semibold py-6"
          >
            Ho capito, continua
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
