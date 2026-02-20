import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  ChevronDown,
  Info,
  MessageSquare,
  Power,
  PowerOff,
  Puzzle,
  Settings,
  Terminal,
  Sparkles,
  X,
  Brain,
} from "lucide-react";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Componentes de las Tabs
import { InfoTab } from "./InfoTab";
import { KnowledgeHub } from "./KnowledgeHub";
import { StatusTab } from "./StatusTab";
import IntegrationsTab from "@/pages/agents/AgentIntegrations";
import { LoadingSkeleton } from "./LoadingSkeleton";

// Los dos chats laterales
import { AgentHelp } from "./AgentHelp";
import { ChatTab } from "./ChatTab";

// Tipos y constantes
import { toneLabels, type TabId } from "./constants";
import {
  type InfoFormData,
  type ConfigFormData,
  type KnowledgeFormData,
} from "./schemas";

const tabs = [
  { id: "status", label: "Estado", icon: BarChart3 },
  { id: "info", label: "Información", icon: Info },
  { id: "config", label: "Base de conocimiento", icon: Brain },
  { id: "integrations", label: "Integraciones", icon: Puzzle },
] as const;

export default function AgentDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/agents/:id");
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados de Navegación y Paneles
  const [activeTab, setActiveTab] = useState<TabId>("status");
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);
  const [scope, setScope] = useState<"all" | "services" | "faq" | "docs">(
    "all",
  );

  const agentId = params?.id;

  // --- Queries & Mutations ---
  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", agentId],
    queryFn: async () => api.get(`/agents/${agentId}`, token || undefined),
    enabled: !!token && !!agentId,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Agent>) =>
      api.put(`/agents/${agentId}`, data, token || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId] });
      toast({
        title: "Guardado",
        description: "Cambios aplicados correctamente.",
      });
    },
  });

  // --- Handlers ---
  const handleSaveInfo = (data: InfoFormData) => updateMutation.mutate(data);
  const handleSaveConfig = (data: ConfigFormData) =>
    updateMutation.mutate(data);

  const handleApproveAI = (data: {
    content: string;
    scope?: "faq" | "services" | "all" | "docs";
  }) => {
    const updateData: Partial<Agent> = {};
    if (data.scope === "services")
      updateData.service_description = data.content;
    else if (data.scope === "faq") updateData.faq = data.content;
    else if (data.scope === "docs") updateData.documentation = data.content;
    updateMutation.mutate(updateData);
  };

  const onImproveWithAI = (newScope: "services" | "faq" | "docs") => {
    setShowTestChat(false); // Cerramos el test si abrimos la ayuda
    setScope(newScope);
    setShowAIHelp(true);
  };

  const toggleTestChat = () => {
    setShowAIHelp(false); // Cerramos la ayuda si abrimos el test
    setShowTestChat(!showTestChat);
  };

  if (!match) return null;
  if (isLoading) return <LoadingSkeleton />;
  if (!agent)
    return <div className="p-10 text-center">Agente no encontrado</div>;

  return (
    <div
      className={
        showTestChat || showAIHelp ? "space-y-6" : "max-w-7xl mx-auto space-y-6"
      }
    >
      <div className="flex flex-col md:flex-row gap-6 mt-5 min-h-screen w-full px-8 pb-10 overflow-x-hidden">
        {/* --- COLUMNA IZQUIERDA: CONFIGURACIÓN --- */}
        <div
          className={cn(
            "flex-1 transition-all duration-500 ease-in-out",
            showAIHelp || showTestChat ? "md:w-2/3 lg:w-[65%]" : "w-full",
          )}
        >
          {/* Header Superior */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-5 rounded-2xl border shadow-sm">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/agents")}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">
                    {agent.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={
                        agent.status === "active" ? "default" : "secondary"
                      }
                      className="text-[10px] uppercase font-bold px-2 py-0"
                    >
                      {agent.status === "active" ? (
                        <Power className="h-2 w-2 mr-1" />
                      ) : (
                        <PowerOff className="h-2 w-2 mr-1" />
                      )}
                      {agent.status === "active" ? "En línea" : "Pausado"}
                    </Badge>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <p className="text-xs font-medium text-zinc-500 capitalize">
                      {agent.tone}
                    </p>
                  </div>
                </div>
              </div>

              {/* BOTÓN TEST CHAT (PLAYGROUND) */}
              <Button
                onClick={toggleTestChat}
                variant={showTestChat ? "default" : "outline"}
                className={cn(
                  "rounded-xl gap-2 font-bold text-xs h-10 transition-all",
                  showTestChat
                    ? "shadow-lg shadow-primary/20"
                    : "hover:bg-zinc-100",
                )}
              >
                {showTestChat ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Terminal className="h-4 w-4 text-primary" />
                )}
                {showTestChat ? "Cerrar Prueba" : "Test Playground"}
              </Button>
            </div>
          </motion.div>

          {/* Selector de Tabs (Desktop) */}
          <div className="hidden md:flex gap-1 mb-6 bg-muted/50 dark:bg-zinc-900/50 p-1.5 rounded-2xl w-fit">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => {
                  setActiveTab(tab.id); 
                  setShowAIHelp(false);
                }}
                className={cn(
                  "gap-2 rounded-xl text-xs font-bold px-4 transition-all no-default-hover-elevate no-default-active-elevate",
                  activeTab === tab.id
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Contenido de la Tab Activa */}
          <div className="bg-card dark:bg-zinc-950 rounded-[2rem] shadow-[0_2px_16px_rgba(0,0,0,0.06)] min-h-[550px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="p-1"
              >
                {activeTab === "info" && (
                  <InfoTab
                    agent={agent}
                    onSave={handleSaveInfo}
                    isSaving={updateMutation.isPending}
                  />
                )}
                {activeTab === "config" && (
                  <KnowledgeHub
                    agent={agent}
                    handleSaveConfig={handleSaveConfig}
                    handleSaveKnowledge={() => {}} // Ajustar según tu lógica
                    updateMutationPending={updateMutation.isPending}
                    showChat={showAIHelp}
                    setShowChat={setShowAIHelp}
                    scope={scope}
                    setScope={setScope}
                    onImproveWithAI={onImproveWithAI}
                  />
                )}
                {activeTab === "status" && (
                  <StatusTab
                    agentId={agent.id}
                    agentStatus={agent.status || "inactive"}
                  />
                )}
                {activeTab === "integrations" && (
                  <IntegrationsTab
                    agentId={agent.id}
                    companyId={agent.company_id}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* --- COLUMNA DERECHA: PANELES LATERALES (TEST O AYUDA) --- */}
        <AnimatePresence>
          {(showAIHelp || showTestChat) && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="w-full md:w-[350px] lg:w-[400px] h-[calc(100vh-140px)] sticky top-10"
            >
              {showTestChat ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="p-1.5 bg-zinc-900 rounded-lg">
                      <Terminal className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Playground Real-time
                    </span>
                  </div>
                  <ChatTab agentId={agent.id} />
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <div className="p-1.5 bg-zinc-900 rounded-lg">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Asistente PD
                    </span>
                  </div>
                  <AgentHelp
                    agent={agent}
                    onClose={() => setShowAIHelp(false)}
                    scope={scope}
                    onSaveData={handleApproveAI}
                    setScope={setScope}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
