import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Zap, Building2, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupplyData {
  pod: string | null;
  energy_supplier: string | null;
  annual_consumption_kwh: number | null;
}

interface SupplyCardProps {
  onUpdateBill?: () => void;
  className?: string;
}

export const SupplyCard = ({ onUpdateBill, className }: SupplyCardProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SupplyData | null>(null);

  useEffect(() => {
    if (user) {
      loadSupplyData();
    }
  }, [user]);

  const loadSupplyData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('pod, energy_supplier, annual_consumption_kwh')
      .eq('id', user.id)
      .single();

    if (!error && profile) {
      setData({
        pod: profile.pod,
        energy_supplier: profile.energy_supplier,
        annual_consumption_kwh: profile.annual_consumption_kwh,
      });
    }
    setLoading(false);
  };

  const hasData = data && (data.pod || data.energy_supplier || data.annual_consumption_kwh);

  if (loading) {
    return (
      <Card className={cn("p-5", className)}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className={cn("p-5 border-dashed", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">La Tua Fornitura</h3>
            <p className="text-xs text-muted-foreground">Dati non disponibili</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Carica una bolletta per visualizzare i dati della tua fornitura energetica.
        </p>
        {onUpdateBill && (
          <Button onClick={onUpdateBill} size="sm" className="w-full gap-2">
            <FileText className="h-4 w-4" />
            Carica Bolletta
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">La Tua Fornitura</h3>
            <p className="text-xs text-muted-foreground">Dati dalla bolletta</p>
          </div>
        </div>
        {onUpdateBill && (
          <Button 
            onClick={onUpdateBill} 
            size="icon" 
            variant="ghost"
            className="h-8 w-8"
            title="Aggiorna bolletta"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* POD */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">POD</span>
          </div>
          {data.pod ? (
            <Badge variant="outline" className="font-mono text-xs">
              {data.pod}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>

        {/* Supplier */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Fornitore</span>
          </div>
          {data.energy_supplier ? (
            <span className="text-sm font-medium">{data.energy_supplier}</span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>

        {/* Annual Consumption */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Consumo Annuo</span>
          </div>
          {data.annual_consumption_kwh ? (
            <span className="text-lg font-bold text-primary">
              {data.annual_consumption_kwh.toLocaleString('it-IT')} kWh
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SupplyCard;
