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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Agent } from "@shared/schema";
import { motion } from "framer-motion";
import {
  Globe,
  Loader2,
  MessageCircleQuestion,
  Save,
  Sparkle,
  Wand2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { knowledgeFormSchema, type KnowledgeFormData } from "./schemas";

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function KnowledgeTab({
  agent,
  onSave,
  isSaving,
  onImproveWithAI,
}: {
  agent: Agent;
  onSave: (data: KnowledgeFormData) => void;
  isSaving: boolean;
  onImproveWithAI: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Extraemos la configuración de forma segura
  const config = agent.configuration as Record<string, unknown> | null;

  const form = useForm<KnowledgeFormData>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      faq: (agent?.faq as string) || "",
      knowledge_url: (config?.knowledge_url as string) || "",
    },
  });

  // --- SINCRONIZACIÓN AUTOMÁTICA ---
  // Este efecto resetea el formulario cuando el objeto agent cambia
  // (por ejemplo, al guardar desde el chat de SebastIAn)
  useEffect(() => {
    if (agent) {
      const updatedConfig = agent.configuration as Record<
        string,
        unknown
      > | null;
      form.reset({
        faq: (agent.faq as string) || "",
        knowledge_url: (updatedConfig?.knowledge_url as string) || "",
      });
    }
  }, [agent, form]);

  const handleGenerateDescription = async () => {
    const websiteUrl = form.getValues("knowledge_url");

    if (!websiteUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes ingresar una URL primero",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/pd_generate_scraping_faq",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url_web: websiteUrl,
            user_id: agent.user_id,
            company_id: agent.company_id,
            agent_id: agent.id,
          }),
        },
      );

      const data = await response.json();

      if (data?.success === true) {
        form.setValue("faq", data.descripcion_generada ?? "", {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast({
          title: "FAQs generadas",
          description: "Se han extraído preguntas y respuestas del sitio web.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            data?.mensaje ?? "Ocurrió un error generando las preguntas",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo conectar con el servicio de IA",
      });
    } finally {
      setIsGenerating(false);
    }
  };

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
            <MessageCircleQuestion className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="pd-section-title">
              Preguntas Frecuentes
            </CardTitle>
            <CardDescription className="text-xs font-medium text-zinc-500">
              Entrena al agente con el conocimiento específico de tu negocio.
            </CardDescription>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="knowledge_url"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3 justify-between ">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      URL de Fuente de Conocimiento
                    </FormLabel>

                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      disabled={isGenerating}
                      onClick={handleGenerateDescription}
                      className="shadow-primary/20 rounded-xl gap-2 font-bold text-xs h-10 transition-all"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 text-primary" />
                      ) : (
                        <Sparkle className="mr-2 h-4 w-4 text-primary" />
                      )}
                      {isGenerating ? "Analizando..." : "Obtener preguntas"}
                    </Button>
                  </div>
                  <FormControl>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="relative flex-1">
                        {/* bg-zinc-50/50 dark:bg-zinc-900/50*/}
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="https://www.ejemplo.com/faq"
                          className="pl-10 h-11   border-zinc-200 dark:border-zinc-800"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Extrae automáticamente FAQs de cualquier página pública.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="faq"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3 justify-between ">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      Contenido de FAQs
                    </FormLabel>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={onImproveWithAI}
                      className="shadow-primary/20 rounded-xl gap-2 font-bold text-xs h-10 transition-all"
                    >
                      <Wand2 className="mr-2 h-4 w-4 text-primary" />
                      Optimizar con IA
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={`¿Cómo funciona el servicio?\nRespuesta: Operamos de forma automática...\n\n¿Tienen soporte?\nRespuesta: Sí, 24/7.`}
                      className="min-h-[280px]  border-zinc-200 dark:border-zinc-800 p-4 resize-none leading-relaxed font-sans text-sm focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Tip: Mantén un formato claro de Pregunta y Respuesta para
                    mejores resultados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="pd-save-btn bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
