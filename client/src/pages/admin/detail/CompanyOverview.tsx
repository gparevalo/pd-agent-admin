import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Activity, BarChart3,
    Briefcase,
    Building2,
    Calendar,
    Edit,
    FileText,
    Globe,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Rocket,
    Shield,
    Target,
    TrendingUp
} from "lucide-react";

interface CompanyOverviewProps {
    company: any;
    client360: any;
    kickoffAction: any;
    catalogItems: any[];
    isReadOnly?: boolean;
    hideStrategy?: boolean;
}

export default function CompanyOverview({
    company,
    client360,
    kickoffAction,
    catalogItems,
    isReadOnly = false,
    hideStrategy = false
}: CompanyOverviewProps) {

    return (

        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Estatus de Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-500" />
                            {client360?.profile?.account_status?.replace("_", " ") || "Información disponible después del Kickoff."}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Permanencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            {client360?.profile?.months_active || 0} Meses
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Valor de Vida (LTV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            ${parseFloat(client360?.profile?.total_ltv || "0").toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Puntos PD</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-yellow-500" />
                            {client360?.profile?.accumulated_points || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {!isReadOnly && !hideStrategy && (
                <div className="flex items-center justify-between">
                    <div>
                    </div>
                    <div className="flex gap-2">

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={kickoffAction}
                        >  <Edit className="h-4 w-4 mr-2" /> Editar Kickoff   </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Mail className="h-5 w-5" /> Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span>{company.contact_email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{company.contact_phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span>{company.website || "N/A"}</span>
                            </div>
                            <div className="flex items-start gap-4 text-sm pt-2 border-t">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <span>{company.address || "Sin dirección registrada"}</span>
                            </div>
                        </div>

                        {client360?.contacts?.length > 0 && (
                            <div className="pt-4 space-y-3 border-t">
                                <h4 className="text-sm font-semibold">Contactos Clave</h4>
                                {client360.contacts.map((c: any) => (
                                    <div key={c.id} className="flex flex-col text-xs bg-muted/30 p-2 rounded">
                                        <span className="font-bold">{c.name} ({c.position})</span>
                                        <span className="text-muted-foreground">{c.email}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Strategy & Objectives */}
                {!hideStrategy && (
                    <Card className="lg:col-span-2">

                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" /> Objetivos del Proyecto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Motivo del Lanzamiento</span>
                                <p className="text-sm font-medium">{client360?.strategy?.project_reason || "Información disponible después del Kickoff."}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Resultados Esperados</span>
                                <p className="text-xs text-slate-600">{client360?.strategy?.expected_results || "Información disponible después del Kickoff."}</p>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-dashed">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Metas Específicas</span>
                                <p className="text-xs text-slate-600 whitespace-pre-wrap">{client360?.strategy?.project_goals || "Información disponible después del Kickoff."}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {!hideStrategy && (
                <>
                    {
                        !client360?.profile && !client360?.strategy && !catalogItems?.some(i => i.item_type === 'service') ? (
                            <Card className="border-dashed py-20 text-center">
                                <CardContent className="space-y-4">
                                    <Rocket className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-lg">Sin datos de Kickoff</p>
                                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">Esta empresa aún no ha completado el formulario estratégico inicial.</p>
                                    </div>
                                    <Button className="mt-4" onClick={() => kickoffAction.mutate()} disabled={kickoffAction.isPending}>
                                        {kickoffAction.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
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
                                                <p className="text-sm font-medium">{client360?.profile?.business_description || "Información disponible después del Kickoff."}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cliente Ideal</span>
                                                    <p className="text-xs">{client360?.profile?.ideal_customer || "Información disponible después del Kickoff."}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Problema Solucionado</span>
                                                    <p className="text-xs">{client360?.profile?.customer_problem || "Información disponible después del Kickoff."}</p>
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

                                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">


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
                                                    <p className="text-xs font-medium">{client360?.results?.customer_satisfaction_measurement || "Información disponible después del Kickoff."}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1 pt-2 border-t">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Proceso Comercial</span>
                                                <p className="text-[11px] text-slate-600 line-clamp-2">{client360?.results?.sales_process || "Información disponible después del Kickoff."}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Preguntas Frecuentes Clientes</span>
                                                <p className="text-[11px] text-slate-600 italic">"{client360?.results?.customer_questions || "Información disponible después del Kickoff."}"</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )
                    }

                </>)}
        </div >

    )

}