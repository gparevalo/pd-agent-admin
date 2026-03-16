import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Tag, Plus, MoreHorizontal, Loader2, Percent, Calendar, DollarSign, Edit, Power, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import type { DiscountCode } from "@shared/schema";

const discountFormSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres").max(20),
  description: z.string().optional(),
  discount_type: z.string().default("percentage"),
  discount_value: z.string().min(1, "El valor es requerido"),
  billing_cycle: z.string().optional(),
  end_date: z.string().optional(),
  max_uses: z.string().optional(),
});

type DiscountFormData = z.infer<typeof discountFormSchema>;

export default function AdminDiscounts() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: discounts, isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discounts"],
    enabled: !!token,
  });

  const form = useForm<DiscountFormData>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      billing_cycle: "",
      end_date: "",
      max_uses: "",
    },
  });

  const onSubmit = async (data: DiscountFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        billing_cycle: data.billing_cycle || null,
        end_date: data.end_date || null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
      };

      if (editingDiscount) {
        await api.put(`/admin/discounts/${editingDiscount.id}`, payload, token || undefined);
        toast({ title: "Descuento actualizado", description: "El código ha sido actualizado." });
      } else {
        await api.post("/admin/discounts", payload, token || undefined);
        toast({ title: "Descuento creado", description: "El código de descuento ha sido creado." });
      }
      form.reset();
      setModalOpen(false);
      setEditingDiscount(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar descuento",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (discount: DiscountCode) => {
    try {
      await api.put(`/admin/discounts/${discount.id}`, { is_active: !discount.is_active }, token || undefined);
      toast({ title: "Estado actualizado", description: `Descuento ${discount.is_active ? 'inactivado' : 'activado'}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discounts"] });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado del descuento." });
    }
  };

  const openEditModal = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    form.reset({
      code: discount.code,
      description: discount.description || "",
      discount_type: discount.discount_type || "percentage",
      discount_value: discount.discount_value?.toString() || "",
      billing_cycle: discount.billing_cycle || "",
      end_date: discount.end_date ? new Date(discount.end_date).toISOString().split('T')[0] : "",
      max_uses: discount.max_uses?.toString() || "",
    });
    setModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingDiscount(null);
    form.reset({
      code: "", description: "", discount_type: "percentage", discount_value: "", billing_cycle: "", end_date: "", max_uses: ""
    });
    setModalOpen(true);
  };

  const formatDiscount = (discount: DiscountCode) => {
    if (discount.discount_type === "percentage") {
      return `${discount.discount_value}% OFF`;
    }
    return `$${discount.discount_value} OFF`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="pd-page-title">Descuentos</h1>
          <p className="pd-page-subtitle">Gestiona los códigos de descuento</p>
        </div>
        <Button onClick={handleOpenNew} data-testid="button-new-discount">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Descuento
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
          ) : discounts && discounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <span className="font-mono font-medium">{discount.code}</span>
                          {discount.description && (
                            <p className="text-xs text-muted-foreground">{discount.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {formatDiscount(discount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {discount.billing_cycle || "Todos"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {discount.used_count || 0} / {discount.max_uses || "∞"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.is_active ? "default" : "secondary"} className={discount.is_active ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" : ""}>
                        {discount.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {discount.is_active ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => openEditModal(discount)}>
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(discount)}>
                            <Power className={`h-4 w-4 mr-2 ${discount.is_active ? 'text-red-500' : 'text-green-500'}`} />
                            {discount.is_active ? 'Inactivar' : 'Activar'}
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
              <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No hay descuentos creados</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="DESCUENTO20"
                        className="uppercase font-mono"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        data-testid="input-discount-code"
                      />
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
                      <Input {...field} placeholder="Descuento de bienvenida" data-testid="input-discount-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-discount-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje</SelectItem>
                          <SelectItem value="fixed">Monto Fijo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discount_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <div className="relative">
                          {form.watch("discount_type") === "percentage" ? (
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          )}
                          <Input {...field} type="number" min="0" step="0.01" placeholder="20" className="pl-10" data-testid="input-discount-value" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billing_cycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciclo (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-discount-cycle">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_uses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máx. Usos</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" placeholder="Ilimitado" data-testid="input-max-uses" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Válido Hasta (Opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="date" className="pl-10" data-testid="input-discount-end-date" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting} data-testid="button-save-discount">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Descuento"
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
