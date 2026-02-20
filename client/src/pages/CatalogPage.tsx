import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Briefcase,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  DollarSign,
  Clock,
  ListChecks,
  AlertTriangle,
  X,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import type { Catalog } from "@shared/schema";

const catalogFormSchema = z.object({
  item_type: z.enum(["product", "service"]),
  name: z.string().min(2, "Nombre requerido"),
  description: z.string().optional(),
  base_price: z.coerce.number().min(0, "Precio debe ser mayor o igual a 0"),
  currency: z.string().default("USD"),
  includes_text: z.string().optional(),
  restrictions_text: z.string().optional(),
  estimated_time: z.string().optional(),
  execution_process_text: z.string().optional(),
});

type CatalogFormData = z.infer<typeof catalogFormSchema>;

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between pt-4 border-t">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CatalogItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Catalog;
  onEdit: (item: Catalog) => void;
  onDelete: (item: Catalog) => void;
}) {
  const details = item.details as { includes?: string[]; restrictions?: string[]; estimated_time?: string } | null;
  const advConfig = item.advanced_config as { variable_pricing?: any } | null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover-elevate" data-testid={`card-catalog-item-${item.id}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
              {item.item_type === "service" ? (
                <Briefcase className="h-5 w-5 text-primary" />
              ) : (
                <Package className="h-5 w-5 text-primary" />
              )}
            </div>
            <Badge variant="outline" data-testid={`badge-type-${item.id}`}>
              {item.item_type === "service" ? "Servicio" : "Producto"}
            </Badge>
          </div>

          <h3 className="font-semibold text-base mb-1" data-testid={`text-name-${item.id}`}>
            {item.name}
          </h3>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          {details?.estimated_time && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>{details.estimated_time}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-muted gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg" data-testid={`text-price-${item.id}`}>
                {parseFloat(item.base_price || "0").toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">{item.currency}</span>
              {advConfig?.variable_pricing && (
                <Badge variant="secondary" className="ml-1">Variable</Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                data-testid={`button-edit-${item.id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                data-testid={`button-delete-${item.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CatalogModal({
  open,
  onOpenChange,
  editingItem,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: Catalog | null;
  companyId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const details = editingItem?.details as { includes?: string[]; restrictions?: string[]; estimated_time?: string } | null;
  const advConfig = editingItem?.advanced_config as { execution_process?: string[] } | null;

  const form = useForm<CatalogFormData>({
    resolver: zodResolver(catalogFormSchema),
    defaultValues: {
      item_type: "service",
      name: "",
      description: "",
      base_price: 0,
      currency: "USD",
      includes_text: "",
      restrictions_text: "",
      estimated_time: "",
      execution_process_text: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editingItem) {
        form.reset({
          item_type: (editingItem.item_type as "product" | "service") || "service",
          name: editingItem.name,
          description: editingItem.description || "",
          base_price: parseFloat(editingItem.base_price || "0"),
          currency: editingItem.currency || "USD",
          includes_text: details?.includes?.join("\n") || "",
          restrictions_text: details?.restrictions?.join("\n") || "",
          estimated_time: details?.estimated_time || "",
          execution_process_text: advConfig?.execution_process?.join("\n") || "",
        });
      } else {
        form.reset({
          item_type: "service",
          name: "",
          description: "",
          base_price: 0,
          currency: "USD",
          includes_text: "",
          restrictions_text: "",
          estimated_time: "",
          execution_process_text: "",
        });
      }
    }
  }, [open, editingItem]);

  const createMutation = useMutation({
    mutationFn: async (data: CatalogFormData) => {
      const body = {
        company_id: companyId,
        item_type: data.item_type,
        name: data.name,
        description: data.description || null,
        base_price: data.base_price,
        currency: data.currency,
        details: {
          includes: data.includes_text ? data.includes_text.split("\n").filter(Boolean) : [],
          restrictions: data.restrictions_text ? data.restrictions_text.split("\n").filter(Boolean) : [],
          estimated_time: data.estimated_time || "",
        },
        advanced_config: {
          variable_pricing: null,
          execution_process: data.execution_process_text ? data.execution_process_text.split("\n").filter(Boolean) : [],
        },
      };
      return apiRequest("POST", "/api/catalog", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog", companyId] });
      toast({ title: "Item creado", description: "El item se ha agregado al catálogo" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CatalogFormData) => {
      const body = {
        item_type: data.item_type,
        name: data.name,
        description: data.description || null,
        base_price: data.base_price,
        currency: data.currency,
        details: {
          includes: data.includes_text ? data.includes_text.split("\n").filter(Boolean) : [],
          restrictions: data.restrictions_text ? data.restrictions_text.split("\n").filter(Boolean) : [],
          estimated_time: data.estimated_time || "",
        },
        advanced_config: {
          variable_pricing: null,
          execution_process: data.execution_process_text ? data.execution_process_text.split("\n").filter(Boolean) : [],
        },
      };
      return apiRequest("PATCH", `/api/catalog/${editingItem!.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog", companyId] });
      toast({ title: "Item actualizado", description: "Los cambios se han guardado" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const onSubmit = (data: CatalogFormData) => {
    if (editingItem) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const watchType = form.watch("item_type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {editingItem ? "Editar Item" : "Nuevo Item"}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? "Modifica los datos del producto o servicio"
              : "Agrega un nuevo producto o servicio al catálogo"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="item_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="product">Producto</SelectItem>
                        <SelectItem value="service">Servicio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="COP">COP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ej: Diseño Web Pro"
                      data-testid="input-catalog-name"
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
                    <Textarea
                      {...field}
                      placeholder="Descripción del producto o servicio..."
                      className="min-h-[80px] resize-none"
                      data-testid="textarea-catalog-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="base_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Base</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        className="pl-10"
                        data-testid="input-catalog-price"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold">Detalles de Valor</h4>
              </div>

              <FormField
                control={form.control}
                name="includes_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incluye (una línea por elemento)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={"Diseño personalizado\nSoporte técnico\nCapacitación"}
                        className="min-h-[80px] resize-none text-sm"
                        data-testid="textarea-includes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restrictions_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restricciones (una línea por elemento)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={"Máximo 5 revisiones\nNo incluye hosting"}
                        className="min-h-[60px] resize-none text-sm"
                        data-testid="textarea-restrictions"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo Estimado</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: 3-5 días hábiles"
                        data-testid="input-estimated-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchType === "service" && (
              <div className="space-y-4 p-4 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Proceso de Ejecución</h4>
                </div>
                <FormField
                  control={form.control}
                  name="execution_process_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pasos (uno por línea)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={"Paso 1: Auditoría inicial\nPaso 2: Diseño\nPaso 3: Desarrollo\nPaso 4: Entrega"}
                          className="min-h-[100px] resize-none text-sm"
                          data-testid="textarea-execution-process"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-catalog"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending}
                data-testid="button-save-catalog"
              >
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : editingItem ? (
                  "Guardar Cambios"
                ) : (
                  "Crear Item"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  item,
  companyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Catalog | null;
  companyId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/catalog/${item!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/catalog", companyId] });
      toast({ title: "Item eliminado", description: "El item ha sido eliminado del catálogo" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Item
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar "{item?.name}"? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-delete"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</>
            ) : (
              "Eliminar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CatalogPage() {
  const { company } = useAuth();
  const companyId = company?.id || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Catalog | null>(null);
  const [deletingItem, setDeletingItem] = useState<Catalog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: items, isLoading } = useQuery<Catalog[]>({
    queryKey: ["/api/catalog", companyId],
    enabled: !!companyId,
  });

  const handleEdit = (item: Catalog) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const filteredItems = items?.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.item_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const productCount = items?.filter((i) => i.item_type === "product").length || 0;
  const serviceCount = items?.filter((i) => i.item_type === "service").length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="pd-page-title" data-testid="text-catalog-title">
            Catálogo
          </h1>
          <p className="pd-page-subtitle">
            Gestión de productos y servicios
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-new-catalog-item">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Item
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-catalog-search"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              data-testid="button-filter-all"
            >
              Todos ({items?.length || 0})
            </Button>
            <Button
              variant={typeFilter === "product" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("product")}
              data-testid="button-filter-products"
            >
              <Package className="mr-1 h-3 w-3" />
              Productos ({productCount})
            </Button>
            <Button
              variant={typeFilter === "service" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("service")}
              data-testid="button-filter-services"
            >
              <Briefcase className="mr-1 h-3 w-3" />
              Servicios ({serviceCount})
            </Button>
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cards")}
              data-testid="button-catalog-view-cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              data-testid="button-catalog-view-table"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <CatalogSkeleton />
      ) : !filteredItems?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg mb-1" data-testid="text-empty-catalog">
              {searchTerm || typeFilter !== "all"
                ? "No se encontraron resultados"
                : "Tu catálogo está vacío"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || typeFilter !== "all"
                ? "Intenta con otros filtros de búsqueda"
                : "Agrega tu primer producto o servicio para comenzar"}
            </p>
            {!searchTerm && typeFilter === "all" && (
              <Button onClick={handleCreate} data-testid="button-empty-create">
                <Plus className="mr-2 h-4 w-4" />
                Crear primer item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <CatalogItemCard
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onDelete={(item) => setDeletingItem(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-20">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${item.item_type === "product" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}>
                              {item.item_type === "product" ? (
                                <Package className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Briefcase className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.item_type === "product" ? "default" : "secondary"}>
                            {item.item_type === "product" ? "Producto" : "Servicio"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {item.base_price ? `$${parseFloat(item.base_price).toLocaleString()}` : "—"}
                          </span>
                          {item.currency && item.base_price && (
                            <span className="text-xs text-muted-foreground ml-1">{item.currency}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Activo</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-catalog-${item.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingItem(item)} data-testid={`button-delete-catalog-${item.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <CatalogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingItem}
        companyId={companyId}
      />

      <DeleteConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => { if (!open) setDeletingItem(null); }}
        item={deletingItem}
        companyId={companyId}
      />
    </div>
  );
}
