import { useQuery } from "@tanstack/react-query";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Bot,
    Settings2,
    Search,
    Filter,
    MoreVertical,
    Activity,
    Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Agent, Company } from "@shared/schema";

export default function AIPlatformAgents() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: agents = [], isLoading: isLoadingAgents } = useQuery<any[]>({
        queryKey: ["/api/agents"],
    });

    const { data: companies = [] } = useQuery<Company[]>({
        queryKey: ["/api/admin/companies"],
    });

    const getCompanyName = (id: string) => {
        return companies.find(c => c.id === id)?.name || "N/A";
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCompanyName(agent.company_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agentes de IA</h1>
                    <p className="text-muted-foreground mt-1">Gestión centralizada de todos los bots y procesos autónomos del sistema.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Desplegar Agente Global
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre o empresa..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Filter className="h-4 w-4" /> Filtros
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Activity className="h-4 w-4" /> Salud de Red
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[300px]">Nombre del Agente</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Tecnología / Propósito</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Interacciones</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingAgents ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Cargando infraestructura de agentes...</TableCell>
                                </TableRow>
                            ) : filteredAgents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No se encontraron agentes activos.</TableCell>
                                </TableRow>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <TableRow key={agent.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                                    <Bot className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{agent.name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">ID: {agent.id.split('-')[0]}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium">
                                                {getCompanyName(agent.company_id)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-sm">{agent.purpose}</p>
                                                <div className="flex gap-1.5">
                                                    <Badge variant="outline" className="text-[9px] uppercase px-1 h-4">{agent.tone || 'Professional'}</Badge>
                                                    <Badge variant="outline" className="text-[9px] uppercase px-1 h-4">GPT-4o</Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={agent.status === 'active' ? 'default' : 'outline'} className={agent.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                                {agent.status === 'active' ? 'Operativo' : agent.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <p className="font-bold">{agent.usage_count || 0}</p>
                                            <p className="text-[10px] text-muted-foreground">mensajes</p>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
