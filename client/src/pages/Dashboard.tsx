import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpRight,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Lead, Conversation, Subscription } from "@shared/schema";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  gradient,
  iconColor,
  borderColor,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: string;
  gradient: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <motion.div variants={itemVariants} className="group">
      <Card
        className={cn(
          "relative overflow-hidden border-zinc-200 dark:border-zinc-800 transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-2 bg-white dark:bg-[#111111] rounded-[2rem]",
          borderColor,
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-40",
            gradient,
          )}
        />

        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center transition-all duration-500 group-hover:bg-[#EF0034] group-hover:text-white">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-500",
                    iconColor,
                    "group-hover:text-white",
                  )}
                />
              </div>
              <h3 className="pd-label">{title}</h3>
            </div>

            {trend && (
              <Badge className="bg-[#EF0034] text-white border-none text-[9px] font-black px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> {trend}
              </Badge>
            )}
          </div>

          <div className="mt-2">
            <p className="pd-stat">{value}</p>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium italic">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SubscriptionStatus({
  subscription,
  daysRemaining,
}: {
  subscription: Subscription;
  daysRemaining: number;
}) {
  const getStatusBadge = () => {
    switch (subscription.status) {
      case "trial":
        return <Badge variant="secondary">Prueba</Badge>;
      case "active":
        return <Badge>Activo</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspendido</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    if (subscription.status === "active" || subscription.status === "trial") {
      if (daysRemaining <= 3) {
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      }
      return <CheckCircle className="h-5 w-5 text-[#EF0034]" />;
    }
    return <AlertCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-[2rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-60 h-60 bg-[#EF0034]/5 rounded-full -mr-30 -mt-30 blur-[80px]" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <p className="font-bold text-sm">
                  {subscription.billing_cycle === "trial"
                    ? "Período de prueba"
                    : `Plan ${subscription.billing_cycle}`}
                </p>
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {daysRemaining > 0
                    ? `${daysRemaining} días restantes`
                    : "Membresía vencida"}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[160px] rounded-[2rem]" />
        ))}
      </div>
      <Skeleton className="h-[350px] rounded-[2rem]" />
    </div>
  );
}

export default function Dashboard() {
  const { token, subscription } = useAuth();

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!token,
  });

  const { data: conversations, isLoading: convsLoading } = useQuery<
    Conversation[]
  >({
    queryKey: ["/api/conversations"],
    enabled: !!token,
  });

  const isLoading = leadsLoading || convsLoading;

  const daysRemaining = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.end_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="pd-page-title mb-6" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <LoadingSkeleton />
      </div>
    );
  }

  const totalLeads = leads?.length || 0;
  const totalConversations = conversations?.length || 0;
  const conversionRate =
    totalConversations > 0
      ? Math.round((totalLeads / totalConversations) * 100)
      : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="pd-page-title" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="pd-page-subtitle">Resumen de tu actividad</p>
      </motion.div>

      <div className="bg-card dark:bg-zinc-950 rounded-[2rem] shadow-[0_2px_16px_rgba(0,0,0,0.06)] min-h-[550px] overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8 p-10"
        >
          {subscription && (
            <SubscriptionStatus
              subscription={subscription}
              daysRemaining={daysRemaining}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Plan Actual"
              value={
                subscription?.billing_cycle === "trial"
                  ? "Prueba"
                  : subscription?.billing_cycle || "—"
              }
              icon={CreditCard}
              description="Estado de suscripción"
              gradient="from-[#EF0034]/5 to-transparent"
              iconColor="text-[#EF0034]"
              borderColor="group-hover:border-[#EF0034]/30"
            />
            <StatCard
              title="Días Restantes"
              value={daysRemaining}
              icon={Calendar}
              description={
                daysRemaining <= 3 ? "Renueva pronto" : "Vigencia activa"
              }
              trend={daysRemaining <= 3 ? undefined : undefined}
              gradient="from-[#111111]/5 to-transparent"
              iconColor="text-[#111111] dark:text-white"
              borderColor="group-hover:border-[#111111]/30"
            />
            <StatCard
              title="Total Leads"
              value={totalLeads}
              icon={Users}
              trend="+12%"
              description="Contactos capturados"
              gradient="from-[#EF0034]/5 to-transparent"
              iconColor="text-[#EF0034]"
              borderColor="group-hover:border-[#EF0034]/30"
            />
            <StatCard
              title="Conversaciones"
              value={totalConversations}
              icon={MessageSquare}
              description="Interacciones totales"
              gradient="from-[#111111]/5 to-transparent"
              iconColor="text-[#111111] dark:text-white"
              borderColor="group-hover:border-[#111111]/30"
            />
          </div>

          <motion.div variants={itemVariants}>
            <Card className="border-none shadow-2xl bg-white dark:bg-[#111111] overflow-hidden relative rounded-[2rem]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-100/50 dark:bg-[#EF0034]/5 rounded-full -mr-40 -mt-40 blur-[100px]" />

              <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="pd-icon-box">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="pd-section-title">
                      Resumen de Actividad
                    </CardTitle>
                    <CardDescription className="text-xs font-medium text-zinc-500">
                      Leads recientes y conversaciones activas
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-5">
                      <div className="flex items-end justify-between">
                        <div className="space-y-1">
                          <p className="pd-label">Progreso de Leads</p>
                          <p className="pd-stat">
                            {totalLeads}{" "}
                            <span className="text-lg font-light text-zinc-400">
                              / 100 Meta
                            </span>
                          </p>
                        </div>
                        <Badge className="bg-[#111111] text-white hover:bg-[#EF0034] transition-colors border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Objetivo mensual
                        </Badge>
                      </div>
                      <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(totalLeads, 100)}%`,
                          }}
                          transition={{
                            duration: 1.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="absolute h-full bg-[#EF0034] rounded-full shadow-[0_0_15px_rgba(239,0,52,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="pd-label">Leads Recientes</p>
                      {leads && leads.length > 0 ? (
                        <div className="space-y-3">
                          {leads.slice(0, 5).map((lead) => (
                            <div
                              key={lead.id}
                              className="pd-panel flex items-center justify-between gap-2"
                              data-testid={`row-lead-${lead.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-[#EF0034]/10 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-4 w-4 text-[#EF0034]" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">
                                    {lead.name}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    {lead.email || "Sin email"}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[10px] rounded-full"
                              >
                                {lead.lead_type || "new"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pd-panel text-center py-6">
                          <p className="text-sm text-zinc-400 italic">
                            No hay leads aún
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pd-dark-panel p-8 relative overflow-hidden group">
                    <Lightbulb className="absolute bottom-[-20px] right-[-20px] h-32 w-32 text-white/[0.03] group-hover:text-[#EF0034]/10 transition-all duration-700 rotate-12" />

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-9 w-9 rounded-xl bg-[#EF0034] flex items-center justify-center shadow-[0_4px_12px_rgba(239,0,52,0.3)]">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="font-black text-sm uppercase tracking-tighter italic decoration-[#EF0034] decoration-2 underline-offset-4 underline">
                          Resumen IA
                        </h4>
                      </div>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Tasa de conversión
                          </span>
                          <span className="text-sm font-bold text-white">
                            {conversionRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Leads activos
                          </span>
                          <span className="text-sm font-bold text-[#EF0034]">
                            {totalLeads}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Conversaciones
                          </span>
                          <span className="text-sm font-bold text-white">
                            {totalConversations}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-zinc-400 leading-relaxed italic">
                        {totalLeads > 0
                          ? `"Tienes ${totalLeads} leads activos. Optimiza tu agente para mejorar la conversión."`
                          : `"Configura tu agente IA para comenzar a captar leads automáticamente."`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {conversations && conversations.length > 0 && (
            <motion.div variants={itemVariants}>
              <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] rounded-[2rem] overflow-hidden">
                <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="pd-icon-box">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="pd-section-title">
                        Actividad Reciente
                      </CardTitle>
                      <CardDescription className="text-xs font-medium text-zinc-500">
                        Últimas conversaciones del agente
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {conversations.slice(0, 5).map((conv) => (
                      <div
                        key={conv.id}
                        className="pd-panel flex items-center justify-between gap-2"
                        data-testid={`row-conversation-${conv.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[#111111] dark:bg-zinc-800 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Conversación</p>
                            <p className="text-xs text-zinc-400">
                              {new Date(
                                conv.started_at || "",
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            conv.status === "active" ? "default" : "secondary"
                          }
                        >
                          {conv.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
