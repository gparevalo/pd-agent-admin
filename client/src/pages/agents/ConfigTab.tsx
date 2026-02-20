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
import { Globe, IdCard, Loader2, Save, Sparkle, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { configFormSchema, type ConfigFormData } from "./schemas";

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export function ConfigTab({
  agent,
  onSave,
  isSaving,
  onImproveWithAI,
}: {
  agent: Agent;
  onSave: (data: ConfigFormData) => void;
  isSaving: boolean;
  onImproveWithAI: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      service_description: (agent?.service_description as string) || "",
      website_url: (agent?.website_url as string) || "",
    },
  });

  // --- SINCRONIZACIÓN CON LA IA ---
  // Este efecto detecta cuando el objeto 'agent' cambia (cuando guardas desde el chat)
  // y actualiza los campos del formulario automáticamente.
  useEffect(() => {
    if (agent) {
      form.reset({
        service_description: (agent.service_description as string) || "",
        website_url: (agent.website_url as string) || "",
      });
    }
  }, [agent, form]);

  const handleGenerateDescription = async () => {
    const websiteUrl = form.getValues("website_url");

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
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/pd_scraping-web",
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
        form.setValue("service_description", data.descripcion_generada ?? "", {
          shouldDirty: true,
          shouldValidate: true,
        });
        toast({
          title: "¡Descripción generada!",
          description: "Se ha extraído la información de tu sitio web.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            data?.mensaje ?? "Ocurrió un error generando la descripción",
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
            <IdCard className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="pd-section-title">
              A qué se dedica tu empresa?
            </CardTitle>
            <CardDescription className="text-xs font-medium text-zinc-500">
              Entrena a tu agente con la identidad de tu negocio.
            </CardDescription>
          </div>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3 justify-between ">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      URL del Sitio Web
                    </FormLabel>

                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={isSaving}
                      onClick={onImproveWithAI}
                      className="shadow-primary/20 rounded-xl gap-2 font-bold text-xs h-10 transition-all"
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 text-primary" />
                      ) : (
                        <Sparkle className="mr-2 h-4 w-4 text-primary" />
                      )}
                      {isGenerating
                        ? "Escaneando sitio..."
                        : "Generar descripción"}
                    </Button>
                  </div>
                  <FormControl>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        {/* bg-zinc-50/50 dark:bg-zinc-900/50*/}
                        <Input
                          {...field}
                          placeholder="https://www.tuempresa.com"
                          className="pl-10 h-11   border-zinc-200 dark:border-zinc-800"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Usaremos esta URL para leer el contenido de tu página
                    automáticamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3 justify-between ">
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                      Descripción del Servicio
                    </FormLabel>

                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      disabled={isSaving}
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
                      placeholder="Describe detalladamente qué hace tu empresa..."
                      className="min-h-[250px]  border-zinc-200 dark:border-zinc-800 p-4 resize-none leading-relaxed focus:ring-primary/20"
                    />
                  </FormControl>
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
                {isSaving ? "Guardando cambios..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
