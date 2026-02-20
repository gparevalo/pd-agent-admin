import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Agent } from "@shared/schema";
import { motion } from "framer-motion";
import { Bot, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { emojiStyles, toneLabels } from "./constants";
import { infoFormSchema, type InfoFormData } from "./schemas";

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function InfoTab({
  agent,
  onSave,
  isSaving,
}: {
  agent: Agent;
  onSave: (data: InfoFormData) => void;
  isSaving: boolean;
}) {
  const config = agent.configuration as Record<string, unknown> | null;

  const form = useForm<InfoFormData>({
    resolver: zodResolver(infoFormSchema),
    defaultValues: {
      name: agent.name,
      tone: agent.tone || "professional",
      emoji_style: agent.emoji_style || "none",
      website_url: (config?.website_url as string) || "",
      status: agent.status || "active",
      purpose: agent.purpose || "",
    },
  });

  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="p-1"
    >
      <div className="w-full space-y-8 px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="pd-icon-box">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="pd-section-title">
              Información del Agente
            </CardTitle>
            <CardDescription className="text-xs font-medium text-zinc-500">
              Configura los datos básicos de tu agente
            </CardDescription>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
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
                      data-testid="input-agent-detail-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propósito del Agente</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ej: Calificar leads y agendar citas con el equipo de ventas"
                      data-testid="input-agent-detail-purpose"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tono de comunicación</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-agent-detail-tone">
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
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Estado del Agente
                    </FormLabel>
                    <FormDescription>
                      {field.value === "active"
                        ? "El agente está activo y puede responder"
                        : "El agente está pausado"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === "active"}
                      onCheckedChange={(checked) =>
                        field.onChange(checked ? "active" : "inactive")
                      }
                      data-testid="switch-agent-detail-status"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                data-testid="button-save-info"
                className="pd-save-btn bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
