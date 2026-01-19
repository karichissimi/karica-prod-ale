import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Users, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'new_lead' | 'message' | 'status_change' | 'reminder';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  lead_id?: string;
}

interface PartnerNotificationsProps {
  leads: any[];
  onViewLead: (leadId: string) => void;
}

const PartnerNotifications = ({ leads, onViewLead }: PartnerNotificationsProps) => {
  // Generate notifications from leads
  const generateNotifications = (): Notification[] => {
    const notifications: Notification[] = [];
    
    leads.forEach(lead => {
      // New lead notification
      const leadDate = new Date(lead.created_at);
      const daysSinceCreation = Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceCreation < 7) {
        notifications.push({
          id: `new-${lead.id}`,
          type: 'new_lead',
          title: 'Nuova Lead Ricevuta',
          description: `${lead.profiles?.full_name || 'Un cliente'} ha richiesto ${lead.intervention_type?.name || 'un intervento'}`,
          timestamp: lead.created_at,
          read: daysSinceCreation > 1,
          lead_id: lead.id
        });
      }

      // Reminder for leads without action
      if (lead.status === 'new' && daysSinceCreation > 2) {
        notifications.push({
          id: `reminder-${lead.id}`,
          type: 'reminder',
          title: 'Promemoria Lead',
          description: `La lead di ${lead.profiles?.full_name || 'un cliente'} attende una risposta`,
          timestamp: new Date().toISOString(),
          read: false,
          lead_id: lead.id
        });
      }
    });

    return notifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const [notifications, setNotifications] = useState<Notification[]>(generateNotifications());

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'status_change':
        return <CheckCircle2 className="h-5 w-5 text-purple-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Notifiche</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutte lette'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Segna tutte come lette
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nessuna notifica</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 flex items-start gap-4 transition-colors",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="p-2 rounded-lg bg-muted shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{notification.title}</p>
                    {!notification.read && (
                      <Badge variant="default" className="text-xs">Nuova</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.timestamp).toLocaleDateString('it-IT', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {notification.lead_id && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => {
                          markAsRead(notification.id);
                          onViewLead(notification.lead_id!);
                        }}
                      >
                        Vedi Lead
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PartnerNotifications;
