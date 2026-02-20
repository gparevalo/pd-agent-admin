import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Users,
  Target,
  Zap,
  Lightbulb,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface AgentStats {
  status: string;
  totalConversations: number;
  totalLeads: number;
  conversionRate: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function StatusTab({
  agentId,
}: {
  agentId: string;
  agentStatus: string;
}) {
  const { token } = useAuth();

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agents", agentId, "stats"],
    queryFn: async () =>
      api.get(`/agents/${agentId}/stats`, token || undefined),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-3xl" />
        ))}
        <Skeleton className="h-[350px] md:col-span-3 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-1"
    >
      <div className="w-full space-y-8 px-4 py-6">
        {/* KPIs - Aplicando Rojo PD Agencia y Negro Sofisticado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Conversaciones"
            value={stats?.totalConversations || 0}
            icon={MessageSquare}
            trend="+5%"
            description="Interacciones totales"
            gradient="from-[#EF0034]/5 to-transparent"
            iconColor="text-[#EF0034]"
            borderColor="group-hover:border-[#EF0034]/30"
          />
          <StatCard
            title="Leads Capturados"
            value={stats?.totalLeads || 0}
            icon={Users}
            trend="+12%"
            description="Contactos de interés"
            gradient="from-[#111111]/5 to-transparent"
            iconColor="text-[#111111] dark:text-white"
            borderColor="group-hover:border-[#111111]/30"
          />
          <StatCard
            title="Tasa de Cierre"
            value={`${stats?.conversionRate || 0}%`}
            icon={Target}
            description="Efectividad del agente"
            gradient="from-[#EF0034]/5 to-transparent"
            iconColor="text-[#EF0034]"
            borderColor="group-hover:border-[#EF0034]/30"
          />
        </div>

        {/* Panel de Rendimiento con Estilo PD Agencia */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-2xl bg-white dark:bg-[#111111] overflow-hidden relative rounded-[2rem]">
            {/* Decoración de fondo sutil */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-zinc-100/50 dark:bg-[#EF0034]/5 rounded-full -mr-40 -mt-40 blur-[100px]" />

            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 pb-6 relative z-10">
              <div className="flex items-center gap-4">
                {/* Icono ahora en Negro para no distraer del título principal */}
                <div className="pd-icon-box">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  {/* Título más pequeño que el h1 general, sin rojo y con tipografía Bold */}
                  <CardTitle className="pd-section-title">
                    Análisis de Rendimiento
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-zinc-500">
                    Métricas de conversión y sugerencias de IA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-10 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Columna de Progreso */}
                <div className="lg:col-span-2 space-y-10">
                  <div className="space-y-5">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="pd-label">
                          Progreso de Conversión
                        </p>
                        <p className="pd-stat">
                          {stats?.totalLeads}{" "}
                          <span className="text-lg font-light text-zinc-400">
                            / 100 Leads
                          </span>
                        </p>
                      </div>
                      <Badge className="bg-[#111111] text-white hover:bg-[#EF0034] transition-colors border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Objetivo mensual
                      </Badge>
                    </div>
                    {/* Barra de progreso con el Rojo Munsell */}
                    <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(stats?.totalLeads || 0, 100)}%`,
                        }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute h-full bg-[#EF0034] rounded-full shadow-[0_0_15px_rgba(239,0,52,0.4)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="pd-panel group hover:border-[#EF0034]/20 transition-all">
                      <p className="text-[10px] font-black uppercase text-[#EF0034] mb-3 tracking-[0.15em]">
                        Estado del Embudo
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        El volumen ha subido un{" "}
                        <strong className="text-[#111111] dark:text-white">
                          15%
                        </strong>
                        . Respuesta promedio en{" "}
                        <strong className="text-[#EF0034]">1.2s</strong>.
                      </p>
                    </div>
                    <div className="pd-panel group hover:border-[#EF0034]/20 transition-all">
                      <p className="text-[10px] font-black uppercase text-[#EF0034] mb-3 tracking-[0.15em]">
                        Calidad de Leads
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        Alta tasa de respuestas positivas.{" "}
                        <span className="italic">SebastIAn</span> está filtrando
                        correctamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Columna de Sugerencia IA - Alineación Horizontal */}
                <div className="pd-dark-panel p-8 relative overflow-hidden group">
                  <Lightbulb className="absolute bottom-[-20px] right-[-20px] h-32 w-32 text-white/[0.03] group-hover:text-[#EF0034]/10 transition-all duration-700 rotate-12" />

                  <div className="relative z-10">
                    {/* HEADER DE LA IA AL MISMO NIVEL */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-9 w-9 rounded-xl bg-[#EF0034] flex items-center justify-center shadow-[0_4px_12px_rgba(239,0,52,0.3)]">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-black text-sm uppercase tracking-tighter italic decoration-[#EF0034] decoration-2 underline-offset-4 underline">
                        Tip de SebastIAn
                      </h4>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed italic">
                      "He notado que muchos usuarios preguntan por{" "}
                      <strong className="text-white">
                        precios personalizados
                      </strong>
                      . Podríamos aumentar la conversión un{" "}
                      <span className="text-[#EF0034] font-bold">15%</span> si
                      optimizamos las FAQs."
                    </p>

                    <button className="mt-8 w-full text-[11px] font-black uppercase tracking-[0.2em] bg-white text-[#111111] px-6 py-4 rounded-2xl hover:bg-[#EF0034] hover:text-white transition-all duration-300 shadow-xl">
                      Optimizar ahora
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  gradient,
  iconColor,
  borderColor,
}: any) {
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
          {/* TÍTULO E ICONO AL MISMO NIVEL */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center transition-all duration-500 group-hover:bg-[#EF0034] group-hover:text-white",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-500",
                    iconColor,
                    "group-hover:text-white",
                  )}
                />
              </div>
              <h3 className="pd-label">
                {title}
              </h3>
            </div>

            {trend && (
              <Badge className="bg-[#EF0034] text-white border-none text-[9px] font-black px-2 py-0.5 rounded-full">
                <ArrowUpRight className="h-3 w-3 mr-0.5" /> {trend}
              </Badge>
            )}
          </div>

          <div className="mt-2">
            <p className="pd-stat">
              {value}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 font-medium italic">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
