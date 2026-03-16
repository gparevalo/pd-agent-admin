import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Settings2,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    XCircle,
    Activity,
    Calendar
} from "lucide-react";
import { Link } from "wouter";

interface ServiceActivationItem {
    id: string;
    company_id: string;
    company_name: string;
    service_type: string;
    status: string;
    activated_at?: string;
    deactivated_at?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "Activo", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
    inactive: { label: "Inactivo", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: XCircle },
    pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: AlertCircle },
};

export default function OperationsServices() {
    const { data: services = [], isLoading } = useQuery<ServiceActivationItem[]>({
        queryKey: ["/api/admin/client-operations/services"],
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Activaciones de Servicio</h1>
                <p className="text-muted-foreground mt-1">Control y monitoreo de servicios técnicos y estratégicos habilitados por cliente.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Servicios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Bots Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.filter(s => s.service_type === 'ai_bot').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Smart CRM</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.filter(s => s.service_type === 'smart_crm').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ads Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{services.filter(s => s.service_type === 'ads_management').length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Estado de Activaciones
                        </CardTitle>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            Configurar Servicios
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Servicio</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Activación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service) => {
                                const config = statusConfig[service.status] || statusConfig.pending;
                                return (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.company_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {service.service_type.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <config.icon className={`h-4 w-4 ${config.color.split(' ')[1]}`} />
                                                <span className={`text-sm font-medium ${config.color.split(' ')[1]}`}>{config.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {service.activated_at ? new Date(service.activated_at).toLocaleDateString() : "Pendiente"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/admin/companies/${service.company_id}?tab=operations`}>
                                                <Button variant="ghost" size="icon">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {services.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No hay servicios registrados en este momento.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
