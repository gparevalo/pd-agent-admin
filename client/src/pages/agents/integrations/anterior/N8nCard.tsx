import { useState, useEffect } from "react";
import { Zap, Link2, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlowDiagramStep } from "./FlowDiagramStep";
import { Phone, Shield, ArrowRight } from "lucide-react";

interface WorkflowData {
  name: string;
  id: string;
  webhookUrl: string;
  status: "active" | "inactive";
}

export function N8nCard({
  agentId,
  companyId,
}: {
  agentId: string;
  companyId: string;
}) {
  const { toast } = useToast();
  const { token } = useAuth();

  const [showFlowModal, setShowFlowModal] = useState(false);
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [agentChannelId, setAgentChannelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // =====================================================
  // LOAD DATA via REST
  // =====================================================
  const loadWorkflow = async () => {
    try {
      setIsLoading(true);

      // 1. Obtener canal WhatsApp + integración via REST
      const response = await fetch(
        `/api/channels/details?agentId=${agentId}&type=whatsapp`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        setWorkflowData(null);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setWorkflowData(null);
        return;
      }
      const { channel, integration } = await response.json();

      if (!channel) {
        setWorkflowData(null);
        return;
      }

      setAgentChannelId(channel.id);

      if (!integration) {
        setWorkflowData(null);
        return;
      }

      setWorkflowData({
        name: integration.workflow_name,
        id: integration.n8n_workflow_id,
        webhookUrl: integration.webhook_url,
        status: integration.is_active ? "active" : "inactive",
      });
    } catch (error) {
      console.error("Error cargando integración:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error cargando la automatización",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // GENERATE WORKFLOW
  // =====================================================
  const generateWorkflow = async () => {
    try {
      setIsLoading(true);

      // Obtener canal via REST
      const channelResponse = await fetch(
        `/api/channels/details?agentId=${agentId}&type=whatsapp`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const { channel } = await channelResponse.json();

      if (!channel) throw new Error("No existe canal WhatsApp");

      setAgentChannelId(channel.id);

      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/ea-generar-webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            company_id: companyId,
            agent_channel_id: channel.id,
            channel_type: "whatsapp",
            instance_name: channel.instance_name,
            external_identifier: channel.external_identifier,
          }),
        },
      );

      const webhookData = await response.json();

      if (!webhookData?.success) {
        throw new Error(webhookData?.message || "Error generando workflow");
      }

      const finalWorkflow: WorkflowData = {
        name: webhookData.name,
        id: webhookData.id,
        webhookUrl: webhookData.webhookUrl,
        status: webhookData.status === "active" ? "active" : "inactive",
      };

      setWorkflowData(finalWorkflow);

      // Guardar integración via REST
      await fetch("/api/channels/integration/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_channel_id: channel.id,
          provider: "n8n",
          webhook_url: finalWorkflow.webhookUrl,
          n8n_workflow_id: finalWorkflow.id,
          workflow_name: finalWorkflow.name,
          is_active: true,
        }),
      });

      toast({
        title: "Automatización configurada",
        description: "Integración creada correctamente",
      });
    } catch (error) {
      console.error("Error generando workflow:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar la automatización",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // REGENERATE
  // =====================================================
  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);

      if (!agentChannelId) return;

      // Eliminar integración via REST
      await fetch(
        `/api/channels/integration?agentChannelId=${agentChannelId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      await generateWorkflow();

      toast({
        title: "Automatización reconfigurada",
        description: "Workflow regenerado correctamente",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error regenerando workflow",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  useEffect(() => {
    if (token) loadWorkflow();
    else setIsLoading(false);
  }, [agentId, companyId, token]);

  // =====================================================
  // UI
  // =====================================================
  return (
    <>
      <Card className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        )}

        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : workflowData ? (
            <>
              <div className="flex justify-between gap-2 mb-4 flex-wrap">
                <h3 className="font-semibold">Automatización</h3>
                <Badge>
                  <Wifi className="h-3 w-3 mr-1" />
                  {workflowData.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="p-2 bg-muted rounded text-xs font-mono">
                  {workflowData.id}
                </div>
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {workflowData.webhookUrl}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowFlowModal(true)}
                  data-testid="button-n8n-details"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Ver Detalles
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  data-testid="button-n8n-regenerate"
                >
                  {isRegenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Reconfigurar
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold mb-2">Automatización</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No configurada aún
              </p>
              <Button onClick={generateWorkflow} data-testid="button-n8n-setup">
                <Link2 className="mr-2 h-4 w-4" />
                Configurar Automatización
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {workflowData && (
        <Dialog open={showFlowModal} onOpenChange={setShowFlowModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Flujo de Automatización</DialogTitle>
              <DialogDescription>
                Arquitectura del procesamiento
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 overflow-x-auto py-4">
              <FlowDiagramStep label="WhatsApp" icon={Phone} />
              <FlowDiagramStep label="Webhook" icon={Link2} />
              <FlowDiagramStep label="Sistema" icon={Zap} />
              <FlowDiagramStep label="Agente" icon={Shield} />
              <FlowDiagramStep label="Respuesta" icon={ArrowRight} isLast />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
