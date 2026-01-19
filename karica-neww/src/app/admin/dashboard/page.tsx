"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CommissionsTab } from '@/components/admin/CommissionsTab';
import {
    LogOut,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    Building2,
    Mail,
    Phone,
    RefreshCw,
    Star,
    Eye,
    EyeOff,
    Briefcase,
    UserPlus,
    Coins,
    Store,
    Wrench,
    Filter
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import karicaLogo from '@/assets/karica-logo-2a.png';

type PartnerType = 'cer_president' | 'intervention' | 'marketplace';

interface PartnerRequest {
    id: string;
    user_id: string;
    company_name: string;
    contact_email: string;
    contact_phone: string | null;
    description: string | null;
    intervention_types: string[];
    partner_type: PartnerType;
    status: string;
    created_at: string;
}

interface Partner {
    id: string;
    company_name: string;
    contact_email: string;
    contact_phone: string | null;
    description: string | null;
    partner_type: PartnerType;
    is_active: boolean;
    rating: number | null;
    created_at: string;
    specializations: string[];
}

interface InterventionType {
    id: string;
    name: string;
}

export default function AdminPanel() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [requests, setRequests] = useState<PartnerRequest[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('partners');
    const [partnerTypeFilter, setPartnerTypeFilter] = useState<PartnerType | 'all'>('all');
    const [requestTypeFilter, setRequestTypeFilter] = useState<PartnerType | 'all'>('all');
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        requestId: string;
        action: 'approve' | 'reject';
        companyName: string;
    } | null>(null);
    const [toggleDialog, setToggleDialog] = useState<{
        open: boolean;
        partnerId: string;
        companyName: string;
        currentStatus: boolean;
    } | null>(null);

    useEffect(() => {
        checkAdminAndLoad();
    }, [user]);

    const checkAdminAndLoad = async () => {
        if (!user) {
            router.push('/admin/auth');
            return;
        }

        const { data: hasAdminRole } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
        });

        if (!hasAdminRole) {
            toast({
                title: 'Accesso negato',
                description: 'Non hai i permessi di amministratore.',
                variant: 'destructive',
            });
            await supabase.auth.signOut();
            router.push('/admin/auth');
            return;
        }

        setIsAdmin(true);
        await loadData();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            // Load partner requests
            const { data: requestsData, error: requestsError } = await supabase
                .from('partner_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (requestsError) throw requestsError;
            setRequests(requestsData || []);

            // Load intervention types
            const { data: typesData } = await supabase
                .from('intervention_types')
                .select('id, name');

            setInterventionTypes(typesData || []);

            // Load existing partners with their specializations
            const { data: partnersData, error: partnersError } = await supabase
                .from('partners')
                .select('*')
                .order('company_name');

            if (partnersError) throw partnersError;

            // Load specializations for each partner
            const partnersWithSpecs = await Promise.all(
                (partnersData || []).map(async (partner) => {
                    const { data: specsData } = await supabase
                        .from('partner_specializations')
                        .select('intervention_type_id')
                        .eq('partner_id', partner.id);

                    return {
                        ...partner,
                        specializations: specsData?.map(s => s.intervention_type_id) || []
                    };
                })
            );

            setPartners(partnersWithSpecs);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile caricare i dati.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessing(requestId);
        setConfirmDialog(null);

        try {
            const response = await supabase.functions.invoke('approve-partner', {
                body: { requestId, action },
            });

            if (response.error) throw response.error;

            toast({
                title: action === 'approve' ? 'Partner approvato' : 'Richiesta rifiutata',
                description: action === 'approve'
                    ? 'Il partner può ora accedere alla piattaforma.'
                    : 'La richiesta è stata rifiutata.',
            });

            await loadData();
        } catch (error) {
            console.error('Error processing request:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile elaborare la richiesta.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleTogglePartner = async (partnerId: string, newStatus: boolean) => {
        setProcessing(partnerId);
        setToggleDialog(null);

        try {
            const { error } = await supabase
                .from('partners')
                .update({ is_active: newStatus })
                .eq('id', partnerId);

            if (error) throw error;

            toast({
                title: newStatus ? 'Partner attivato' : 'Partner disattivato',
                description: newStatus
                    ? 'Il partner è ora visibile ai consumatori.'
                    : 'Il partner non è più visibile ai consumatori.',
            });

            await loadData();
        } catch (error) {
            console.error('Error toggling partner:', error);
            toast({
                title: 'Errore',
                description: 'Impossibile aggiornare lo stato del partner.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/auth');
    };

    const getInterventionNames = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'Nessuna';
        return ids
            .map(id => interventionTypes.find(t => t.id === id)?.name)
            .filter(Boolean)
            .join(', ') || 'Nessuna';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />In attesa</Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approvato</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rifiutato</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPartnerTypeBadge = (type: PartnerType) => {
        switch (type) {
            case 'cer_president':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><Users className="h-3 w-3 mr-1" />CER</Badge>;
            case 'intervention':
                return <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30"><Wrench className="h-3 w-3 mr-1" />Interventi</Badge>;
            case 'marketplace':
                return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30"><Store className="h-3 w-3 mr-1" />Marketplace</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const getPartnerTypeLabel = (type: PartnerType) => {
        switch (type) {
            case 'cer_president': return 'Presidente CER';
            case 'intervention': return 'Partner Interventi';
            case 'marketplace': return 'Partner Marketplace';
            default: return type;
        }
    };

    // Filtered lists
    const filteredPartners = partnerTypeFilter === 'all'
        ? partners
        : partners.filter(p => p.partner_type === partnerTypeFilter);

    const filteredRequests = requestTypeFilter === 'all'
        ? requests
        : requests.filter(r => r.partner_type === requestTypeFilter);

    const pendingCount = filteredRequests.filter(r => r.status === 'pending').length;
    const activePartnersCount = filteredPartners.filter(p => p.is_active).length;
    const inactivePartnersCount = filteredPartners.filter(p => !p.is_active).length;

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={karicaLogo.src} alt="Karica" className="h-10 w-10 object-contain logo-hover" />
                        <div>
                            <h1 className="text-lg font-semibold"><span className="font-brand">Karica</span> Admin</h1>
                            <p className="text-sm text-muted-foreground">Pannello di amministrazione</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Esci
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                    <Briefcase className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Partner Attivi</p>
                                    <p className="text-2xl font-bold">{activePartnersCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                                    <EyeOff className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Partner Inattivi</p>
                                    <p className="text-2xl font-bold">{inactivePartnersCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Richieste Pendenti</p>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                                    <Users className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Totale Partner</p>
                                    <p className="text-2xl font-bold">{partners.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="partners" className="gap-2">
                                <Briefcase className="h-4 w-4" />
                                Partner
                                <Badge variant="secondary" className="ml-1">{partners.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="gap-2">
                                <UserPlus className="h-4 w-4" />
                                Richieste
                                {pendingCount > 0 && (
                                    <Badge className="ml-1 bg-yellow-500 text-yellow-950">{pendingCount}</Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="commissions" className="gap-2">
                                <Coins className="h-4 w-4" />
                                Commissioni
                            </TabsTrigger>
                        </TabsList>
                        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Aggiorna
                        </Button>
                    </div>

                    {/* Partners Tab */}
                    <TabsContent value="partners">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="h-5 w-5" />
                                            Gestione Partner
                                        </CardTitle>
                                        <CardDescription>
                                            Visualizza e gestisci tutti i partner registrati. Puoi attivarli o disattivarli.
                                        </CardDescription>
                                    </div>
                                    <Select value={partnerTypeFilter} onValueChange={(v) => setPartnerTypeFilter(v as PartnerType | 'all')}>
                                        <SelectTrigger className="w-[180px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Filtra per tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tutti i tipi</SelectItem>
                                            <SelectItem value="cer_president">Presidente CER</SelectItem>
                                            <SelectItem value="intervention">Partner Interventi</SelectItem>
                                            <SelectItem value="marketplace">Partner Marketplace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
                                    </div>
                                ) : filteredPartners.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>{partnerTypeFilter === 'all' ? 'Nessun partner registrato' : `Nessun partner di tipo "${getPartnerTypeLabel(partnerTypeFilter)}"`}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Stato</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Azienda</TableHead>
                                                    <TableHead>Contatti</TableHead>
                                                    <TableHead>Specializzazioni</TableHead>
                                                    <TableHead>Rating</TableHead>
                                                    <TableHead>Registrato</TableHead>
                                                    <TableHead className="text-right">Visibilità</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPartners.map((partner) => (
                                                    <TableRow key={partner.id} className={!partner.is_active ? 'opacity-60' : ''}>
                                                        <TableCell>
                                                            {partner.is_active ? (
                                                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                                                                    <Eye className="h-3 w-3 mr-1" />
                                                                    Attivo
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">
                                                                    <EyeOff className="h-3 w-3 mr-1" />
                                                                    Nascosto
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getPartnerTypeBadge(partner.partner_type)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <p className="font-medium">{partner.company_name}</p>
                                                                    {partner.description && (
                                                                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                                                            {partner.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Mail className="h-3 w-3" />
                                                                    {partner.contact_email}
                                                                </div>
                                                                {partner.contact_phone && (
                                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                        <Phone className="h-3 w-3" />
                                                                        {partner.contact_phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px]">
                                                            <p className="text-sm line-clamp-2">
                                                                {getInterventionNames(partner.specializations)}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                                <span>{partner.rating?.toFixed(1) || '0.0'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(partner.created_at).toLocaleDateString('it-IT', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Switch
                                                                checked={partner.is_active}
                                                                disabled={processing === partner.id}
                                                                onCheckedChange={() => setToggleDialog({
                                                                    open: true,
                                                                    partnerId: partner.id,
                                                                    companyName: partner.company_name,
                                                                    currentStatus: partner.is_active,
                                                                })}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Requests Tab */}
                    <TabsContent value="requests">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <UserPlus className="h-5 w-5" />
                                            Richieste di Registrazione
                                        </CardTitle>
                                        <CardDescription>
                                            Approva o rifiuta le nuove richieste di registrazione partner
                                        </CardDescription>
                                    </div>
                                    <Select value={requestTypeFilter} onValueChange={(v) => setRequestTypeFilter(v as PartnerType | 'all')}>
                                        <SelectTrigger className="w-[180px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Filtra per tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tutti i tipi</SelectItem>
                                            <SelectItem value="cer_president">Presidente CER</SelectItem>
                                            <SelectItem value="intervention">Partner Interventi</SelectItem>
                                            <SelectItem value="marketplace">Partner Marketplace</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
                                    </div>
                                ) : filteredRequests.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>{requestTypeFilter === 'all' ? 'Nessuna richiesta di registrazione' : `Nessuna richiesta di tipo "${getPartnerTypeLabel(requestTypeFilter)}"`}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Azienda</TableHead>
                                                    <TableHead>Contatti</TableHead>
                                                    <TableHead>Specializzazioni</TableHead>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Stato</TableHead>
                                                    <TableHead className="text-right">Azioni</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredRequests.map((request) => (
                                                    <TableRow key={request.id}>
                                                        <TableCell>
                                                            {getPartnerTypeBadge(request.partner_type)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                                <div>
                                                                    <p className="font-medium">{request.company_name}</p>
                                                                    {request.description && (
                                                                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                                                                            {request.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Mail className="h-3 w-3" />
                                                                    {request.contact_email}
                                                                </div>
                                                                {request.contact_phone && (
                                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                        <Phone className="h-3 w-3" />
                                                                        {request.contact_phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px]">
                                                            <p className="text-sm line-clamp-2">
                                                                {getInterventionNames(request.intervention_types)}
                                                            </p>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(request.created_at).toLocaleDateString('it-IT', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                                        <TableCell className="text-right">
                                                            {request.status === 'pending' && (
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="text-green-600 hover:bg-green-500/10"
                                                                        disabled={processing === request.id}
                                                                        onClick={() => setConfirmDialog({
                                                                            open: true,
                                                                            requestId: request.id,
                                                                            action: 'approve',
                                                                            companyName: request.company_name,
                                                                        })}
                                                                    >
                                                                        {processing === request.id ? (
                                                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="text-red-600 hover:bg-red-500/10"
                                                                        disabled={processing === request.id}
                                                                        onClick={() => setConfirmDialog({
                                                                            open: true,
                                                                            requestId: request.id,
                                                                            action: 'reject',
                                                                            companyName: request.company_name,
                                                                        })}
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Commissions Tab */}
                    <TabsContent value="commissions">
                        <CommissionsTab />
                    </TabsContent>
                </Tabs>
            </main>

            {/* Confirmation Dialog for Requests */}
            <AlertDialog
                open={confirmDialog?.open || false}
                onOpenChange={(open) => !open && setConfirmDialog(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog?.action === 'approve' ? 'Approva Partner' : 'Rifiuta Richiesta'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog?.action === 'approve'
                                ? `Sei sicuro di voler approvare "${confirmDialog?.companyName}"? Il partner potrà accedere alla piattaforma.`
                                : `Sei sicuro di voler rifiutare la richiesta di "${confirmDialog?.companyName}"?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            className={confirmDialog?.action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                            }
                            onClick={() => confirmDialog && handleAction(confirmDialog.requestId, confirmDialog.action)}
                        >
                            {confirmDialog?.action === 'approve' ? 'Approva' : 'Rifiuta'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Toggle Dialog for Partners */}
            <AlertDialog
                open={toggleDialog?.open || false}
                onOpenChange={(open) => !open && setToggleDialog(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {toggleDialog?.currentStatus ? 'Disattiva Partner' : 'Attiva Partner'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {toggleDialog?.currentStatus
                                ? `Sei sicuro di voler disattivare "${toggleDialog?.companyName}"? Il partner non sarà più visibile ai consumatori.`
                                : `Sei sicuro di voler attivare "${toggleDialog?.companyName}"? Il partner sarà visibile ai consumatori.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            className={toggleDialog?.currentStatus
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'bg-green-600 hover:bg-green-700'
                            }
                            onClick={() => toggleDialog && handleTogglePartner(toggleDialog.partnerId, !toggleDialog.currentStatus)}
                        >
                            {toggleDialog?.currentStatus ? 'Disattiva' : 'Attiva'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
