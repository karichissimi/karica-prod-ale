import { Card } from '@/components/ui/card';
import { 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp,
  Users,
  Euro
} from 'lucide-react';

interface DashboardStats {
  newLeads: number;
  inProgressLeads: number;
  completedLeads: number;
  totalLeads: number;
  unreadMessages: number;
  conversionRate: number;
}

interface PartnerDashboardProps {
  stats: DashboardStats;
  recentLeads: any[];
  onViewLead: (lead: any) => void;
}

const PartnerDashboard = ({ stats, recentLeads, onViewLead }: PartnerDashboardProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Panoramica delle tue attività</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nuove Lead</p>
              <p className="text-3xl font-bold">{stats.newLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <MessageSquare className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Lavorazione</p>
              <p className="text-3xl font-bold">{stats.inProgressLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completate</p>
              <p className="text-3xl font-bold">{stats.completedLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Totale Lead</p>
              <p className="text-3xl font-bold">{stats.totalLeads}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasso Conversione</p>
              <p className="text-3xl font-bold">{stats.conversionRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Euro className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Messaggi Non Letti</p>
              <p className="text-3xl font-bold">{stats.unreadMessages}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Lead Recenti</h3>
        {recentLeads.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nessuna lead ancora. Le nuove richieste appariranno qui.
          </p>
        ) : (
          <div className="space-y-3">
            {recentLeads.slice(0, 5).map((lead) => (
              <div 
                key={lead.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onViewLead(lead)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{lead.profiles?.full_name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">
                      {lead.intervention_type?.name || 'Intervento'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PartnerDashboard;
