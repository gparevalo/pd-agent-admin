import { WhatsappDialog } from "@/components/common/WhatsappDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog, DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Company } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, Copy, Edit2, ExternalLink, Eye, EyeOff, Loader2, Mail, MessageCircle, Phone, Plus, Rocket, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { z } from "zod";

// Schema for Creation (Company + Admin)
const createCompanySchema = z.object({
  company: z.object({
    name: z.string().min(2, "Nombre requerido"),
    legal_name: z.string().optional(),
    industry: z.string().optional(),
    logo_url: z.string().optional(),
    website: z.string().optional(),
    contact_email: z.string().email("Email inválido").optional().or(z.literal("")),
    contact_phone: z.string().optional(),
    address: z.string().optional(),
    status: z.string().default("active"),
  }),
  admin: z.object({
    name: z.string().min(2, "Nombre de admin requerido"),
    email: z.string().email("Email de admin inválido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
  })
});

// Schema for Editing (Company only)
const editCompanySchema = createCompanySchema.shape.company;

type CreateCompanyData = z.infer<typeof createCompanySchema>;
type EditCompanyData = z.infer<typeof editCompanySchema>;

export default function AdminCompanies() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [kickoffModal, setKickoffModal] = useState<{ open: boolean, companyId: string, companyName: string, token: string }>({
    open: false, companyId: "", companyName: "", token: ""
  });

  // Success states for creation
  const [showCredentials, setShowCredentials] = useState(false);
  const [lastCreatedCreds, setLastCreatedCreds] = useState<{ name: string; email: string; pass: string; company: string } | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIndustry, setFilterIndustry] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterClassification, setFilterClassification] = useState("all");
  const [filterAccountStatus, setFilterAccountStatus] = useState("all");

  // WhatsApp states
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [waPhone, setWaPhone] = useState("+593");

  const { data: companies, isLoading } = useQuery<(Company & { current_subscription_status?: string })[]>({
    queryKey: ["/api/admin/companies"],
    enabled: !!token,
  });

  const createForm = useForm<CreateCompanyData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      company: { name: "", legal_name: "", industry: "", logo_url: "", contact_email: "", contact_phone: "+593", website: "", address: "", status: "active" },
      admin: { name: "", email: "", password: "" }
    }
  });

  const editForm = useForm<EditCompanyData>({
    resolver: zodResolver(editCompanySchema),
  });

  // Auto-generate password on modal open
  useEffect(() => {
    if (isCreateModalOpen && !createForm.getValues("admin.password")) {
      const pass = generatePassword();
      createForm.setValue("admin.password", pass);
    }
  }, [isCreateModalOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const res = await apiRequest("POST", "/api/admin/companies", data);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      setLastCreatedCreds({
        name: variables.admin.name,
        email: variables.admin.email,
        pass: variables.admin.password,
        company: variables.company.name
      });
      setIsCreateModalOpen(false);
      setShowCredentials(true);
      createForm.reset();
      toast({ title: "Empresa creada exitosamente" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async (data: EditCompanyData) => {
      const res = await apiRequest("PATCH", `/api/admin/companies/${editingCompany?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      setIsEditModalOpen(false);
      toast({ title: "Empresa actualizada" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const kickoffMutation = useMutation({
    mutationFn: async (companyId: string) => {
      const res = await apiRequest("POST", `/api/admin/companies/${companyId}/kickoff-token`);
      return res.json();
    },
    onSuccess: (data) => {
      setKickoffModal(prev => ({ ...prev, token: data.token }));
    },
    onError: (error: Error) => {
      toast({ title: "Error al generar enlace", description: error.message, variant: "destructive" });
    }
  });

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    editForm.reset({
      name: company.name,
      legal_name: company.legal_name || "",
      industry: company.industry || "",
      logo_url: company.logo_url || "",
      website: company.website || "",
      contact_email: company.contact_email || "",
      contact_phone: company.contact_phone || "",
      address: company.address || "",
      status: company.status || "active",
    });
    setIsEditModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado al portapapeles" });
  };



  const filteredCompanies = companies?.filter((company: any) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || company.pipeline_status === filterStatus;
    const matchesIndustry = filterIndustry === "all" || (company.industry || "General") === filterIndustry;
    const matchesPlan = filterPlan === "all" || company.current_subscription_status === filterPlan;
    const matchesClass = filterClassification === "all" || company.client_classification === filterClassification;
    const matchesAccountStatus = filterAccountStatus === "all" || company.account_status === filterAccountStatus;

    return matchesSearch && matchesStatus && matchesIndustry && matchesPlan && matchesClass && matchesAccountStatus;
  });

  // Unique values for filters
  const industries = Array.from(new Set(companies?.map(c => c.industry || "General") || []));
  const plans = Array.from(new Set(companies?.map(c => c.current_subscription_status).filter(Boolean) || []));
  const classifications = Array.from(new Set(companies?.map((c: any) => c.client_classification).filter(Boolean) || []));
  const accountStatuses = Array.from(new Set(companies?.map((c: any) => c.account_status).filter(Boolean) || []));

  const whatsappMessage = lastCreatedCreds
    ? `Hola ${lastCreatedCreds.name},

Tu cuenta para ${lastCreatedCreds.company} ha sido creada.

Acceso al sistema:
Email: ${lastCreatedCreds.email}
Contraseña: ${lastCreatedCreds.pass}

Ingresa aquí:
${window.location.origin}/login

Te recomendamos cambiar tu contraseña después de ingresar.`
    : "";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="pd-page-title text-2xl font-bold">Empresas</h1>
          <p className="pd-page-subtitle text-muted-foreground">Gestiona el ecosistema de clientes corporativos</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Empresa
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-none shadow-none focus-visible:ring-1"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="new_lead">Lead Nuevo</SelectItem>
                <SelectItem value="contract_pending">Contrato Pendiente</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="service_activation">Activación</SelectItem>
                <SelectItem value="active_client">Cliente Activo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterIndustry} onValueChange={setFilterIndustry}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Industria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Industrias</SelectItem>
                {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Planes</SelectItem>
                {plans.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterClassification} onValueChange={setFilterClassification}>
              <SelectTrigger className="w-[120px] bg-background">
                <SelectValue placeholder="Clase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Clases</SelectItem>
                {classifications.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="pl-6 py-4">Empresa / Contacto</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead className="pr-6 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies?.map((company) => (
                  <TableRow key={company.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary font-bold">
                          {company.logo_url ? <img src={company.logo_url} className="h-full w-full object-contain rounded-xl" /> : company.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{company.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Mail className="h-3 w-3" /> {company.contact_email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[100px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-muted-foreground uppercase tracking-widest">Perf.</span>
                          <span>{company.profile_completeness || 0}%</span>
                        </div>
                        <Progress value={company.profile_completeness || 0} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs capitalize border-muted-foreground/20">
                        {company.industry || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={company.status === "active" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 shadow-none px-3" : "bg-orange-100 text-orange-700 px-3 border-0 shadow-none"}
                      >
                        {company.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold border-primary/20 text-primary">
                        {company.current_subscription_status || "Sin Plan"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/companies/${company.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setKickoffModal({ open: true, companyId: company.id, companyName: company.name, token: "" });
                            kickoffMutation.mutate(company.id);
                          }}
                        >
                          <Rocket className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                          onClick={() => {
                            setWaPhone(company.contact_phone || "+593");
                            setLastCreatedCreds({
                              name: company.name,
                              email: company.contact_email || "",
                              pass: "********",
                              company: company.name
                            });
                            setIsWhatsappModalOpen(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 gap-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">Alta Integral de Cliente</DialogTitle>
            <DialogDescription>Registra la empresa y su primer administrador en una sola operación.</DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))} className="p-6 pt-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary tracking-widest mb-2 border-b pb-1">
                    <Building2 className="h-3 w-3" /> Empresa
                  </div>
                  <FormField
                    control={createForm.control}
                    name="company.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Comercial</FormLabel>
                        <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="company.legal_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Razón Social</FormLabel>
                        <FormControl><Input placeholder="Acme S.A." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={createForm.control}
                      name="company.contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl><Input placeholder="+593..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="company.industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industria</FormLabel>
                          <FormControl><Input placeholder="Retail" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="company.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio Web</FormLabel>
                        <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Admin Section */}
                <div className="space-y-4 md:border-l md:pl-8">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary tracking-widest mb-2 border-b pb-1">
                    <User className="h-3 w-3" /> Administrador
                  </div>
                  <FormField
                    control={createForm.control}
                    name="admin.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl><Input placeholder="Nombre del admin" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="admin.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Corporativo</FormLabel>
                        <FormControl><Input placeholder="admin@empresa.com" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="admin.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex justify-between">
                          Contraseña
                          <span className="text-[10px] text-muted-foreground uppercase">Autogenerada</span>
                        </FormLabel>
                        <div className="relative">
                          <FormControl><Input type="text" className="pr-10 font-mono text-sm" {...field} readOnly /></FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={() => createForm.setValue("admin.password", generatePassword())}
                          >
                            <Plus className="h-4 w-4 rotate-45" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 mt-4">
                <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending} className="px-8">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finalizar Registro
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(d => editMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nombre Comercial</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="legal_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industria</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Web</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editMutation.isPending}>
                  {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* SUCCESS & CREDENTIALS MODAL */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl">¡Registro Exitoso!</DialogTitle>
            <DialogDescription className="text-center">Las credenciales del administrador han sido generadas.</DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 p-6 rounded-2xl border border-dashed border-muted-foreground/30 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Email de Acceso</label>
              <div className="flex justify-between items-center group">
                <p className="font-medium">{lastCreatedCreds?.email}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(lastCreatedCreds?.email || "")}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Contraseña Temporal</label>
              <div className="flex justify-between items-center">
                <p className="font-mono text-lg tracking-tight">
                  {showPass ? lastCreatedCreds?.pass : "••••••••••••"}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(lastCreatedCreds?.pass || "")}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCredentials(false)}>Cerrar</Button>
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsWhatsappModalOpen(true)}>
              <Phone className="h-4 w-4 mr-2" /> Enviar WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WHATSAPP MODAL */}


      <WhatsappDialog
        open={isWhatsappModalOpen}
        onOpenChange={setIsWhatsappModalOpen}
        phone={waPhone}
        message={whatsappMessage}
      />

      {/* KICKOFF LINK MODAL */}
      <Dialog open={kickoffModal.open} onOpenChange={(open) => setKickoffModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Enlace de Kickoff
            </DialogTitle>
            <DialogDescription>
              Comparte este enlace para que el cliente complete la información inicial para {kickoffModal.companyName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 flex flex-col items-center text-center gap-4">
              {kickoffMutation.isPending ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Generando enlace seguro...</p>
                </>
              ) : kickoffModal.token ? (
                <>
                  <div className="p-3 bg-white rounded-xl shadow-sm border w-full text-xs font-mono break-all text-center">
                    {`${window.location.origin}/kickoff/${kickoffModal.token}`}
                  </div>
                  <div className="flex gap-2 w-full">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => copyToClipboard(`${window.location.origin}/kickoff/${kickoffModal.token}`)}
                    >
                      <Copy className="h-4 w-4" /> Copiar Enlace
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => window.open(`/kickoff/${kickoffModal.token}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" /> Probar
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-destructive">Error al generar el token.</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setKickoffModal(prev => ({ ...prev, open: false }))}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  const length = 12;
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array).map(x => chars[x % chars.length]).join("");
};
