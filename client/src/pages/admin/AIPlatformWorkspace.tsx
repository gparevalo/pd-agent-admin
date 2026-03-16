import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Bot,
    MessageSquare,
    Cpu,
    TrendingUp,
    AlertCircle,
    Zap,
    Activity,
    ArrowUpRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AIPlatformWorkspace() {
    const { data: agents = [] } = useQuery<any[]>({
        queryKey: ["/api/agents"],
    });

    const stats = [
        { label: "Agentes Activos", value: agents.length, icon: Bot, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Mensajes (Mes)", value: "1.2M", icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Carga Sistema", value: "24%", icon: Cpu, color: "text-orange-500", bg: "bg-orange-500/10" },
        { label: "Eficiencia Promedio", value: "98.2%", icon: Zap, color: "text-green-500", bg: "bg-green-500/10" },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Platform Workspace</h1>
                <p className="text-muted-foreground mt-1">Centro de monitoreo y orquestación de la infraestructura de IA global.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">{stat.label}</CardTitle>
                            <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                                <stat.icon className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                                <TrendingUp className="h-3 w-3" />
                                <span>+12.5% vs mes anterior</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Performance de Agentes</CardTitle>
                                <CardDescription>Top 5 agentes con mayor engagement y precisión.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Activity className="h-4 w-4" /> Ver Logs Globales
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[
                                { name: "Soporte Ventas PD", company: "Premium Digital", usage: 8500, health: 98 },
                                { name: "Clasificador Leads ZA", company: "Zapp Real Estate", usage: 6200, health: 95 },
                                { name: "Agendador Citas Clinica", company: "MedCare Plus", usage: 4800, health: 99 },
                                { name: "Consultor Legal AI", company: "LegalSoft", usage: 3100, health: 92 },
                                { name: "Dispatcher Logística", company: "Global Trans", usage: 2900, health: 97 },
                            ].map((agent, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-9 w-9 rounded bg-muted flex items-center justify-center font-bold text-muted-foreground">
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{agent.name}</p>
                                            <p className="text-xs text-muted-foreground">{agent.company}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 text-right">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold">Mensajes</p>
                                            <p className="text-sm font-bold">{agent.usage.toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-semibold">Salud</p>
                                            <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5">
                                                {agent.health}%
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Infraestructura & Costos</CardTitle>
                        <CardDescription>Consumo de tokens y estimación mensual.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">OpenAI GPT-4o</span>
                                <span className="text-muted-foreground">72% cuota</span>
                            </div>
                            <Progress value={72} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Claude 3.5 Sonnet</span>
                                <span className="text-muted-foreground">15% cuota</span>
                            </div>
                            <Progress value={15} className="h-2" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">DeepSeek-v3</span>
                                <span className="text-muted-foreground">8% cuota</span>
                            </div>
                            <Progress value={8} className="h-2" />
                        </div>

                        <div className="pt-4 border-t space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-muted-foreground font-semibold uppercase">Costo Estimado</p>
                                    <p className="text-3xl font-bold">$2,840.00</p>
                                </div>
                                <ArrowUpRight className="h-6 w-6 text-muted-foreground opacity-50 mb-1" />
                            </div>
                            <Button className="w-full gap-2">
                                Optimizar Recursos
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
