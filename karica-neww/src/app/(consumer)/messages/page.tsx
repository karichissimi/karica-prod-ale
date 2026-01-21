"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, HelpCircle, Zap, Send, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LeadDetail from "@/components/consumer/LeadDetail";

interface Lead {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
    intervention_type?: {
        name: string;
        icon: string;
    };
    partner?: {
        company_name: string;
    };
    lastMessage?: string;
    unreadCount?: number;
}

const Messages = () => {
    const { toast } = useToast();
    const [assistanceMessage, setAssistanceMessage] = useState("");
    const [assistanceSubject, setAssistanceSubject] = useState("");
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) return;

        const { data: leadsData, error } = await supabase
            .from('leads')
            .select(`
        id,
        status,
        created_at,
        updated_at,
        intervention_types(name, icon),
        partners(company_name)
      `)
            .eq('user_id', session.session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error loading leads:', error);
            setLoading(false);
            return;
        }

        // Get last message for each lead
        const leadsWithMessages = await Promise.all(
            (leadsData || []).map(async (lead) => {
                const { data: messages } = await supabase
                    .from('lead_messages')
                    .select('message, sender_type, created_at')
                    .eq('lead_id', lead.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...lead,
                    status: lead.status || 'new',
                    created_at: lead.created_at || new Date().toISOString(),
                    updated_at: lead.updated_at || new Date().toISOString(),
                    intervention_type: lead.intervention_types ? {
                        name: lead.intervention_types.name,
                        icon: lead.intervention_types.icon || ''
                    } : undefined,
                    partner: lead.partners || undefined,
                    lastMessage: messages?.[0]?.message || undefined,
                    unreadCount: 0
                };
            })
        );

        setLeads(leadsWithMessages);
        setLoading(false);
    };

    const handleSendAssistance = () => {
        if (!assistanceSubject.trim() || !assistanceMessage.trim()) {
            toast({
                title: "Campi obbligatori",
                description: "Compila oggetto e messaggio",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Richiesta inviata",
            description: "Ti risponderemo entro 24 ore",
        });

        setAssistanceSubject("");
        setAssistanceMessage("");
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            new: "Nuova",
            contacted: "Contattato",
            in_progress: "In corso",
            quoted: "Preventivato",
            completed: "Completato",
            cancelled: "Annullato",
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: "bg-blue-500/10 text-blue-500",
            contacted: "bg-yellow-500/10 text-yellow-500",
            in_progress: "bg-primary/10 text-primary",
            quoted: "bg-secondary/10 text-secondary",
            completed: "bg-accent/10 text-accent",
            cancelled: "bg-destructive/10 text-destructive",
        };
        return colors[status] || "bg-muted text-muted-foreground";
    };

    // If a lead is selected, show the detail view
    if (selectedLeadId) {
        return (
            <LeadDetail
                leadId={selectedLeadId}
                onBack={() => {
                    setSelectedLeadId(null);
                    loadLeads(); // Refresh leads when coming back
                }}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold mb-1">Messaggi</h2>
                <p className="text-sm text-muted-foreground">
                    Assistenza e comunicazioni interventi
                </p>
            </div>

            <Tabs defaultValue="leads" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                    <TabsTrigger value="leads" className="text-sm">
                        <Zap className="h-3.5 w-3.5 mr-1.5" />
                        I miei Interventi
                    </TabsTrigger>
                    <TabsTrigger value="assistance" className="text-sm">
                        <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                        Assistenza
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leads" className="space-y-3 mt-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : leads.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Zap className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Nessuna richiesta di intervento inviata
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Vai alla sezione Interventi per richiedere un preventivo
                            </p>
                        </Card>
                    ) : (
                        leads.map((lead) => (
                            <Card
                                key={lead.id}
                                className="p-3.5 transition-all hover:shadow-md cursor-pointer active:scale-[0.98]"
                                onClick={() => setSelectedLeadId(lead.id)}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-sm">
                                                    {lead.intervention_type?.name || 'Intervento'}
                                                </h3>
                                            </div>
                                            {lead.partner && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Building2 className="h-3 w-3" />
                                                    {lead.partner.company_name}
                                                </div>
                                            )}
                                        </div>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
                                                lead.status || 'new'
                                            )}`}
                                        >
                                            {getStatusLabel(lead.status || 'new')}
                                        </span>
                                    </div>

                                    {lead.lastMessage && (
                                        <p className="text-xs text-foreground/80 line-clamp-2">
                                            {lead.lastMessage}
                                        </p>
                                    )}

                                    <p className="text-[10px] text-muted-foreground">
                                        {new Date(lead.updated_at || lead.created_at).toLocaleDateString("it-IT", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="assistance" className="space-y-3 mt-3">
                    <Card className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">Richiedi Assistenza</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Il nostro team ti risponderà entro 24 ore
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="space-y-1">
                                    <Label htmlFor="subject" className="text-xs">Oggetto</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Descrivi brevemente il problema"
                                        value={assistanceSubject}
                                        onChange={(e) => setAssistanceSubject(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="message" className="text-xs">Messaggio</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Descrivi il problema in dettaglio..."
                                        value={assistanceMessage}
                                        onChange={(e) => setAssistanceMessage(e.target.value)}
                                        className="min-h-[100px] text-sm resize-none"
                                    />
                                </div>

                                <Button
                                    onClick={handleSendAssistance}
                                    className="w-full h-9 text-sm"
                                >
                                    <Send className="h-3.5 w-3.5 mr-1.5" />
                                    Invia Richiesta
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Messages;
