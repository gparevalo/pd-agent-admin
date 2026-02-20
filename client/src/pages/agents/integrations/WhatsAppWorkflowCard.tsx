import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lock, MessageCircle, Settings2 } from "lucide-react";
import { ChannelCard } from "./ChannelCard";
import { WhatsAppConnector } from "./WhatsAppConnector"; // Asegúrate de que la ruta sea correcta

interface WhatsAppWorkflowCardProps {
  agentId: string;
  companyId: string;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
}
export function WhatsAppWorkflowCard({
  agentId,
  companyId,
  isConnected,
  setIsConnected,
}: WhatsAppWorkflowCardProps) {
  console.log("WhatsAppWorkflowCard Props:", {
    agentId,
    companyId,
    isConnected,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <h2 className="pd-label">Canal de Respuesta</h2>
      </div>
      <ChannelCard
        title="WhatsApp Business"
        description="Official Channel"
        isConnected={isConnected}
        icon={<MessageCircle className="h-5 w-5 text-white" />}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* IZQUIERDA: Componente de WhatsApp */}
          <div className="lg:col-span-5 p-4 border-r border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
            <WhatsAppConnector
              agentId={agentId}
              companyId={companyId}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
            />
          </div>

          {/* DERECHA: Flujos (Workflow) */}
          <div className="lg:col-span-7 p-4 relative flex flex-col">
            <div className="flex items-center gap-3 ">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <Settings2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Flujos de Trabajo</h3>
                <p className="pd-label italic">AI Logic Builder</p>
              </div>
            </div>

            <div
              className={cn(
                "flex-1 transition-all duration-700 space-y-6",
                !isConnected &&
                  "opacity-10 blur-xl pointer-events-none scale-95",
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                  <p className="pd-label mb-1">Estrategia</p>
                  <p className="text-sm font-bold">Venta Consultiva</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                  <p className="pd-label mb-1">Filtro de Leads</p>
                  <p className="text-sm font-bold">Cualificación IA</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20">
                <p className="text-xs text-indigo-700/80 dark:text-indigo-300 leading-relaxed italic text-center">
                  "El agente está configurado para priorizar el agendamiento de
                  citas tras detectar interés genuino."
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-auto rounded-xl border-zinc-200 dark:border-zinc-800 font-bold h-11 text-xs uppercase tracking-widest hover:bg-zinc-50"
              >
                Editar Automatización
              </Button>
            </div>

            {/* Overlay de bloqueo cuando no está conectado */}
            {!isConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-10">
                <div className="h-14 w-14 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-xl mb-4 border border-zinc-100 dark:border-zinc-800">
                  <Lock className="h-6 w-6 text-zinc-300" />
                </div>
                <h4 className="font-bold text-zinc-400">Sección Protegida</h4>
                <p className="text-[11px] text-zinc-400 max-w-[180px] mt-1">
                  Conecta WhatsApp para activar los flujos de IA.
                </p>
              </div>
            )}
          </div>
        </div>
      </ChannelCard>
    </div>
  );
}
