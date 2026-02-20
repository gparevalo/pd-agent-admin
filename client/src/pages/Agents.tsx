import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Agent } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Eye,
  Loader2,
  Plus,
  Power,
  PowerOff,
  Settings,
  Smile,
  Target,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { emojiStyles } from "./agents/constants";

const agentFormSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  tone: z.string().default("professional"),
  emoji_style: z.string().default("none"),
  purpose: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentFormSchema>;

const toneLabels: Record<string, { label: string; description: string }> = {
  professional: { label: "Profesional", description: "Formal y conciso" },
  friendly: { label: "Amigable", description: "Cercano y empático" },
  formal: { label: "Formal", description: "Muy formal y serio" },
};

function AgentCard({
  agent,
  onEdit,
  onView,
}: {
  agent: Agent;
  onEdit: (agent: Agent) => void;
  onView: (agent: Agent) => void;
}) {
  const isActive = agent.status === "active";
  const config = agent.configuration as {
    objective?: string;
    use_emojis?: boolean;
  } | null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="hover-elevate cursor-pointer"
      onClick={() => onView(agent)}
      data-testid={`card-agent-${agent.id}`}
    >
      <Card
        className={`transition-all duration-200 ${!isActive ? "opacity-60" : ""}`}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? (
                  <>
                    <Power className="h-3 w-3 mr-1" /> Activo
                  </>
                ) : (
                  <>
                    <PowerOff className="h-3 w-3 mr-1" /> Inactivo
                  </>
                )}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(agent);
                }}
                title="Ver detalle"
                data-testid={`button-view-agent-${agent.id}`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Settings className="h-3 w-3" />
              {toneLabels[agent.tone || "professional"]?.label || agent.tone}
            </span>
            {(agent.emoji_style || config?.use_emojis) && (
              <span className="flex items-center gap-1">
                <Smile className="h-3 w-3" />
                Emojis
              </span>
            )}
          </div>

          {config?.objective && (
            <div className="mt-3 p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Target className="h-3 w-3" />
                Objetivo
              </p>
              <p className="text-sm line-clamp-2">{config.objective}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AgentModal({
  open,
  onOpenChange,
  onSuccess,
  editingAgent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingAgent?: Agent;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: {
      name: editingAgent?.name || "",
      tone: editingAgent?.tone || "professional",
      emoji_style: editingAgent?.emoji_style || "none",
      purpose: editingAgent?.purpose || "",
    },
  });
  useEffect(() => {
    // debug: show when modal opens and what agent is passed
    // eslint-disable-next-line no-console
    console.debug(
      "AgentModal useEffect: open=",
      open,
      "editingAgent=",
      editingAgent,
    );
    if (open && editingAgent) {
      form.reset({
        name: editingAgent.name,
        tone: editingAgent.tone || "professional",
        emoji_style: editingAgent.emoji_style || "none",
        purpose: editingAgent.purpose || "",
      });
    } else if (open && !editingAgent) {
      form.reset({
        name: "",
        tone: "professional",
        emoji_style: "none",
        purpose: "",
      });
    }
  }, [open, editingAgent, form]);

  const onSubmit = async (data: AgentFormData) => {
    setIsSubmitting(true);
    try {
      if (editingAgent) {
        // Actualizar agente existente
        await api.put(`/agents/${editingAgent.id}`, data, token || undefined);
        toast({
          title: "Agente actualizado",
          description: "Los cambios han sido guardados exitosamente.",
        });
      } else {
        // Crear nuevo agente
        await api.post("/agents", data, token || undefined);
        toast({
          title: "Agente creado",
          description: "El agente ha sido configurado exitosamente.",
        });
      }
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Error al guardar agente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {editingAgent ? "Editar Agente IA" : "Nuevo Agente IA"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Agente</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Asistente de Ventas"
                      data-testid="input-agent-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tono de comunicación</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-agent-tone">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(toneLabels).map(
                        ([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <p>{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {description}
                              </p>
                            </div>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emoji_style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estilo de Emojis</FormLabel>
                  <Select
                    value={field.value || "none"}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-agent-detail-emoji">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emojiStyles.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ej: Calificar leads y agendar citas con el equipo de ventas"
                      className="resize-none"
                      rows={3}
                      data-testid="input-agent-purpose"
                    />
                  </FormControl>
                  <FormDescription>
                    Define el objetivo principal del agente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-save-agent"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingAgent ? "Actualizando..." : "Creando..."}
                  </>
                ) : editingAgent ? (
                  "Actualizar Agente"
                ) : (
                  "Crear Agente"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Agents() {
  const { token } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(
    undefined,
  );

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    enabled: !!token,
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
    setEditingAgent(undefined);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setModalOpen(true);
  };

  const handleView = (agent: Agent) => {
    navigate(`/agents/${agent.id}`);
  };

  const handleNewAgent = () => {
    setEditingAgent(undefined);
    setModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="pd-page-title">Agentes IA</h1>
          <p className="pd-page-subtitle">Configura tus asistentes virtuales</p>
        </div>
        <Button onClick={handleNewAgent} data-testid="button-new-agent">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Agente
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : agents && agents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={handleEdit}
                  onView={handleView}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bot className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              No hay agentes configurados
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crea tu primer agente IA para automatizar las conversaciones con
              tus clientes
            </p>
            <Button onClick={handleNewAgent}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Agente
            </Button>
          </motion.div>
        )}

        <AgentModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={handleSuccess}
          editingAgent={editingAgent}
        />
      </motion.div>
    </div>
  );
}
