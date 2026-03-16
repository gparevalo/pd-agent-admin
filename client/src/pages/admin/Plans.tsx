import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { FileText, Plus, MoreHorizontal, Loader2, DollarSign, Edit, Power, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Plan } from "@shared/schema";

const planFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().optional(),
  base_price_monthly: z.string().min(1, "El precio mensual es requerido"),
  base_price_semestral: z.string().min(1, "El precio semestral es requerido"),
  base_price_annual: z.string().min(1, "El precio anual es requerido"),
});

type PlanFormData = z.infer<typeof planFormSchema>;

export default function AdminPlans() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: !!token,
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      base_price_monthly: "",
      base_price_semestral: "",
      base_price_annual: "",
    },
  });

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, data, token || undefined);
        toast({ title: "Plan actualizado", description: "El plan ha sido actualizado exitosamente." });
      } else {
        await api.post("/admin/plans", data, token || undefined);
        toast({ title: "Plan creado", description: "El plan ha sido creado exitosamente." });
      }
      form.reset();
      setModalOpen(false);
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar plan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (plan: Plan) => {
    try {
      await api.put(`/admin/plans/${plan.id}`, { is_active: !plan.is_active }, token || undefined);
      toast({ title: "Estado actualizado", description: `Plan ${plan.is_active ? 'inactivado' : 'activado'}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del plan." });
    }
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      description: plan.description || "",
      base_price_monthly: plan.base_price_monthly?.toString() || "",
      base_price_semestral: plan.base_price_semestral?.toString() || "",
      base_price_annual: plan.base_price_annual?.toString() || "",
    });
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingPlan(null);
    form.reset({
      name: "", description: "", base_price_monthly: "", base_price_semestral: "", base_price_annual: ""
    });
    setModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="pd-page-title">Planes</h1>
          <p className="pd-page-subtitle">Gestiona los planes de suscripción</p>
        </div>
        <Button onClick={handleOpenNew} data-testid="button-new-plan">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : plans && plans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Mensual</TableHead>
                  <TableHead>Semestral</TableHead>
                  <TableHead>Anual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-medium">{plan.name}</span>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${plan.base_price_monthly} USD</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${plan.base_price_semestral} USD</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${plan.base_price_annual} USD</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"} className={plan.is_active ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                        {plan.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {plan.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(plan)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(plan)}>
                            <Power className={`h-4 w-4 mr-2 ${plan.is_active ? 'text-red-500' : 'text-green-500'}`} />
                            {plan.is_active ? 'Inactivar' : 'Activar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay planes creados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Plan</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Plan Profesional" data-testid="input-plan-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Descripción del plan..." data-testid="input-plan-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="base_price_monthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Mensual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="number" step="0.01" placeholder="29.99" className="pl-10" data-testid="input-price-monthly" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_price_semestral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Semestral</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="number" step="0.01" placeholder="149.99" className="pl-10" data-testid="input-price-semestral" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_price_annual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio Anual</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input {...field} type="number" step="0.01" placeholder="249.99" className="pl-10" data-testid="input-price-annual" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-save-plan">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Plan"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
