"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, XCircle, MessageSquare, User, Home } from "lucide-react";
import PartnerLayout from "@/components/partner/PartnerLayout";
import PartnerDashboard from "@/components/partner/PartnerDashboard";
import PartnerMessages from "@/components/partner/PartnerMessages";
import PartnerNotifications from "@/components/partner/PartnerNotifications";
import PartnerSettings from "@/components/partner/PartnerSettings";

interface Lead {
    id: string;
    created_at: string;
    status: string;
    notes: string;
    user_id: string;
    intervention_type: {
        name: string;
        description: string;
    };
    profiles: {
        full_name: string;
        email: string;
        phone: string;
        address: string;
    };
}

const PartnerCRM = () => {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState('dashboard');
    const [partnerId, setPartnerId] = useState<string>('');
    const [partnerName, setPartnerName] = useState<string>('');
    const [partnerEmail, setPartnerEmail] = useState<string>('');

    useEffect(() => {
        initializePartner();
    }, []);

    const initializePartner = async () => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = sessionData?.session?.user;

            if (!currentUser) {
                setLoading(false);
                return;
            }

            setPartnerEmail(currentUser.email || '');

            // Get partner info
            const { data: partnerData } = await supabase
                .from('partners')
                .select('id, company_name')
                .eq('contact_email', currentUser.email)
                .maybeSingle();

            if (partnerData) {
                setPartnerId(partnerData.id);
                setPartnerName(partnerData.company_name);
            }

            loadLeads();
        } catch (error) {
            console.error('Error initializing partner:', error);
            setLoading(false);
        }
    };

    const loadLeads = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;

        if (!currentUser) return;

        setLoading(true);
        try {
            const { data: partnerData } = await supabase
                .from('partners')
                .select('id')
                .eq('contact_email', currentUser.email)
                .maybeSingle();

            if (!partnerData) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('leads')
                .select(`
          *,
          intervention_type:intervention_types(name, description)
        `)
                .eq('partner_id', partnerData.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const leadsWithProfiles = await Promise.all(
                (data || []).map(async (lead: any) => {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, email, phone, address')
                        .eq('id', lead.user_id)
                        .maybeSingle();

                    return {
                        ...lead,
                        profiles: profileData || { full_name: 'N/A', email: 'N/A', phone: null, address: null }
                    };
                })
            );

            setLeads(leadsWithProfiles as any || []);
        } catch (error) {
            console.error("Error loading leads:", error);
            toast({
                title: "Errore",
                description: "Impossibile caricare le lead",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            new: { variant: "outline", icon: Clock, label: "Nuova" },
            contacted: { variant: "secondary", icon: MessageSquare, label: "Contattata" },
            in_progress: { variant: "default", icon: Clock, label: "In Corso" },
            completed: { variant: "default", icon: CheckCircle2, label: "Completata" },
            cancelled: { variant: "destructive", icon: XCircle, label: "Annullata" },
        };

        const config = variants[status] || variants.new;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="gap-1">
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setNewStatus(lead.status);
        setDialogOpen(true);
    };

    const handleViewLeadFromNotification = (leadId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            handleLeadClick(lead);
        }
        setActiveTab('leads');
    };

    const handleStatusUpdate = async () => {
        if (!selectedLead) return;

        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData?.session?.user;

        try {
            const { error } = await supabase
                .from("leads")
                .update({ status: newStatus })
                .eq("id", selectedLead.id);

            if (error) throw error;

            if (message.trim() && currentUser) {
                await supabase.from("lead_messages").insert({
                    lead_id: selectedLead.id,
                    message: message,
                    sender_type: 'partner'
                });
            }

            toast({
                title: "Lead Aggiornata",
                description: "Lo stato della lead è stato aggiornato con successo",
            });

            setDialogOpen(false);
            loadLeads();
            setMessage("");
        } catch (error) {
            console.error("Error updating lead:", error);
            toast({
                title: "Errore",
                description: "Impossibile aggiornare la lead",
                variant: "destructive",
            });
        }
    };

    const filterLeadsByStatus = (status?: string) => {
        if (!status) return leads;
        return leads.filter((lead) => lead.status === status);
    };

    // Calculate stats
    const stats = {
        newLeads: filterLeadsByStatus('new').length,
        inProgressLeads: filterLeadsByStatus('in_progress').length,
        completedLeads: filterLeadsByStatus('completed').length,
        totalLeads: leads.length,
        unreadMessages: 0,
        conversionRate: leads.length > 0
            ? Math.round((filterLeadsByStatus('completed').length / leads.length) * 100)
            : 0
    };

    // Show loading while loading data
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Caricamento...</p>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <PartnerDashboard
                        stats={stats}
                        recentLeads={leads}
                        onViewLead={handleLeadClick}
                    />
                );
            case 'leads':
                return (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold">Lead</h2>
                            <p className="text-muted-foreground">Gestisci le richieste dei clienti</p>
                        </div>

                        <Tabs defaultValue="all" className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="all">Tutte ({leads.length})</TabsTrigger>
                                <TabsTrigger value="new">Nuove ({filterLeadsByStatus("new").length})</TabsTrigger>
                                <TabsTrigger value="in_progress">In Corso ({filterLeadsByStatus("in_progress").length})</TabsTrigger>
                                <TabsTrigger value="completed">Completate ({filterLeadsByStatus("completed").length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all">
                                <LeadsTable leads={leads} onLeadClick={handleLeadClick} getStatusBadge={getStatusBadge} />
                            </TabsContent>
                            <TabsContent value="new">
                                <LeadsTable leads={filterLeadsByStatus("new")} onLeadClick={handleLeadClick} getStatusBadge={getStatusBadge} />
                            </TabsContent>
                            <TabsContent value="in_progress">
                                <LeadsTable leads={filterLeadsByStatus("in_progress")} onLeadClick={handleLeadClick} getStatusBadge={getStatusBadge} />
                            </TabsContent>
                            <TabsContent value="completed">
                                <LeadsTable leads={filterLeadsByStatus("completed")} onLeadClick={handleLeadClick} getStatusBadge={getStatusBadge} />
                            </TabsContent>
                        </Tabs>
                    </div>
                );
            case 'messages':
                return <PartnerMessages partnerId={partnerId} leads={leads} />;
            case 'notifications':
                return <PartnerNotifications leads={leads} onViewLead={handleViewLeadFromNotification} />;
            case 'settings':
                return <PartnerSettings partnerId={partnerId} partnerEmail={partnerEmail} onAvatarUpdate={() => window.location.reload()} />;
            default:
                return null;
        }
    };

    return (
        <PartnerLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadMessages={0}
            unreadNotifications={leads.filter(l => l.status === 'new').length}
            partnerName={partnerName}
            partnerEmail={partnerEmail}
        >
            {renderContent()}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Dettagli Lead</DialogTitle>
                    </DialogHeader>

                    {selectedLead && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Cliente</Label>
                                    <p className="font-medium flex items-center gap-2 mt-1">
                                        <User className="h-4 w-4" />
                                        {selectedLead.profiles?.full_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Intervento</Label>
                                    <p className="font-medium flex items-center gap-2 mt-1">
                                        <Home className="h-4 w-4" />
                                        {selectedLead.intervention_type?.name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium mt-1">{selectedLead.profiles?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Telefono</Label>
                                    <p className="font-medium mt-1">{selectedLead.profiles?.phone || "Non fornito"}</p>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">Indirizzo</Label>
                                    <p className="font-medium mt-1">{selectedLead.profiles?.address || "Non fornito"}</p>
                                </div>
                            </div>

                            {selectedLead.notes && (
                                <div>
                                    <Label className="text-muted-foreground">Note Cliente</Label>
                                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedLead.notes}</p>
                                </div>
                            )}

                            <div>
                                <Label htmlFor="status">Stato Lead</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Nuova</SelectItem>
                                        <SelectItem value="contacted">Contattata</SelectItem>
                                        <SelectItem value="in_progress">In Corso</SelectItem>
                                        <SelectItem value="completed">Completata</SelectItem>
                                        <SelectItem value="cancelled">Annullata</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="message">Aggiungi Messaggio (opzionale)</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Aggiungi note o aggiornamenti..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="mt-2"
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Annulla
                                </Button>
                                <Button onClick={handleStatusUpdate}>
                                    Salva Modifiche
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </PartnerLayout>
    );
};

interface LeadsTableProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    getStatusBadge: (status: string) => JSX.Element;
}

function LeadsTable({ leads, onLeadClick, getStatusBadge }: LeadsTableProps) {
    if (leads.length === 0) {
        return (
            <Card className="p-12 text-center">
                <p className="text-muted-foreground">Nessuna lead trovata</p>
            </Card>
        );
    }

    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Intervento</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Azioni</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell>
                                <div>
                                    <div className="font-medium">{lead.profiles?.full_name || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">{lead.profiles?.email || 'N/A'}</div>
                                </div>
                            </TableCell>
                            <TableCell>{lead.intervention_type?.name || 'N/A'}</TableCell>
                            <TableCell>{new Date(lead.created_at).toLocaleDateString("it-IT")}</TableCell>
                            <TableCell>{getStatusBadge(lead.status)}</TableCell>
                            <TableCell>
                                <Button size="sm" variant="outline" onClick={() => onLeadClick(lead)}>
                                    Dettagli
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}

export default PartnerCRM;
