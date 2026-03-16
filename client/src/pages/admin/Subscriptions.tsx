import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutGrid,
  List,
  Filter,
  TrendingUp,
  Activity,
  AlertTriangle,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Tag,
  Gift,
  ArrowRight,
  TrendingDown,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import type { Company } from "@shared/schema";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  trial: { label: "Trial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Clock },
  active: { label: "Activo", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: CheckCircle },
  past_due: { label: "En Riesgo", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: AlertTriangle },
  grace_period: { label: "Gracia", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: AlertCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  expired: { label: "Expirado", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
};

export default function AdminSubscriptions() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState<{ type: string; subId: string } | null>(null);

  // Queries
  const { data: dashboardDataRes, isLoading } = useQuery({
    queryKey: ["/api/admin/subscriptions/dashboard"],
    enabled: !!token,
  });
  const dashboardData = dashboardDataRes as any;

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    enabled: !!token,
  });

  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/plans"],
    enabled: !!token,
  });

  const kpis = dashboardData?.kpis;
  const subscriptions = dashboardData?.subscriptions || [];

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string; payload?: any }) => {
      const res = await apiRequest("POST", endpoint, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/dashboard"] });
      setActionModal(null);
      setIsDetailOpen(false);
      toast({ title: "Acción completada con éxito", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignForm = useForm({
    defaultValues: {
      company_id: "",
      plan_id: "",
      billing_cycle: "monthly",
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      base_price: "0",
      final_price: "0",
      setup_fee: "0",
      status: "active"
    }
  });

  const assignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/admin/subscriptions", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscriptions/dashboard"] });
      setIsAssignModalOpen(false);
      assignForm.reset();
      toast({ title: "Suscripción asignada correctamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  // Derived state
  const filteredSubs = useMemo(() => {
    let result = [...subscriptions];

    if (searchTerm) {
      result = result.filter(
        (s) =>
          s.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (cycleFilter !== "all") {
      result = result.filter((s) => s.billing_cycle === cycleFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "final_price") return parseFloat(b.final_price) - parseFloat(a.final_price);
      if (sortBy === "end_date") return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [subscriptions, searchTerm, statusFilter, cycleFilter, sortBy]);

  const handleAction = (type: string, subId: string) => {
    setActionModal({ type, subId });
  };

  const executeAction = (payload: any) => {
    if (!actionModal) return;
    let endpoint = "";
    if (actionModal.type === "plan") endpoint = `/api/admin/subscriptions/${actionModal.subId}/plan`;
    else if (actionModal.type === "addon") endpoint = `/api/admin/subscriptions/${actionModal.subId}/addons`;
    else if (actionModal.type === "discount") endpoint = `/api/admin/subscriptions/${actionModal.subId}/discounts`;
    else if (actionModal.type === "grace_period") endpoint = `/api/admin/subscriptions/${actionModal.subId}/grace-period`;
    else if (actionModal.type === "cancel") endpoint = `/api/admin/subscriptions/${actionModal.subId}/cancel`;

    actionMutation.mutate({ endpoint, payload });
  };

  const isRenewalSoon = (endDate: string) => {
    if (!endDate) return false;
    const diffDays = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-[1600px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Suscripciones</h1>
          <p className="text-muted-foreground">Dashboard Administrativo de Membresías SaaS</p>
        </div>
        <Button onClick={() => setIsAssignModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Asignar Plan
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard title="MRR" value={`$${kpis?.mrr?.toFixed(2) || '0.00'}`} icon={<TrendingUp />} />
        <KPICard title="ARR" value={`$${kpis?.arr?.toFixed(2) || '0.00'}`} icon={<DollarSign />} />
        <KPICard title="Activas" value={kpis?.active || 0} icon={<CheckCircle className="text-green-500" />} />
        <KPICard title="En Riesgo" value={kpis?.past_due || 0} icon={<AlertTriangle className="text-red-500" />} />
        <KPICard title="Gracia" value={kpis?.grace_period || 0} icon={<Clock className="text-orange-500" />} />
        <KPICard title="Nuevas (30d)" value={kpis?.new_30_days || 0} icon={<Activity className="text-blue-500" />} />
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="flex flex-1 gap-3 flex-wrap">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente o plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background focus-visible:ring-primary/20"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="grace_period">Grace Period</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los ciclos</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Más recientes</SelectItem>
                <SelectItem value="final_price">Mayor precio</SelectItem>
                <SelectItem value="end_date">Renovación próxima</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="px-3"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cartas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-card/30 border-dashed">
          <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground">No se encontraron resultados</h3>
          <p className="text-muted-foreground mt-1">Intenta con otros filtros de búsqueda.</p>
        </div>
      ) : (
        <>
          {viewMode === "list" ? (
            <Card className="overflow-hidden border-border/50">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Addons</TableHead>
                    <TableHead>Uso (Msjs)</TableHead>
                    <TableHead>Expiración</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubs.map((sub: any) => {
                    const status = statusConfig[sub.status] || statusConfig.trial;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { setSelectedSub(sub); setIsDetailOpen(true); }}>
                        <TableCell className="font-medium">{sub.company_name || 'Desconocida'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sub.plan_name}
                            {sub.discounts_count > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1 py-0"><Tag className="w-3 h-3 mr-1" />Desc</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{sub.billing_cycle}</TableCell>
                        <TableCell className="font-semibold text-primary/80">$ {(parseFloat(sub.final_price) || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`font-medium ${status.color} border-0 shadow-none`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sub.addons_count > 0 ? (
                            <Badge variant="secondary" className="font-mono">{sub.addons_count}</Badge>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {sub.usage?.messages != null ? (
                            <span className="text-sm font-medium">{sub.usage.messages.toLocaleString()}</span>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{new Date(sub.end_date).toLocaleDateString()}</span>
                            {isRenewalSoon(sub.end_date) && <span className="text-xs text-orange-500 font-semibold flex items-center mt-1"><Clock className="w-3 h-3 mr-1" />Renueva pronto</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <SubscriptionActions sub={sub} onAction={handleAction} onDetail={() => { setSelectedSub(sub); setIsDetailOpen(true); }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSubs.map((sub: any) => {
                const status = statusConfig[sub.status] || statusConfig.trial;
                const StatusIcon = status.icon;
                return (
                  <Card key={sub.id} className="hover:shadow-md transition-all group overflow-hidden border-border/50">
                    <CardHeader className="bg-muted/20 pb-4 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg line-clamp-1">{sub.company_name || 'Desconocida'}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            {sub.plan_name} <span className="mx-2">•</span> <span className="capitalize">{sub.billing_cycle}</span>
                          </CardDescription>
                        </div>
                        <SubscriptionActions sub={sub} onAction={handleAction} onDetail={() => { setSelectedSub(sub); setIsDetailOpen(true); }} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-2">
                      <div className="flex items-end justify-between mb-4">
                        <div className="text-2xl font-bold tracking-tight text-primary">${(parseFloat(sub.final_price) || 0).toFixed(2)}</div>
                        <Badge className={`font-medium ${status.color} border-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center"><Calendar className="w-4 h-4 mr-2" />Renovación</span>
                          <span className={`font-medium ${isRenewalSoon(sub.end_date) ? 'text-orange-500' : ''}`}>
                            {new Date(sub.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                          <span className="text-muted-foreground flex items-center"><Plus className="w-4 h-4 mr-2" />Addons</span>
                          <span className="font-medium">{sub.addons_count} activos</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-muted-foreground flex items-center"><Activity className="w-4 h-4 mr-2" />Uso Promedio</span>
                          <span className="font-medium">{sub.usage?.messages || 0} msj</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button variant="secondary" className="w-full text-xs h-8" onClick={() => { setSelectedSub(sub); setIsDetailOpen(true); }}>
                        Ver detalles completos <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Action Modals */}
      {actionModal && plans && (
        <ActionDialog
          modalState={actionModal}
          onClose={() => setActionModal(null)}
          plans={plans as any[]}
          onExecute={executeAction}
          isLoading={actionMutation.isPending}
        />
      )}

      {/* Detail View Sidebar / Modal */}
      {isDetailOpen && selectedSub && (
        <SubscriptionDetailModal
          sub={selectedSub}
          onClose={() => setIsDetailOpen(false)}
          onAction={(type) => { setIsDetailOpen(false); handleAction(type, selectedSub.id); }}
        />
      )}

      {/* Assign Subscription Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Asignar Plan a Empresa
            </DialogTitle>
            <DialogDescription>
              Crea una nueva suscripción manual con snapshot de límites y funcionalidades.
            </DialogDescription>
          </DialogHeader>

          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit((d) => assignMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assignForm.control}
                  name="company_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar empresa" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies?.filter(c => !["active", "trial", "grace_period"].includes((c as any).current_subscription_status)).map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select value={field.value} onValueChange={(val) => {
                        field.onChange(val);
                        const p = plans?.find(x => x.id === val);
                        if (p) {
                          const cycle = assignForm.getValues("billing_cycle");
                          let price = "0";
                          if (cycle === "monthly") price = p.base_price_monthly;
                          else if (cycle === "semestral") price = p.base_price_semestral;
                          else if (cycle === "annual") price = p.base_price_annual;
                          assignForm.setValue("base_price", price);
                          assignForm.setValue("final_price", price);
                        }
                      }}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plans?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciclo de Facturación</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Ciclo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Inicial</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="grace_period">Período de Gracia</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Fin / Renovación</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Base ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={assignForm.control}
                  name="final_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Final ($)</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={assignMutation.isPending} className="w-full">
                  {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Asignación
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ---- Subcomponents ---- //

function KPICard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground leading-none mb-1.5">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionActions({ sub, onAction, onDetail }: { sub: any; onAction: (type: string, id: string) => void; onDetail: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones Rápidas</DropdownMenuLabel>
        <DropdownMenuItem onClick={onDetail}><LayoutGrid className="mr-2 h-4 w-4" /> Ver Detalles</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("plan", sub.id)}><TrendingUp className="mr-2 h-4 w-4" /> Cambiar Plan</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("addon", sub.id)}><Plus className="mr-2 h-4 w-4" /> Agregar Addon</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("discount", sub.id)}><Tag className="mr-2 h-4 w-4" /> Aplicar Descuento</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction("grace_period", sub.id)}><Clock className="mr-2 h-4 w-4 text-orange-500" /> Extender Gracia</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("cancel", sub.id)} className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
          <Trash2 className="mr-2 h-4 w-4" /> Cancelar Suscripción
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActionDialog({ modalState, onClose, plans, onExecute, isLoading }: { modalState: { type: string, subId: string }, onClose: () => void, plans: any[], onExecute: (data: any) => void, isLoading: boolean }) {
  const [formData, setFormData] = useState<any>({});

  const config: Record<string, { title: string, desc: string }> = {
    plan: { title: "Cambiar Plan", desc: "Selecciona el nuevo plan para esta suscripción. Los límites se actualizarán automáticamente." },
    addon: { title: "Agregar Addon", desc: "Registra un nuevo addon o servicio extra." },
    discount: { title: "Aplicar Descuento", desc: "Agrega un descuento manual o código promocional a esta suscripción." },
    grace_period: { title: "Extender Periodo de Gracia", desc: "Otorga más tiempo antes de que la suscripción caduque por falta de pago." },
    cancel: { title: "Cancelar Suscripción", desc: "¿Estás seguro de que deseas cancelar esta suscripción? Esta acción cambiará el estado." },
  };

  const current = config[modalState.type];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecute(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.desc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">

          {modalState.type === "plan" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nuevo Plan</label>
              <Select onValueChange={(val) => setFormData({ plan_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {modalState.type === "addon" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Addon</label>
                <Input required placeholder="Ej. WhatsApp Channel Extra" onChange={(e) => setFormData({ ...formData, addon_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio Mensual ($)</label>
                <Input type="number" step="0.01" required placeholder="0.00" onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
            </>
          )}

          {modalState.type === "discount" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Código / Referencia</label>
                <Input required placeholder="Ej. BLACKFRIDAY2026" onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto a descontar ($)</label>
                <Input type="number" step="0.01" required placeholder="0.00" onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
              </div>
            </>
          )}

          {modalState.type === "grace_period" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Fecha de Fin</label>
              <Input type="date" required onChange={(e) => setFormData({ end_date: e.target.value })} />
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} variant={modalState.type === 'cancel' ? 'destructive' : 'default'}>
              {isLoading ? "Procesando..." : "Confirmar Accion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionDetailModal({ sub, onClose, onAction }: { sub: any; onClose: () => void; onAction: (type: string) => void }) {
  const status = statusConfig[sub.status] || statusConfig.trial;
  const StatusIcon = status.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border/50 p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-muted/50 to-muted/20 px-6 py-5 border-b flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold tracking-tight">{sub.company_name || 'Empresa Desconocida'}</h2>
              <Badge className={`${status.color} shadow-none border-0`}>
                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">ID: <span className="font-mono">{sub.id}</span></p>
          </div>
          <div className="text-right">
            <h3 className="text-3xl font-bold text-primary">$ {(parseFloat(sub.final_price) || 0).toFixed(2)}</h3>
            <p className="text-sm text-muted-foreground capitalize">{sub.billing_cycle}</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-6 h-12">
            <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12">General</TabsTrigger>
            <TabsTrigger value="addons" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12">Addons & Descuentos</TabsTrigger>
            <TabsTrigger value="usage" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12">Uso y Límites</TabsTrigger>
          </TabsList>

          <div className="p-6 h-[400px] overflow-y-auto w-full">
            <TabsContent value="general" className="m-0 space-y-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plan Actual</p>
                  <p className="font-medium text-lg">{sub.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Creada el</p>
                  <p className="font-medium">{new Date(sub.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inicio Periodo</p>
                  <p className="font-medium">{new Date(sub.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fin Periodo (Renovación)</p>
                  <p className="font-medium">{new Date(sub.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Precio Base</p>
                  <p className="font-medium">$ {(parseFloat(sub.base_price) || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Setup Fee Inicial</p>
                  <p className="font-medium">$ {(parseFloat(sub.setup_fee_paid) || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" onClick={() => onAction('plan')}><TrendingUp className="w-4 h-4 mr-2" />Cambiar Plan</Button>
                <Button variant="outline" size="sm" onClick={() => onAction('grace_period')}><Clock className="w-4 h-4 mr-2" />Gracia</Button>
                <Button variant="destructive" size="sm" onClick={() => onAction('cancel')}><Trash2 className="w-4 h-4 mr-2" />Cancelar Membresía</Button>
              </div>
            </TabsContent>

            <TabsContent value="addons" className="m-0 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center"><Plus className="w-5 h-5 mr-2 text-primary" /> Addons Activos</h3>
                  <Button size="sm" variant="secondary" onClick={() => onAction('addon')}>Añadir Addon</Button>
                </div>
                {sub.addons_count > 0 ? (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 flex items-center justify-between border-b last:border-0 hover:bg-muted/20">
                      <div>
                        <p className="font-medium">Hay {sub.addons_count} addons activos.</p>
                        <p className="text-sm text-muted-foreground">Ver la base de datos para el detalle exhaustivo temporalmente.</p>
                      </div>
                    </div>
                  </div>
                ) : <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-dashed">No hay addons asociados.</p>}
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center"><Tag className="w-5 h-5 mr-2 text-primary" /> Descuentos Especiales</h3>
                  <Button size="sm" variant="secondary" onClick={() => onAction('discount')}>Aplicar Descuento</Button>
                </div>
                {sub.discounts_count > 0 ? (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-4 flex items-center justify-between border-b last:border-0 hover:bg-muted/20">
                      <div>
                        <p className="font-medium">Hay {sub.discounts_count} descuentos aplicados.</p>
                      </div>
                    </div>
                  </div>
                ) : <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-dashed">No hay descuentos.</p>}
              </div>
            </TabsContent>

            <TabsContent value="usage" className="m-0">
              <h3 className="text-lg font-medium mb-4 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary" /> Consumo del Ciclo Actual</h3>

              {sub.usage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="shadow-none border border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Mensajes Multi-Agente</p>
                        <div className="flex items-end justify-between">
                          <h4 className="text-2xl font-bold">{sub.usage.messages.toLocaleString()}</h4>
                          {sub.snapshot_limits?.messages && <span className="text-sm text-muted-foreground mb-1">/ {sub.snapshot_limits.messages}</span>}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Agentes Existentes</p>
                        <div className="flex items-end justify-between">
                          <h4 className="text-2xl font-bold">{sub.usage.agents.toLocaleString()}</h4>
                          {sub.snapshot_limits?.agents && <span className="text-sm text-muted-foreground mb-1">/ {sub.snapshot_limits.agents}</span>}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Integraciones Activas</p>
                        <h4 className="text-2xl font-bold">{sub.usage.integrations.toLocaleString()}</h4>
                      </CardContent>
                    </Card>
                    <Card className="shadow-none border border-border">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Almacenamiento (MB)</p>
                        <h4 className="text-2xl font-bold">{sub.usage.storage}</h4>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-dashed text-center mt-6">
                  No hay datos de uso registrados en este ciclo.
                </p>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
