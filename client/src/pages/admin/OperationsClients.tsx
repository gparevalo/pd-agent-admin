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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    Search,
    ExternalLink,
    Filter,
    UserCheck,
    Target,
    BarChart3
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface ClientListItem {
    company_id: string;
    company_name: string;
    industry?: string;
    city_country?: string;
    client_classification?: string;
    account_status?: string;
    agency_start_date?: string;
}

const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    on_hold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    terminated: "bg-red-500/10 text-red-500 border-red-500/20",
};

const classificationColors: Record<string, string> = {
    tier_1: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    tier_2: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    tier_3: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

export default function OperationsClients() {
    const [search, setSearch] = useState("");

    const { data: clients = [], isLoading } = useQuery<ClientListItem[]>({
        queryKey: ["/api/admin/client-operations/clients"],
    });

    const filteredClients = clients.filter((c) =>
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.industry?.toLowerCase().includes(search.toLowerCase())
    );

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
                <h1 className="text-3xl font-bold tracking-tight">CRM de Clientes</h1>
                <p className="text-muted-foreground mt-1">Gestión estratégica y seguimiento 360 de las cuentas activas.</p>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por empresa o industria..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Cartera de Clientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Industria</TableHead>
                                <TableHead>Clasificación</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Inicio Agencia</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow key={client.company_id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {client.company_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{client.industry || "-"}</TableCell>
                                    <TableCell>
                                        {client.client_classification ? (
                                            <Badge variant="outline" className={classificationColors[client.client_classification]}>
                                                {client.client_classification.replace("_", " ")}
                                            </Badge>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {client.account_status ? (
                                            <Badge variant="outline" className={statusColors[client.account_status]}>
                                                {client.account_status.replace("_", " ")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Sin perfil</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {client.agency_start_date ? new Date(client.agency_start_date).toLocaleDateString() : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/admin/companies/${client.company_id}?tab=operations`}>
                                                <Button variant="ghost" size="sm" className="gap-2">
                                                    <Target className="h-4 w-4" />
                                                    Operaciones
                                                </Button>
                                            </Link>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <BarChart3 className="h-4 w-4" />
                                                Vista 360
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredClients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron clientes.
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
