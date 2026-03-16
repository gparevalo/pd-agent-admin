import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Rocket, ArrowRight, ArrowLeft, CheckCircle2,
    Target, Users, Briefcase, BarChart3, MessageSquare,
    Lightbulb, Loader2, Globe, Mail, Phone, Plus, Trash
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const kickoffSchema = z.object({
    // Profile
    business_description: z.string().min(10, "Por favor, describe mejor tu negocio"),
    ideal_customer: z.string().min(10, "Describe a tu cliente ideal"),
    customer_problem: z.string().min(10, "¿Qué problema resuelves?"),
    customer_pain_points: z.string().min(10, "¿Cuáles son los puntos de dolor?"),

    // Services (Multiple)
    services: z.array(z.object({
        name: z.string().min(3, "Nombre del servicio requerido"),
        problem_solved: z.string().min(10, "Describe el problema que resuelve"),
        customer_benefits: z.string().min(10, "Describe los beneficios"),
        average_price: z.number().min(0, "Precio inválido").or(z.string().regex(/^\d+$/, "Debe ser un número").transform(v => parseInt(v))),
    })).min(1, "Debes agregar al menos un servicio"),

    // Strategy
    project_reason: z.string().min(10, "¿Por qué inicias este proyecto ahora?"),
    expected_results: z.string().min(10, "¿Qué resultados esperas?"),
    project_goals: z.string().min(10, "¿Cuáles son tus metas específicas?"),

    // Results / Sales
    sales_process: z.string().min(10, "¿Cómo es tu proceso de ventas?"),
    sales_cycle_duration: z.string().min(2, "¿Cuánto dura el ciclo de venta?"),
    sales_objections: z.string().min(10, "Objeciones en el cierre?"),

    // Marketing
    marketing_actions: z.string().min(10, "¿Qué acciones de marketing realizas?"),
    customer_satisfaction_measurement: z.string().min(10, "¿Cómo mides la satisfacción?"),
    referral_process: z.string().min(10, "¿Tienes un proceso de referidos?"),

    // Knowledge
    customer_questions: z.string().min(10, "¿Qué preguntas suelen hacer los clientes?"),
    valuable_resource: z.string().min(10, "¿Qué recurso valoran más tus clientes?"),
});

type KickoffData = z.infer<typeof kickoffSchema>;

export default function KickoffPage() {
    const [, params] = useRoute("/kickoff/:token");
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const totalSteps = 7;
    const token = params?.token;

    type KickoffResponse = {
        company: {
            id: string
            name: string
            industry?: string
        }
        existingData?: {
            profile?: any;
            services?: any[];
            strategy?: any;
            results?: any;
        }
    }

    const { data, isLoading: isTokenLoading, error: tokenError } =
        useQuery<KickoffResponse>({
            queryKey: [`/api/public/kickoff/${token}`],
            enabled: !!token,
            retry: false,
        });

    const company = data?.company;

    const form = useForm<KickoffData>({
        resolver: zodResolver(kickoffSchema),
        defaultValues: {
            business_description: "",
            ideal_customer: "",
            customer_problem: "",
            customer_pain_points: "",
            services: [{ name: "", problem_solved: "", customer_benefits: "", average_price: 0 }],
            project_reason: "",
            expected_results: "",
            project_goals: "",
            sales_process: "",
            sales_cycle_duration: "",
            sales_objections: "",
            marketing_actions: "",
            customer_satisfaction_measurement: "",
            referral_process: "",
            customer_questions: "",
            valuable_resource: "",
        },
    });

    // Reset form when existing data is loaded
    useEffect(() => {
        if (data?.existingData) {
            const ed = data.existingData;
            form.reset({
                business_description: ed.profile?.business_description || "",
                ideal_customer: ed.profile?.ideal_customer || "",
                customer_problem: ed.profile?.customer_problem || "",
                customer_pain_points: ed.profile?.customer_pain_points || "",
                services: ed.services || [{ name: "", problem_solved: "", customer_benefits: "", average_price: 0 }],
                project_reason: ed.strategy?.project_reason || "",
                expected_results: ed.strategy?.expected_results || "",
                project_goals: ed.strategy?.project_goals || "",
                sales_process: ed.results?.sales_process || "",
                sales_cycle_duration: ed.results?.sales_cycle_duration || "",
                sales_objections: ed.results?.sales_objections || "",
                marketing_actions: ed.results?.marketing_actions || "",
                customer_satisfaction_measurement: ed.results?.customer_satisfaction_measurement || "",
                referral_process: ed.results?.referral_process || "",
                customer_questions: ed.results?.customer_questions || "",
                valuable_resource: ed.results?.valuable_resource || "",
            });
        }
    }, [data, form]);

    const submitMutation = useMutation({
        mutationFn: async (formData: KickoffData) => {
            const {
                business_description, ideal_customer, customer_problem, customer_pain_points,
                services, ...rest
            } = formData;

            const payload = {
                profile: {
                    business_description,
                    ideal_customer,
                    customer_problem,
                    customer_pain_points
                },
                services: services.map(s => ({
                    name: s.name,
                    problem_solved: s.problem_solved,
                    customer_benefits: s.customer_benefits,
                    average_price: s.average_price
                })),
                strategy: {
                    project_reason: rest.project_reason,
                    expected_results: rest.expected_results,
                    project_goals: rest.project_goals
                },
                results: {
                    sales_process: rest.sales_process,
                    sales_cycle_duration: rest.sales_cycle_duration,
                    sales_objections: rest.sales_objections,
                    marketing_actions: rest.marketing_actions,
                    customer_satisfaction_measurement: rest.customer_satisfaction_measurement,
                    referral_process: rest.referral_process,
                    customer_questions: rest.customer_questions,
                    valuable_resource: rest.valuable_resource
                }
            };
            const res = await apiRequest("POST", `/api/public/kickoff/${token}/submit`, payload);
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "¡Información enviada!", description: "Gracias por completar el kickoff corporativo." });
            setStep(8); // Success step
        },
        onError: (error: Error) => {
            toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
        }
    });

    const nextStep = async () => {
        const fields = getFieldsForStep(step);
        const isValid = await form.trigger(fields as any);
        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    if (isTokenLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground font-medium">Validando enlace seguro...</p>
                </div>
            </div>
        );
    }

    if (tokenError || !company) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="max-w-md w-full border-none shadow-2xl">
                    <CardContent className="pt-10 pb-10 text-center space-y-6">
                        <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <Rocket className="h-10 w-10 rotate-180" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-slate-900">Enlace Inválido</h2>
                            <p className="text-muted-foreground">Este enlace de kickoff ha expirado o no es válido. Por favor, solicita uno nuevo a tu asesor.</p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>Volver al Inicio</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6">
            <div className="max-w-4xl w-full space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-primary font-bold tracking-tight uppercase text-xs">
                            <Rocket className="h-4 w-4" /> Client Onboarding System
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Formulario de Kickoff</h1>
                        <p className="text-slate-500 text-lg">Sesión estratégica inicial para <span className="text-primary font-semibold">{company.name}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progreso del Onboarding</div>
                        <div className="flex items-center gap-3 w-48">
                            <Progress value={(step / totalSteps) * 100} className="h-2 flex-1" />
                            <span className="text-sm font-bold text-primary">{Math.round((step / totalSteps) * 100)}%</span>
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(d => submitMutation.mutate(d))} className="space-y-8">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <StepContainer key="step1" title="Perfil de Empresa" description="Ayúdanos a entender el corazón de tu negocio y a quién te diriges." icon={<Users className="h-6 w-6" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="business_description" render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Descripción del Negocio</FormLabel>
                                                <FormControl><Textarea placeholder="Resume a qué se dedica tu empresa..." className="min-h-[100px] resize-none pb-4" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="ideal_customer" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cliente Ideal (Avatar)</FormLabel>
                                                <FormControl><Textarea placeholder="Quién es tu mejor cliente? Edad, industria, cargo..." className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="customer_problem" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Problema que Resuelves</FormLabel>
                                                <FormControl><Textarea placeholder="Qué necesidad principal cubres en el mercado?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="customer_pain_points" render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Puntos de Dolor</FormLabel>
                                                <FormControl><Textarea placeholder="Qué frustraciones tienen tus clientes antes de conocerte?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 2 && (
                                <StepContainer key="step2" title="Productos y Servicios" description="Añade los servicios principales que ofreces a tus clientes." icon={<Briefcase className="h-6 w-6" />}>
                                    <div className="space-y-6">
                                        <ServiceFieldArray form={form} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 3 && (
                                <StepContainer key="step3" title="Objetivos del Proyecto" description="Definamos el éxito de esta colaboración." icon={<Target className="h-6 w-6" />}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <FormField control={form.control} name="project_reason" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>¿Por qué ahora?</FormLabel>
                                                <FormControl><Textarea placeholder="Cuál fue el detonante para iniciar este proyecto?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="expected_results" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Resultados Esperados</FormLabel>
                                                <FormControl><Textarea placeholder="Qué quieres ver reflejado en 3 a 6 meses?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="project_goals" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Metas Específicas</FormLabel>
                                                <FormControl><Textarea placeholder="KPIs o metas de negocio tangibles" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 4 && (
                                <StepContainer key="step4" title="Proceso Comercial" description="Cómo conviertes prospectos en clientes pagadores." icon={<BarChart3 className="h-6 w-6" />}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="sales_process" render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Ruta de Venta</FormLabel>
                                                <FormControl><Textarea placeholder="Desde el contacto hasta el dinero en el banco..." className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="sales_cycle_duration" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Duración del Ciclo</FormLabel>
                                                <FormControl><Input placeholder="Ej: 15 días, 3 meses..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="sales_objections" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Objeciones en Cierre</FormLabel>
                                                <FormControl><Textarea placeholder="Qué dicen justo antes de pagar?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 5 && (
                                <StepContainer key="step5" title="Marketing y Fidelización" description="Cómo atraes y mantienes a tus clientes." icon={<Globe className="h-6 w-6" />}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <FormField control={form.control} name="marketing_actions" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Acciones Actuales</FormLabel>
                                                <FormControl><Textarea placeholder="Ads, Redes, Eventos, Frío..." className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="customer_satisfaction_measurement" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Medición de Satisfacción</FormLabel>
                                                <FormControl><Textarea placeholder="NPS, encuestas, feedback directo?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="referral_process" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sistema de Referidos</FormLabel>
                                                <FormControl><Textarea placeholder="Incentivas la recomendación de alguna forma?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 6 && (
                                <StepContainer key="step6" title="Conocimiento del Cliente" description="Lo que tus clientes más valoran de ti." icon={<MessageSquare className="h-6 w-6" />}>
                                    <div className="grid grid-cols-1 gap-6">
                                        <FormField control={form.control} name="customer_questions" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preguntas de los Clientes</FormLabel>
                                                <FormControl><Textarea placeholder="Qué te preguntan siempre antes de comprar?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="valuable_resource" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Recurso de Mayor Valor</FormLabel>
                                                <FormControl><Textarea placeholder="¿Qué entregable o parte de tu proceso aman más?" className="min-h-[100px] resize-none" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </StepContainer>
                            )}

                            {step === 7 && (
                                <StepContainer key="step7" title="Resumen y Envío" description="Revisa tu información antes de finalizar." icon={<CheckCircle2 className="h-6 w-6" />}>
                                    <div className="bg-primary/5 p-8 rounded-2xl border border-dashed border-primary/30 text-center space-y-6">
                                        <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                            <Rocket className="h-8 w-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-slate-900">¿Todo listo?</h3>
                                            <p className="text-slate-500">Al hacer clic en finalizar, procesaremos este Kickoff y notificaremos a tu asesor para comenzar el diseño de tu estrategia.</p>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full py-6 text-lg font-bold shadow-xl shadow-primary/20 transition-transform active:scale-95"
                                            disabled={submitMutation.isPending}
                                        >
                                            {submitMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5" />}
                                            Finalizar y Enviar Kickoff
                                        </Button>
                                    </div>
                                </StepContainer>
                            )}

                            {step === 8 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white p-12 rounded-3xl shadow-2xl border-none text-center space-y-8"
                                >
                                    <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-12 w-12" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">¡Misión Cumplida!</h2>
                                        <p className="text-slate-500 text-lg max-w-sm mx-auto">La información ha sido enviada con éxito. Ya estamos trabajando en el siguiente paso de tu onboarding.</p>
                                    </div>
                                    <div className="pt-4">
                                        <Button variant="outline" className="px-10 rounded-xl" onClick={() => setLocation("/")}>Cerrar Ventana</Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {step < 7 && (
                            <div className="flex justify-between items-center pt-8 border-t">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={step === 1}
                                    onClick={prevStep}
                                    className="gap-2 px-6 rounded-xl hover:bg-slate-200"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Anterior
                                </Button>
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="gap-2 px-10 rounded-xl shadow-lg shadow-primary/10"
                                >
                                    Siguiente <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </form>
                </Form>

                {/* Footer info */}
                <div className="flex justify-center items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Secure Protocol</div>
                    <div className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> GDPR Compliant</div>
                    <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> Auto-Archived</div>
                </div>
            </div>
        </div>
    );
}

function StepContainer({ title, description, icon, children }: { title: string, description: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100 p-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-900">{title}</CardTitle>
                            <CardDescription className="text-slate-500 text-sm mt-0.5">{description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 bg-white/50">
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    );
}

function getFieldsForStep(step: number): string[] {
    switch (step) {
        case 1: return ["business_description", "ideal_customer", "customer_problem", "customer_pain_points"];
        case 2: return ["services"];
        case 3: return ["project_reason", "expected_results", "project_goals"];
        case 4: return ["sales_process", "sales_cycle_duration", "sales_objections"];
        case 5: return ["marketing_actions", "customer_satisfaction_measurement", "referral_process"];
        case 6: return ["customer_questions", "valuable_resource"];
        default: return [];
    }
}

function ServiceFieldArray({ form }: { form: any }) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "services"
    });

    return (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <Card key={field.id} className="border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <CardHeader className="py-4 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {index + 1}
                            </span>
                            <CardTitle className="text-sm font-bold">Servicio / Producto</CardTitle>
                        </div>
                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <FormField
                            control={form.control}
                            name={`services.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Servicio</FormLabel>
                                    <FormControl><Input placeholder="Ej: Gestión de Meta Ads" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={`services.${index}.problem_solved`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Problema que Resuelve</FormLabel>
                                        <FormControl><Textarea placeholder="¿Qué frustración elimina?" className="min-h-[80px] resize-none" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`services.${index}.customer_benefits`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Beneficios</FormLabel>
                                        <FormControl><Textarea placeholder="¿Qué gana el cliente?" className="min-h-[80px] resize-none" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name={`services.${index}.average_price`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio Promedio (USD)</FormLabel>
                                    <FormControl><Input type="number" placeholder="1200" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            ))}
            <Button
                type="button"
                variant="outline"
                className="w-full border-dashed py-6 rounded-2xl bg-slate-50 hover:bg-slate-100"
                onClick={() => append({ name: "", problem_solved: "", customer_benefits: "", average_price: 0 })}
            >
                <Plus className="h-4 w-4 mr-2" /> Agregar otro servicio
            </Button>
        </div>
    );
}

function Shield({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
    );
}
