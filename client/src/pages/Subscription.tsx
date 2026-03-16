import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Zap,
  Tag,
  Loader2,
  Shield,
  ArrowRight,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Plan } from "@shared/schema";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Subscription() {
  const { token, subscription } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [discountCode, setDiscountCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validatedDiscount, setValidatedDiscount] = useState<any>(null);
  const [activatingPlan, setActivatingPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: !!token,
  });

  const validateDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsValidating(true);
    try {
      const result = await api.post<any>(
        "/discount/validate",
        { code: discountCode, billing_cycle: billingCycle },
        token || undefined,
      );
      setValidatedDiscount(result);
      if (result.valid) toast({ title: "CÓDIGO APLICADO" });
    } catch (e) {
      toast({ variant: "destructive", title: "ERROR" });
    } finally {
      setIsValidating(false);
    }
  };

  const activatePlan = async (planId: string) => {
    setActivatingPlan(planId);
    try {
      await api.post(
        "/subscription/activate",
        {
          plan_id: planId,
          billing_cycle: billingCycle,
          discount_code: validatedDiscount?.valid
            ? validatedDiscount.discount?.code
            : undefined,
        },
        token || undefined,
      );
      queryClient.invalidateQueries({
        queryKey: ["/api/subscription/current"],
      });
      window.location.href = "/dashboard";
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERROR", description: e.message });
    } finally {
      setActivatingPlan(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="pd-page-title">Membresía</h1>
        <p className="pd-page-subtitle">
          Gestiona tu plan y potencia tu alcance con SebastIAn
        </p>
      </motion.div>

      {/* Controles: Ciclo y Cupón */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-1.5 bg-white dark:bg-[#111111] rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 flex items-center shadow-sm">
          {["monthly", "semestral", "annual"].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                billingCycle === cycle
                  ? "bg-[#EF0034] text-white shadow-lg"
                  : "text-zinc-400 hover:text-zinc-600",
              )}
            >
              {cycle === "monthly"
                ? "Mensual"
                : cycle === "semestral"
                  ? "6 Meses"
                  : "Anual"}
            </button>
          ))}
        </div>

        <div className="relative group">
          <Input
            placeholder="CÓDIGO DE CUPÓN"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            className="h-full min-h-[58px] rounded-[1.5rem] bg-white dark:bg-[#111111] border-zinc-100 dark:border-zinc-800 px-6 text-[10px] font-black tracking-widest focus-visible:ring-[#EF0034]/20"
          />
          <button
            onClick={validateDiscount}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#111111] dark:bg-zinc-800 rounded-lg flex items-center justify-center text-white hover:bg-[#EF0034] transition-colors"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Rejilla de Planes (Vuelven las Cards del diseño original) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans?.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrent={subscription?.plan_id === plan.id}
            onActivate={() => activatePlan(plan.id)}
            isActivating={activatingPlan === plan.id}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  billingCycle,
  isCurrent,
  onActivate,
  isActivating,
}: any) {
  const getPrice = () => {
    const p: any = {
      monthly: plan.base_price_monthly,
      semestral: plan.base_price_semestral,
      annual: plan.base_price_annual,
    };
    return parseFloat(p[billingCycle] || "0").toFixed(0);
  };

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card
        className={cn(
          "h-full rounded-[2.5rem] border-none shadow-xl transition-all duration-500 flex flex-col overflow-hidden",
          isCurrent
            ? "ring-2 ring-[#EF0034] bg-white dark:bg-zinc-950"
            : "bg-white dark:bg-[#111111]",
        )}
      >
        {isCurrent && (
          <div className="bg-[#EF0034] text-white text-[9px] font-black uppercase text-center py-2 tracking-[0.3em]">
            Tu Plan Actual
          </div>
        )}

        <CardHeader className="pt-10 pb-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <Zap
              className={cn(
                "h-5 w-5",
                isCurrent ? "text-[#EF0034]" : "text-zinc-400",
              )}
            />
          </div>
          <CardTitle className="pd-section-title text-xl uppercase tracking-tight">
            {plan.name}
          </CardTitle>
          <CardDescription className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.15em]">
            {plan.description || "Optimización con IA"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10 flex flex-col flex-1">
          <div className="text-center mb-8 pb-8 border-b border-zinc-50 dark:border-zinc-800/50">
            <div className="flex items-baseline justify-center gap-1">
              <span className="pd-stat text-5xl tracking-tighter">
                ${getPrice()}
              </span>
              <span className="text-zinc-400 text-xs font-bold">USD</span>
            </div>
          </div>

          <ul className="space-y-4 mb-10 flex-1">
            {plan && plan.length > 0 && ((plan.default_features as string[]) || []).map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 leading-tight"
              >
                <div className="mt-0.5 h-4 w-4 rounded-full bg-[#EF0034]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="h-2.5 w-2.5 text-[#EF0034]" />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <Button
            disabled={isCurrent || isActivating}
            onClick={onActivate}
            className={cn(
              "w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all",
              isCurrent
                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-default"
                : "bg-[#111111] dark:bg-white text-white dark:text-[#111111] hover:bg-[#EF0034] hover:text-white shadow-lg",
            )}
          >
            {isActivating ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : isCurrent ? (
              "ACTIVO"
            ) : (
              "SELECCIONAR"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
