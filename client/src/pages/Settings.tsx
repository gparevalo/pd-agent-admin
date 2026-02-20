import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Image,
  Save,
  Loader2,
  Globe,
  Mail,
  Phone,
  MapPin,
  User,
  Shield,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { api } from "@/lib/api";
import type { Company } from "@shared/schema";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  company_admin: "Administrador de Empresa",
  client_admin: "Administrador de Cliente",
};

const settingsSchema = z.object({
  company_name: z.string().min(2, "El nombre es requerido"),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  contact_email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  contact_phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

type SettingsData = z.infer<typeof settingsSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Settings() {
  const { token, user, company, updateCompany } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      company_name: company?.name || "",
      logo_url: company?.logo_url || "",
      website: company?.website || "",
      contact_email: company?.contact_email || "",
      contact_phone: company?.contact_phone || "",
      address: company?.address || "",
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        company_name: company.name,
        logo_url: company.logo_url || "",
        website: company.website || "",
        contact_email: company.contact_email || "",
        contact_phone: company.contact_phone || "",
        address: company.address || "",
      });
    }
  }, [company, form]);

  const onSubmit = async (data: SettingsData) => {
    setIsLoading(true);
    try {
      const updated = await api.put<Company>(
        "/company/theme",
        data,
        token || undefined,
      );
      updateCompany(updated);
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo guardar",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="pd-page-title" data-testid="text-settings-title">
            Configuración
          </h1>
          <p className="pd-page-subtitle">
            Administra tu perfil y los datos de tu empresa
          </p>
        </div>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#EF0034]/5 rounded-full -mr-30 -mt-30 blur-[80px]" />
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="pd-icon-box">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="pd-section-title">Mi Perfil</CardTitle>
                  <CardDescription className="text-xs font-medium text-zinc-500">
                    Información de tu cuenta personal
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 relative z-10">
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#EF0034]/10 text-[#EF0034] text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">{user?.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" />
                    {roleLabels[user?.role || ""] || user?.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="pd-panel flex items-center gap-4"
                  data-testid="info-email"
                >
                  <div className="pd-icon-box-sm">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="pd-label mb-1">Correo electrónico</p>
                    <p className="font-medium text-sm">{user?.email}</p>
                  </div>
                </div>

                <div
                  className="pd-panel flex items-center gap-4"
                  data-testid="info-company"
                >
                  <div className="pd-icon-box-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="pd-label mb-1">Empresa</p>
                    <p className="font-medium text-sm">
                      {company?.name || "—"}
                    </p>
                  </div>
                </div>

                <div
                  className="pd-panel flex items-center gap-4"
                  data-testid="info-date"
                >
                  <div className="pd-icon-box-sm">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="pd-label mb-1">Miembro desde</p>
                    <p className="font-medium text-sm">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6">
              <div className="flex items-center gap-4">
                <div className="pd-icon-box">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="pd-section-title">
                    Datos de Empresa
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-zinc-500">
                    Actualiza la información de tu empresa
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">
                            Nombre de la Empresa
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Mi Empresa"
                              data-testid="input-company-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Image className="h-3 w-3" />
                            URL del Logo
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://ejemplo.com/logo.png"
                              data-testid="input-logo-url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          Sitio Web
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://miempresa.com"
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="contact_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            Email de Contacto
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contacto@empresa.com"
                              data-testid="input-contact-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            Teléfono
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="+52 123 456 7890"
                              data-testid="input-contact-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          Dirección
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Calle, número, colonia, ciudad, país"
                            className="resize-none"
                            data-testid="input-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="pd-save-btn bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                      data-testid="button-save-settings"
                    >
                      {isLoading ? (
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
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
