import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Coins, 
  Download, 
  TrendingUp, 
  ShoppingCart, 
  Banknote, 
  Briefcase,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface Commission {
  id: string;
  source_type: string;
  source_id: string;
  amount: number;
  status: string;
  partner_id: string | null;
  description: string | null;
  created_at: string;
  invoiced_at: string | null;
  paid_at: string | null;
  partner?: {
    company_name: string;
  };
}

interface CommissionStats {
  total: number;
  pending: number;
  invoiced: number;
  paid: number;
  bySource: {
    order: number;
    loan: number;
    lead: number;
    intervention: number;
  };
}

const sourceTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  order: { label: 'Marketplace', icon: <ShoppingCart className="h-4 w-4" /> },
  loan: { label: 'Finanziamento', icon: <Banknote className="h-4 w-4" /> },
  lead: { label: 'Lead', icon: <Briefcase className="h-4 w-4" /> },
  intervention: { label: 'Intervento', icon: <TrendingUp className="h-4 w-4" /> },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  pending: { label: 'In Attesa', variant: 'outline' },
  invoiced: { label: 'Fatturata', variant: 'secondary' },
  paid: { label: 'Pagata', variant: 'default' },
};

export function CommissionsTab() {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats>({
    total: 0,
    pending: 0,
    invoiced: 0,
    paid: 0,
    bySource: { order: 0, loan: 0, lead: 0, intervention: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  useEffect(() => {
    loadCommissions();
  }, [filter, periodFilter]);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          partner:partners(company_name)
        `)
        .order('created_at', { ascending: false });

      // Apply source type filter
      if (filter !== 'all') {
        query = query.eq('source_type', filter);
      }

      // Apply period filter
      if (periodFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (periodFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommissions(data || []);

      // Calculate stats
      const allCommissions = data || [];
      const newStats: CommissionStats = {
        total: allCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        pending: allCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.amount || 0), 0),
        invoiced: allCommissions.filter(c => c.status === 'invoiced').reduce((sum, c) => sum + (c.amount || 0), 0),
        paid: allCommissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.amount || 0), 0),
        bySource: {
          order: allCommissions.filter(c => c.source_type === 'order').reduce((sum, c) => sum + (c.amount || 0), 0),
          loan: allCommissions.filter(c => c.source_type === 'loan').reduce((sum, c) => sum + (c.amount || 0), 0),
          lead: allCommissions.filter(c => c.source_type === 'lead').reduce((sum, c) => sum + (c.amount || 0), 0),
          intervention: allCommissions.filter(c => c.source_type === 'intervention').reduce((sum, c) => sum + (c.amount || 0), 0),
        },
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading commissions:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le commissioni.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Partner', 'Importo', 'Stato'];
    const rows = commissions.map(c => [
      new Date(c.created_at).toLocaleDateString('it-IT'),
      sourceTypeLabels[c.source_type]?.label || c.source_type,
      c.partner?.company_name || '-',
      c.amount.toFixed(2),
      statusLabels[c.status]?.label || c.status,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissioni_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export completato',
      description: 'Il file CSV è stato scaricato.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-xl font-bold">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Attesa</p>
                <p className="text-xl font-bold">{formatCurrency(stats.pending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fatturate</p>
                <p className="text-xl font-bold">{formatCurrency(stats.invoiced)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Coins className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagate</p>
                <p className="text-xl font-bold">{formatCurrency(stats.paid)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Source */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commissioni per Pilastro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Marketplace</p>
                <p className="font-semibold">{formatCurrency(stats.bySource.order)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Banknote className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-xs text-muted-foreground">Finanziamenti</p>
                <p className="font-semibold">{formatCurrency(stats.bySource.loan)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Briefcase className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Lead</p>
                <p className="font-semibold">{formatCurrency(stats.bySource.lead)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Interventi</p>
                <p className="font-semibold">{formatCurrency(stats.bySource.intervention)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Dettaglio Commissioni
              </CardTitle>
              <CardDescription>
                Tutte le fee maturate dalla piattaforma
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadCommissions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Esporta CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtra per tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="order">Marketplace</SelectItem>
                <SelectItem value="loan">Finanziamenti</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="intervention">Interventi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtra per periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i periodi</SelectItem>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Ultima settimana</SelectItem>
                <SelectItem value="month">Ultimo mese</SelectItem>
                <SelectItem value="year">Ultimo anno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna commissione trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="text-sm">
                        {new Date(commission.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {sourceTypeLabels[commission.source_type]?.icon}
                          <span className="text-sm">
                            {sourceTypeLabels[commission.source_type]?.label || commission.source_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {commission.partner?.company_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {commission.description || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(commission.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[commission.status]?.variant || 'outline'}>
                          {statusLabels[commission.status]?.label || commission.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
