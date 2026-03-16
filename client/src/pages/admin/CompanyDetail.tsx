import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent,
    DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Company, User } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Activity,
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    Bot,
    Briefcase,
    Building2,
    CheckCircle2, Clock,
    CreditCard,
    Edit,
    ExternalLink,
    Kanban,
    Loader2,
    MessageSquare,
    MoreVertical,
    Plus,
    Rocket,
    Settings2,
    Target,
    Users
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useRoute } from "wouter";
import { z } from "zod";
import CompanyOverview from "./detail/CompanyOverview";

const createUserSchema = z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    role: z.string().default("company_user")
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function CompanyDetail() {
    const [, params] = useRoute("/admin/companies/:id");
    const [location, setLocation] = useLocation();
    const queryParams = new URLSearchParams(window.location.search);
    const defaultTab = queryParams.get("tab") || "overview";

    const companyId = params?.id;
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [kickoffModal, setKickoffModal] = useState<{ open: boolean, token?: string }>({ open: false });

    // Queries
    const { data: company, isLoading: isLoadingCompany } = useQuery<Company>({
        queryKey: [`/api/admin/companies/${companyId}`],
        enabled: !!companyId,
    });

    const { data: client360, isLoading: isLoading360 } = useQuery<any>({
        queryKey: [`/api/admin/client-operations/client-360/${companyId}`],
        enabled: !!companyId,
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
        queryKey: [`/api/admin/companies/${companyId}/users`],
        enabled: !!companyId,
    });

    const { data: subscription } = useQuery<any>({
        queryKey: [`/api/admin/companies/${companyId}/subscriptions`],
        enabled: !!companyId,
    });

    const { data: activityLogs } = useQuery<any[]>({
        queryKey: [`/api/admin/companies/${companyId}/activity`],
        enabled: !!companyId,
    });

    const { data: agents } = useQuery<any[]>({
        queryKey: [`/api/agents`],
        enabled: !!companyId,
    });

    const { data: serviceActivations } = useQuery<any[]>({
        queryKey: [`/api/admin/client-operations/services/${companyId}`],
        enabled: !!companyId,
    });

    const { data: catalogItems } = useQuery<any[]>({
        queryKey: [`/api/admin/catalog/${companyId}`],
        enabled: !!companyId,
    });

    // Mutations
    const createUserMutation = useMutation({
        mutationFn: async (data: CreateUserData) => {
            const res = await apiRequest("POST", `/api/admin/companies/${companyId}/users`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/companies/${companyId}/users`] });
            setIsUserModalOpen(false);
            toast({ title: "Usuario creado", description: "El usuario ha sido registrado correctamente." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ userId, status }: { userId: string, status: string }) => {
            await apiRequest("PATCH", `/api/admin/users/${userId}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/companies/${companyId}/users`] });
            toast({ title: "Estado actualizado" });
        }
    });

    const kickoffMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", `/api/admin/companies/${companyId}/kickoff-token`);
            return res.json();
        },
        onSuccess: (data) => {
            setKickoffModal({ open: true, token: data.token });
        },
        onError: (error: Error) => {
            toast({ title: "Error al generar enlace", description: error.message, variant: "destructive" });
        }
    });

    const updateStageMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            // Find the operation ID first
            const res = await apiRequest("GET", "/api/admin/client-operations/pipeline");
            const pipeline = await res.json();
            const companyOp = pipeline.find((op: any) => op.company_id === companyId);
            if (!companyOp) throw new Error("No se encontró una operación activa para esta empresa");

            await apiRequest("PATCH", `/api/admin/client-operations/pipeline/${companyOp.id}`, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/client-operations/client-360/${companyId}`] });
            toast({ title: "Etapa actualizada", description: "El cliente ha avanzado en el pipeline." });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const form = useForm<CreateUserData>({
        resolver: zodResolver(createUserSchema),
        defaultValues: { name: "", email: "", password: "", role: "company_user" }
    });

    if (isLoadingCompany || isLoading360) {
        return <div className="p-6 flex justify-center h-screen items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!company) {
        return <div className="p-6 text-center">Empresa no encontrada</div>;
    }

    const handleTabChange = (value: string) => {
        setLocation(`/admin/companies/${companyId}?tab=${value}`);
    };

    const pipelineStatus = client360?.pipeline_status || "new_lead";
    const isNewLead = pipelineStatus === "new_lead";
    const isContractPending = pipelineStatus === "contract_pending";
    const isOnboarding = pipelineStatus === "onboarding";
    const isActivation = pipelineStatus === "service_activation";
    const isActiveClient = pipelineStatus === "active_client";
    const isReadOnly = isActiveClient;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/companies">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                            <Badge variant={company.status === "active" ? "default" : "secondary"} className="uppercase">
                                {company.status}
                            </Badge>
                            {client360?.profile?.client_classification && (
                                <Badge variant="outline" className="border-primary/50 text-primary">
                                    {client360.profile.client_classification.replace("_", " ")}
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">{company.legal_name || "Workspace de Cliente"}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {isNewLead && (
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => updateStageMutation.mutate("contract_pending")}
                            disabled={updateStageMutation.isPending}
                        >
                            <ArrowUpRight className="h-4 w-4 mr-2" /> Mover a Contrato
                        </Button>
                    )}

                    {isContractPending && (
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => updateStageMutation.mutate("onboarding")}
                            disabled={updateStageMutation.isPending}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar Contrato
                        </Button>
                    )}

                    {isOnboarding && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => kickoffMutation.mutate()}
                                disabled={kickoffMutation.isPending}
                            >
                                {kickoffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                                Editar Kickoff
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => updateStageMutation.mutate("service_activation")}
                                disabled={updateStageMutation.isPending}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar Onboarding
                            </Button>
                        </>
                    )}

                    {isActivation && (
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => updateStageMutation.mutate("active_client")}
                            disabled={updateStageMutation.isPending}
                        >
                            <Activity className="h-4 w-4 mr-2" /> Mover a Cliente Activo
                        </Button>
                    )}

                    <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" /> Reporte 360
                    </Button>

                    {!isReadOnly && (
                        <Button size="sm">
                            <Edit className="h-4 w-4 mr-2" /> Editar Perfil
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="bg-muted/50 p-1 w-full justify-start h-auto border-b rounded-none mb-2 overflow-x-auto no-scrollbar">
                    <TabsTrigger value="overview" className="gap-2 py-2 px-4">
                        <BarChart3 className="h-4 w-4" /> Resumen
                    </TabsTrigger>

                    {(isContractPending || isOnboarding || isActivation || isActiveClient) && (
                        <TabsTrigger value="billing" className="gap-2 py-2 px-4">
                            <CreditCard className="h-4 w-4" /> Facturación
                        </TabsTrigger>
                    )}

                    {(isOnboarding || isActivation || isActiveClient) && (
                        <TabsTrigger value="onboarding" className="gap-2 py-2 px-4">
                            <Rocket className="h-4 w-4" /> Onboarding
                        </TabsTrigger>
                    )}


                    <TabsTrigger value="operations" className="gap-2 py-2 px-4">
                        <Target className="h-4 w-4" /> Operaciones
                    </TabsTrigger>

                    {(isActivation || isActiveClient) && (
                        <TabsTrigger value="activation" className="gap-2 py-2 px-4">
                            <ExternalLink className="h-4 w-4" /> Activación
                        </TabsTrigger>
                    )}

                    <TabsTrigger value="team" className="gap-2 py-2 px-4">
                        <Users className="h-4 w-4" /> Equipo
                    </TabsTrigger>

                    <TabsTrigger value="activity" className="gap-2 py-2 px-4">
                        <Clock className="h-4 w-4" /> Actividad
                    </TabsTrigger>

                    {(isActivation || isActiveClient) && (
                        <TabsTrigger value="ai-assets" className="gap-2 py-2 px-4">
                            <Bot className="h-4 w-4" /> Agentes IA
                        </TabsTrigger>
                    )}

                </TabsList>

                {/* --- OVERVIEW TAB --- */}
                <TabsContent value="overview" className="space-y-6 outline-none">

                    <CompanyOverview
                        company={company}
                        client360={client360}
                        kickoffAction={() => kickoffMutation.mutate()}
                        catalogItems={catalogItems || []}
                    />
                </TabsContent>

                {/* --- OPERATIONS TAB --- */}
                <TabsContent value="operations" className="space-y-6 outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Kanban className="h-5 w-5" /> Pipeline de Adquisición
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Gestión de etapas y transición de prospectos.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="onboarding" className="space-y-6 outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de Onboarding</CardTitle>
                            <CardDescription>Configuración inicial y seguimiento de la cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Project Manager</p>
                                    <p className="text-sm font-medium">{client360?.onboarding?.assigned_pm || "Pendiente asignar"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">COO</p>
                                    <p className="text-sm font-medium">{client360?.onboarding?.assigned_coo || "Pendiente asignar"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Carpeta Drive</p>
                                    {client360?.onboarding?.drive_folder_url ? (
                                        <a href={client360.onboarding.drive_folder_url} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1">
                                            Ver Carpeta <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : <p className="text-sm text-muted-foreground font-medium italic">No configurada</p>}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Space en ClickUp</p>
                                    {client360?.onboarding?.clickup_space_url ? (
                                        <a href={client360.onboarding.clickup_space_url} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1">
                                            Ver Space <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : <p className="text-sm text-muted-foreground font-medium italic">No configurado</p>}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Grupo de WhatsApp</p>
                                    {client360?.onboarding?.whatsapp_group_url ? (
                                        <a href={client360.onboarding.whatsapp_group_url} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1">
                                            Ver Grupo <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : <p className="text-sm text-muted-foreground font-medium italic">Sin grupo</p>}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Reunión de Kickoff</p>
                                    <p className="text-sm font-medium">
                                        {client360?.onboarding?.kickoff_meeting_date ? new Date(client360.onboarding.kickoff_meeting_date).toLocaleString() : "Pendiente programar"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activation" className="space-y-6 outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activación de Servicios</CardTitle>
                            <CardDescription>Seguimiento de lanzamientos y despliegues técnicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>RUC Facturación</TableHead>
                                        <TableHead>Contrato</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {serviceActivations?.map((s: any) => (
                                        <TableRow key={s.id} className="group hover:bg-muted/10 transition-colors">
                                            <TableCell className="font-bold">{s.service_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize border-primary/20 text-primary bg-primary/5">
                                                    {s.status.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">{s.billing_ruc}</TableCell>
                                            <TableCell>
                                                {s.contract_addendum_url ? (
                                                    <a href={s.contract_addendum_url} target="_blank" className="text-primary hover:underline flex items-center gap-1 text-sm font-medium">
                                                        Anexo <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                ) : <span className="text-muted-foreground italic text-xs">N/A</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="rounded-full"><Settings2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!serviceActivations || serviceActivations.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                                No hay registros de activación para este cliente.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- AI ASSETS TAB --- */}
                <TabsContent value="ai-assets" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {agents?.filter(a => a.company_id === companyId).map((agent) => (
                            <Card key={agent.id} className="relative overflow-hidden group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Bot className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <CardDescription className="text-xs">v1.2.4 • Activo</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="text-[10px] uppercase">{agent.type}</Badge>
                                        <Badge variant="outline" className="text-[10px] uppercase">{agent.provider}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t font-medium">
                                        <div className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> {agent.usage_count || 0} chats</div>
                                        <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> 98% Precisión</div>
                                    </div>
                                    <Button size="sm" className="w-full mt-2 group-hover:bg-primary">Configurar Agente</Button>
                                </CardContent>
                            </Card>
                        ))}
                        <Button variant="outline" className="h-[200px] border-dashed flex flex-col gap-2">
                            <Plus className="h-8 w-8 opacity-20" />
                            <span className="font-semibold text-muted-foreground">Nuevo Agente Global</span>
                        </Button>
                    </div>
                </TabsContent>

                {/* --- BILLING TAB --- */}
                <TabsContent value="billing" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-lg">Suscripción Actual</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {subscription ? (
                                    <>
                                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 text-center">
                                            <p className="text-sm font-semibold uppercase text-muted-foreground mb-1">Plan Activo</p>
                                            <p className="text-2xl font-bold text-primary">{subscription.plans?.name || "Premium Plan"}</p>
                                            <Badge className="mt-2 uppercase">{subscription.status}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase">Ciclo</p>
                                                <p className="font-bold capitalize">{subscription.billing_cycle}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase">Próximo Cobro</p>
                                                <p className="font-bold">{new Date(subscription.end_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground text-xs uppercase">Monto</p>
                                                <p className="font-bold">${subscription.final_price}</p>
                                            </div>
                                        </div>
                                        <Link href="/admin/subscriptions">
                                            <Button variant="outline" className="w-full gap-2">
                                                <ArrowUpRight className="h-4 w-4" /> Gestionar Suscripción
                                            </Button>
                                        </Link>
                                    </>
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-sm text-muted-foreground mb-4">No hay una suscripción activa.</p>
                                        <Link href="/admin/subscriptions">
                                            <Button size="sm">Asignar Suscripción</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg">Consumo y Límites</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Mensajes IA</span>
                                        <span className="text-muted-foreground">8,450 / 10,000</span>
                                    </div>
                                    <Progress value={84.5} className="h-2" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Almacenamiento CRM</span>
                                        <span className="text-muted-foreground">12.5 GB / 50 GB</span>
                                    </div>
                                    <Progress value={25} className="h-2" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Usuarios Concurrentes</span>
                                        <span className="text-muted-foreground">5 / 20</span>
                                    </div>
                                    <Progress value={25} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- TEAM TAB --- */}
                <TabsContent value="team" className="outline-none">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Gestión de Equipo</CardTitle>
                                <CardDescription>Administra los accesos y roles de los usuarios de {company.name}.</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setIsUserModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Nuevo Usuario
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingUsers ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Rol</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users?.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-[10px]">
                                                        {(user.role as string).replace("_", " ")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.status === "active" ? "default" : "secondary"} className="h-5 text-[10px]">
                                                        {user.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => updateStatusMutation.mutate({
                                                                userId: user.id,
                                                                status: user.status === "active" ? "inactive" : "active"
                                                            })}>
                                                                {user.status === "active" ? "Desactivar" : "Activar"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem>Resetear Password</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- ACTIVITY TAB --- */}
                <TabsContent value="activity" className="outline-none">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Registro de Auditoría</CardTitle>
                            <CardDescription>Historial completo de acciones y cambios realizados en la cuenta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {(activityLogs && activityLogs.length > 0) ? activityLogs.map((log, idx) => (
                                    <div key={log.id} className="relative pl-6 pb-6 last:pb-0 border-l border-muted ml-3">
                                        <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary" />
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {log.action && (<p className="text-sm font-bold uppercase">{log.action.replace("_", " ")}</p>)}
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {JSON.stringify(log.details)}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="text-[9px]">{log.user_id === "SYSTEM" ? "SISTEMA" : "USUARIO"}</Badge>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium">
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-12 text-muted-foreground">No hay actividad registrada.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                {/* --- KICKOFF TAB --- */}
                <TabsContent value="kickoff" className="space-y-6 outline-none">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Rocket className="h-6 w-6 text-primary" /> Estrategia de Kickoff
                            </h2>
                            <p className="text-muted-foreground">Datos estratégicos recopilados durante el onboarding.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => kickoffMutation.mutate()} disabled={kickoffMutation.isPending}>
                                {kickoffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                                Editar Kickoff
                            </Button>
                        </div>
                    </div>

                    {!client360?.profile && !client360?.strategy && !catalogItems?.some(i => i.item_type === 'service') ? (
                        <Card className="border-dashed py-20 text-center">
                            <CardContent className="space-y-4">
                                <Rocket className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                                <div className="space-y-1">
                                    <p className="font-bold text-lg">Sin datos de Kickoff</p>
                                    <p className="text-muted-foreground max-w-xs mx-auto text-sm">Esta empresa aún no ha completado el formulario estratégico inicial.</p>
                                </div>
                                <Button className="mt-4" onClick={() => kickoffMutation.mutate()} disabled={kickoffMutation.isPending}>
                                    {kickoffMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                                    Generar Link de Kickoff
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Business Context */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" /> Contexto del Negocio
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Descripción del Negocio</span>
                                            <p className="text-sm font-medium">{client360?.profile?.business_description || "No definido"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cliente Ideal</span>
                                                <p className="text-xs">{client360?.profile?.ideal_customer || "No definido"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Problema Solucionado</span>
                                                <p className="text-xs">{client360?.profile?.customer_problem || "No definido"}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Services Catalog */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Briefcase className="h-5 w-5 text-primary" /> Servicios Registrados
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {catalogItems?.filter(i => i.item_type === 'service').map((service, idx) => (
                                                <div key={service.id} className="flex flex-col p-3 rounded-lg bg-muted/30 border border-muted/50">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-sm">{service.name}</span>
                                                        <Badge variant="outline" className="text-[10px] bg-primary/5">${service.base_price}</Badge>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2">{service.description}</p>
                                                    {service.details?.includes && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {service.details.includes.map((benefit: string, bIdx: number) => (
                                                                <span key={bIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                                                                    {benefit}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {(!catalogItems || catalogItems.filter(i => i.item_type === 'service').length === 0) && (
                                                <p className="text-xs text-muted-foreground text-center py-4 italic">No hay servicios en el catálogo.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Strategy & Objectives */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Target className="h-5 w-5 text-primary" /> Objetivos del Proyecto
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Motivo del Lanzamiento</span>
                                            <p className="text-sm font-medium">{client360?.strategy?.project_reason || "No definido"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Resultados Esperados</span>
                                            <p className="text-xs text-slate-600">{client360?.strategy?.expected_results || "No definidos"}</p>
                                        </div>
                                        <div className="space-y-1 pt-2 border-t border-dashed">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Metas Específicas</span>
                                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{client360?.strategy?.project_goals || "No registradas"}</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Sales & Marketing Insights */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" /> Insights de Venta y Marketing
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ciclo de Venta</span>
                                                <p className="text-xs font-bold">{client360?.results?.sales_cycle_duration || "-"} </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Satisfacción</span>
                                                <p className="text-xs font-medium">{client360?.results?.customer_satisfaction_measurement || "No definida"}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1 pt-2 border-t">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Proceso Comercial</span>
                                            <p className="text-[11px] text-slate-600 line-clamp-2">{client360?.results?.sales_process || "No definido"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Preguntas Frecuentes Clientes</span>
                                            <p className="text-[11px] text-slate-600 italic">"{client360?.results?.customer_questions || "No definidas"}"</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Usuario</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit((d) => createUserMutation.mutate(d))} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre Completo</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña Temporal</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={createUserMutation.isPending}>
                                    {createUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear Usuario
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={kickoffModal.open} onOpenChange={(open) => setKickoffModal({ open, token: open ? kickoffModal.token : undefined })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" /> Enlace de Kickoff Corporativo
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Copia este enlace y envíalo al cliente. El enlace es seguro y expirará en 7 días o después de ser enviado.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={kickoffModal.token ? `${window.location.origin}/kickoff/${kickoffModal.token}` : ""}
                                className="bg-muted"
                            />
                            <Button onClick={() => {
                                const url = `${window.location.origin}/kickoff/${kickoffModal.token}`;
                                navigator.clipboard.writeText(url);
                                toast({ title: "Enlace copiado", description: "Ya puedes enviarlo al cliente." });
                            }}>
                                Copiar
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setKickoffModal({ open: false })}>Cerrar</Button>
                        <Button onClick={() => {
                            const url = `${window.location.origin}/kickoff/${kickoffModal.token}`;
                            window.open(url, "_blank");
                        }}>
                            Abrir ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
