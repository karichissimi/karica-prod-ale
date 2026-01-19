import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Building2, 
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeadMessage {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

interface Lead {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  calculator_data: any;
  intervention_type?: {
    name: string;
    icon: string;
  };
  partner?: {
    company_name: string;
    contact_email: string;
    contact_phone: string;
  };
}

interface LeadDetailProps {
  leadId: string;
  onBack: () => void;
}

const LeadDetail = ({ leadId, onBack }: LeadDetailProps) => {
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLeadDetails();
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`lead-messages-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_messages',
          filter: `lead_id=eq.${leadId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as LeadMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadLeadDetails = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        intervention_types(name, icon),
        partners(company_name, contact_email, contact_phone)
      `)
      .eq('id', leadId)
      .single();

    if (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dettagli della lead',
        variant: 'destructive'
      });
      return;
    }

    setLead({
      ...data,
      intervention_type: data.intervention_types,
      partner: data.partners
    });
    setLoading(false);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('lead_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const { error } = await supabase
      .from('lead_messages')
      .insert({
        lead_id: leadId,
        message: newMessage.trim(),
        sender_type: 'user'
      });

    if (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile inviare il messaggio',
        variant: 'destructive'
      });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      new: { label: 'Nuova', color: 'bg-blue-500/10 text-blue-500', icon: <FileText className="h-3 w-3" /> },
      contacted: { label: 'Contattato', color: 'bg-yellow-500/10 text-yellow-500', icon: <MessageSquare className="h-3 w-3" /> },
      in_progress: { label: 'In corso', color: 'bg-primary/10 text-primary', icon: <Clock className="h-3 w-3" /> },
      quoted: { label: 'Preventivato', color: 'bg-secondary/10 text-secondary', icon: <FileText className="h-3 w-3" /> },
      completed: { label: 'Completato', color: 'bg-accent/10 text-accent', icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelled: { label: 'Annullato', color: 'bg-destructive/10 text-destructive', icon: <FileText className="h-3 w-3" /> }
    };
    return configs[status] || configs.new;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Lead non trovata</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(lead.status || 'new');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            {lead.intervention_type?.name || 'Intervento'}
          </h2>
          <p className="text-xs text-muted-foreground">
            Creata il {new Date(lead.created_at).toLocaleDateString('it-IT')}
          </p>
        </div>
        <Badge className={`${statusConfig.color} gap-1`}>
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </div>

      {/* Partner Info */}
      {lead.partner && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{lead.partner.company_name}</h3>
              <p className="text-xs text-muted-foreground">{lead.partner.contact_email}</p>
              {lead.partner.contact_phone && (
                <p className="text-xs text-muted-foreground">{lead.partner.contact_phone}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Timeline Status */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3">Stato Avanzamento</h3>
        <div className="flex items-center gap-2">
          {['new', 'contacted', 'in_progress', 'quoted', 'completed'].map((status, index) => {
            const config = getStatusConfig(status);
            const isActive = ['new', 'contacted', 'in_progress', 'quoted', 'completed'].indexOf(lead.status || 'new') >= index;
            return (
              <div key={status} className="flex items-center flex-1">
                <div className={`w-full h-1 rounded-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Nuova</span>
          <span>Contatto</span>
          <span>In corso</span>
          <span>Preventivo</span>
          <span>Completato</span>
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Messaggi
        </h3>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nessun messaggio ancora. Scrivi al partner per iniziare la conversazione.
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.sender_type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.sender_type === 'user' ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    <span className="text-[10px] opacity-80">
                      {msg.sender_type === 'user' ? 'Tu' : lead.partner?.company_name || 'Partner'}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(msg.created_at).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Scrivi un messaggio..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[60px] text-sm resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Notes */}
      {lead.notes && (
        <Card className="p-4">
          <h3 className="font-medium text-sm mb-2">Note</h3>
          <p className="text-sm text-muted-foreground">{lead.notes}</p>
        </Card>
      )}
    </div>
  );
};

export default LeadDetail;
