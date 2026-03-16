import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    MoreVertical,
    User,
    Building,
    Calendar,
    ChevronRight,
    ArrowRight,
    Package
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOperationsClientSchema } from "@shared/schema";
import { useState } from "react";
import { Link } from "wouter";

import { OperationsClient, Company } from "@shared/schema";

const STAGES = [
    { id: "new_lead", label: "Nuevo Lead", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    { id: "contract_pending", label: "Contrato Pendiente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    { id: "onboarding", label: "Onboarding", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    { id: "service_activation", label: "Activación", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    { id: "active_client", label: "Cliente Activo", color: "bg-green-500/10 text-green-500 border-green-500/20" },
    { id: "churned", label: "Churned", color: "bg-red-500/10 text-red-500 border-red-500/20" },
];

export default function OperationsPipeline() {
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: pipeline = [], isLoading } = useQuery<OperationsClient[]>({
        queryKey: ["/api/admin/client-operations/pipeline"],
    });

    const { data: companies = [] } = useQuery<Company[]>({
        queryKey: ["/api/admin/companies"],
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await apiRequest("PATCH", `/api/admin/client-operations/pipeline/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/client-operations/pipeline"] });
            toast({ title: "Estado actualizado", description: "La operación se ha movido correctamente." });
        },
    });

    const createOperationMutation = useMutation({
        mutationFn: async (values: any) => {
            await apiRequest("POST", "/api/admin/client-operations/pipeline", values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/client-operations/pipeline"] });
            setIsCreateModalOpen(false);
            toast({ title: "Operación creada", description: "El nuevo cliente ha sido agregado al pipeline." });
        },
    });

    const form = useForm({
        resolver: zodResolver(insertOperationsClientSchema),
        defaultValues: {
            client_name: "",
            company_name: "",
            company_id: "",
            service_contracted: "",
            contract_duration: "",
            plan_price: "0",
            status: "new_lead",
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-8 border-b bg-background flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pipeline de Operaciones</h1>
                    <p className="text-muted-foreground mt-1">Gestión del flujo de adquisición y activación de clientes.</p>
                </div>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nueva Operación
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva Operación de Cliente</DialogTitle>
                            <DialogDescription>Ingrese los detalles del contrato para iniciar el proceso.</DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit((v) => createOperationMutation.mutate(v))} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="company_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Empresa (Workspace)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar empresa" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {companies.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="client_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Cliente</FormLabel>
                                                <FormControl><Input placeholder="Ej: Juan Pérez" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="company_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Legal/Fantasia</FormLabel>
                                                <FormControl><Input placeholder="Ej: Acme Corp" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="service_contracted"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Servicio Contratado</FormLabel>
                                            <FormControl><Input placeholder="Ej: Plan Growth + Social Media" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="contract_duration"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duración</FormLabel>
                                                <FormControl><Input placeholder="Ej: 12 meses" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="plan_price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Precio Mensual</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={createOperationMutation.isPending}>
                                    {createOperationMutation.isPending ? "Creando..." : "Crear Operación"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 overflow-x-auto p-8 bg-muted/30">
                <div className="flex gap-6 h-full min-w-max pb-4">
                    {STAGES.map((stage) => {
                        const items = pipeline.filter((item: any) => item.status === stage.id);
                        return (
                            <div key={stage.id} className="w-80 flex flex-col gap-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
                                        <Badge variant="outline" className="rounded-full px-2 py-0 h-5 min-w-[20px] flex justify-center">{items.length}</Badge>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col gap-3">
                                    {items.map((item: any) => (
                                        <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-primary group">
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <Link href={`/admin/companies/${item.company_id}`}>
                                                        <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">{item.company_name}</CardTitle>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                                        <MoreVertical className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <CardDescription className="text-xs flex items-center gap-1">
                                                    <User className="h-3 w-3" /> {item.client_name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0 space-y-3">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                                    <Package className="h-3 w-3" />
                                                    <span className="truncate">{item.service_contracted}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs font-semibold">${item.plan_price}</span>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="p-2 pt-0 flex justify-end">
                                                <Select onValueChange={(status) => updateStatusMutation.mutate({ id: item.id, status })}>
                                                    <SelectTrigger className="h-7 border-none bg-muted/50 text-[10px] w-auto gap-1">
                                                        <SelectValue placeholder="Mover" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {STAGES.map((s) => (
                                                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="border-2 border-dashed rounded-lg p-8 flex flex-center justify-center">
                                            <p className="text-xs text-muted-foreground italic">Vacío</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
