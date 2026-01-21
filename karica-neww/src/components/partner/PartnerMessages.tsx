import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Send, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

interface Conversation {
  lead_id: string;
  client_name: string;
  client_email: string;
  intervention_type: string;
  last_message?: string;
  last_message_date?: string;
  unread: boolean;
}

interface PartnerMessagesProps {
  partnerId: string;
  leads: any[];
}

const PartnerMessages = ({ partnerId, leads }: PartnerMessagesProps) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Build conversations from leads
    const convs: Conversation[] = leads.map(lead => ({
      lead_id: lead.id,
      client_name: lead.profiles?.full_name || 'Cliente',
      client_email: lead.profiles?.email || '',
      intervention_type: lead.intervention_type?.name || 'Intervento',
      unread: false
    }));
    setConversations(convs);
  }, [leads]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (leadId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({
        ...m,
        created_at: m.created_at || new Date().toISOString()
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('lead_messages')
        .insert({
          lead_id: selectedConversation,
          message: newMessage.trim(),
          sender_type: 'partner'
        });

      if (error) throw error;

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: newMessage.trim(),
        sender_type: 'partner',
        created_at: new Date().toISOString()
      }]);
      setNewMessage('');

      toast({
        title: 'Messaggio inviato',
        description: 'Il cliente riceverà una notifica',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile inviare il messaggio',
        variant: 'destructive',
      });
    }
  };

  const selectedConv = conversations.find(c => c.lead_id === selectedConversation);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Messaggi</h2>
        <p className="text-muted-foreground">Comunica con i tuoi clienti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Conversations List */}
        <Card className={cn(
          "lg:col-span-1 flex flex-col",
          selectedConversation && "hidden lg:flex"
        )}>
          <div className="p-4 border-b">
            <h3 className="font-semibold">Conversazioni</h3>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nessuna conversazione
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.lead_id}
                    onClick={() => setSelectedConversation(conv.lead_id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                      selectedConversation === conv.lead_id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conv.client_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.intervention_type}
                      </p>
                    </div>
                    {conv.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={cn(
          "lg:col-span-2 flex flex-col",
          !selectedConversation && "hidden lg:flex"
        )}>
          {selectedConversation && selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{selectedConv.client_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedConv.intervention_type}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Caricamento...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nessun messaggio. Inizia la conversazione!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender_type === 'partner' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2",
                            msg.sender_type === 'partner'
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          <p>{msg.message}</p>
                          <p className={cn(
                            "text-xs mt-1",
                            msg.sender_type === 'partner'
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}>
                            {new Date(msg.created_at).toLocaleTimeString('it-IT', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Seleziona una conversazione per iniziare
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PartnerMessages;
