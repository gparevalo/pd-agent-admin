import { useQuery, useMutation } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    User,
    Calendar,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface OnboardingItem {
    id: string;
    company_id: string;
    company_name: string;
    assigned_pm?: string;
    status: string;
    progress_percentage: number;
    setup_started_at?: string;
    estimated_completion_at?: string;
    client_portal_url?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
    in_progress: { label: "En Progreso", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    completed: { label: "Completado", color: "bg-green-500/10 text-green-500 border-green-500/20" },
    delayed: { label: "Retrasado", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export default function OperationsOnboarding() {
    const { toast } = useToast();

    const { data: onboardings = [], isLoading } = useQuery<OnboardingItem[]>({
        queryKey: ["/api/admin/client-operations/onboarding"],
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
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Onboarding</h1>
                <p className="text-muted-foreground mt-1">Seguimiento de procesos de configuración inicial y entrega de servicios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> En Proceso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onboardings.filter(o => o.status === 'in_progress').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Completados (Mes)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{onboardings.filter(o => o.status === 'completed').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Settings className="h-4 w-4" /> Promedio de Entrega
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12 Días</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Procesos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>PM Asignado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Progreso</TableHead>
                                <TableHead>Fecha Est.</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {onboardings.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.company_name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-sm">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {item.assigned_pm || "Sin asignar"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusConfig[item.status]?.color}>
                                            {statusConfig[item.status]?.label || item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="w-[200px]">
                                        <div className="flex items-center gap-3">
                                            <Progress value={item.progress_percentage} className="h-2" />
                                            <span className="text-xs font-medium w-9">{item.progress_percentage}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {item.estimated_completion_at ? new Date(item.estimated_completion_at).toLocaleDateString() : "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/companies/${item.company_id}?tab=operations`}>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    Detalles
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {onboardings.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No hay procesos de onboarding activos.
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
