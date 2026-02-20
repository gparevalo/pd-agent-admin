import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Loader2,
  QrCode,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface WhatsAppConnectorProps {
  agentId: string;
  companyId: string;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
}

export function WhatsAppConnector({
  agentId,
  companyId,
  isConnected,
  setIsConnected,
}: WhatsAppConnectorProps) {
  const { toast } = useToast();
  const { token } = useAuth();
  const [agentChannelId, setAgentChannelId] = useState<string | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const instanceName = `agent-${agentId.slice(0, 8)}-wp`;

  // 1. CARGAR ESTADO INICIAL via REST
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    const loadChannel = async () => {
      try {
        const { data, error } = await supabase
          .from("agent_channels")
          .select("id,status,external_identifier,qr_code")
          .eq("agent_id", agentId)
          .eq("company_id", companyId)
          .eq("channel_type", "whatsapp")
          .maybeSingle();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setAgentChannelId(data.id);
          setIsConnected(data.status === "connected");
          setConnectedNumber(data.external_identifier);
          setQrCode(data.qr_code);
        }
      } catch (err) {
        console.error("Error loading channel:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadChannel();
  }, [agentId, setIsConnected, token]);

  // 2. LÓGICA DE CONECTAR / GENERAR QR
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/create-whatsapp-instance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            company_id: companyId,
            phone_number: phoneNumber,
            instance_name: instanceName,
          }),
        },
      );
      const data = await response.json();

      if (!data.success) throw new Error("Error creando instancia");

      const { data: channel, error } = await supabase
        .from("agent_channels")
        .upsert(
          {
            agent_id: agentId,
            company_id: companyId,
            channel_type: "whatsapp",
            instance_name: instanceName,
            external_identifier: phoneNumber,
            provider: "evolution_api",
            provider_instance_id: data.instance_id ?? null,
            qr_code: data.qr_code,
            status: "pending",
          },
          {
            onConflict: "agent_id,company_id,channel_type",
          },
        )
        .select()
        .single();

      if (error) throw error;

      setAgentChannelId(channel.id);
      setQrCode(data.qr_code);
      setShowPhoneModal(false);
      setShowQRModal(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo generar el QR",
      });
      setShowQRModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const checkWhatsAppStatus = async () => {
    try {
      setIsChecking(true);

      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/evolution-check-status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            company_id: companyId,
            instance_name: instanceName,
          }),
        },
      );

      const data = await response.json();

      if (data.success && data.open) {
        await supabase
          .from("agent_channels")
          .update({
            status: "connected",
            connected_at: new Date().toISOString(),
          })
          .eq("id", agentChannelId);

        setIsConnected(true);
        setConnectedNumber(phoneNumber);
        setShowQRModal(false);

        toast({
          title: "WhatsApp conectado",
          description: "Instancia vinculada correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "No conectado",
          description: "Aún no se ha conectado",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  // =========================
  // DISCONNECT
  // =========================
  const handleDisconnect = async () => {
    try {
      setIsConnecting(true);

      await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/ea-desconectar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            company_id: companyId,
            instance_name: instanceName,
          }),
        },
      );

      await supabase
        .from("agent_channels")
        .update({
          status: "disconnected",
          disconnected_at: new Date().toISOString(),
          qr_code: null,
        })
        .eq("id", agentChannelId);

      setIsConnected(false);
      setConnectedNumber(null);
      setQrCode(null);

      toast({
        title: "WhatsApp desconectado",
        description: "Instancia desvinculada",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Auto-check after 60 seconds when QR is shown
  useEffect(() => {
    if (!showQRModal || isConnecting) return;

    const timer = setTimeout(() => {
      checkWhatsAppStatus();
    }, 60000);

    return () => clearTimeout(timer);
  }, [showQRModal, isConnecting, agentId, companyId, instanceName]);

  // Refresh QR every 30 seconds while modal open and not connected
  useEffect(() => {
    if (!showQRModal || isConnected) return;
    let cancelled = false;

    const fetchQR = async () => {
      try {
        const res = await fetch(
          "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/ea-generateqr",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agent_id: agentId,
              company_id: companyId,
              instance_name: instanceName,
            }),
          },
        );

        const json = await res.json();
        if (!cancelled && json && json.success && json.qr_code) {
          setQrCode(json.qr_code);
        }
      } catch (err) {
        console.error("Error refreshing QR:", err);
      }
    };

    if (!isConnecting) fetchQR();
    const interval = setInterval(fetchQR, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    showQRModal,
    isConnected,
    agentId,
    companyId,
    instanceName,
    isConnecting,
  ]);

  if (isLoading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-zinc-300 h-8 w-8" />
      </div>
    );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <p className="pd-label mb-1">Estado del Servicio</p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-zinc-300",
              )}
            />
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {isConnected
                ? `Activo: ${connectedNumber || "Sesión Iniciada"}`
                : "Esperando vinculación QR"}
            </span>
          </div>
        </div>
      </div>

      {!isConnected ? (
        <Button
          onClick={() => setShowPhoneModal(true)}
          className="rounded-xl bg-zinc-900 text-white font-bold text-xs px-8 h-10 shadow-lg transition-all active:scale-95"
          data-testid="button-whatsapp-connect"
        >
          <QrCode className="mr-2 h-4 w-4" /> Escanear Código QR
        </Button>
      ) : (
        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="w-full mt-6 rounded-xl font-bold text-xs gap-2 h-11 bg-zinc-100 text-zinc-600 border border-zinc-200"
          data-testid="button-whatsapp-disconnect"
        >
          {isDisconnecting ? (
            <Loader2 className="animate-spin h-3.5 w-3.5" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Desconectar Número
        </Button>
      )}

      {/* MODAL TELÉFONO */}
      <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="p-3 bg-green-500/10 rounded-2xl mb-4 text-green-600">
              <Smartphone />
            </div>
            <DialogTitle className="text-2xl font-black">
              Vincular Número
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configura la instancia de WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="+593 99 2..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="rounded-xl h-12 bg-zinc-50 border-zinc-200 font-bold"
              data-testid="input-whatsapp-phone"
            />
            <Button
              onClick={handleConnect}
              disabled={!phoneNumber || isConnecting}
              className="pd-save-btn bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
              data-testid="button-whatsapp-generate-qr"
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Generar QR"
              )}{" "}
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL QR CON AUTO-REFRESH */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl">
          <DialogHeader className="flex flex-col items-center text-center">
            <DialogTitle className="text-2xl font-black">
              Escanea el Código
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 gap-6">
            <div className="p-4 bg-white border-4 border-zinc-50 rounded-3xl shadow-inner relative overflow-hidden">
              {qrCode ? (
                <img src={qrCode} alt="QR" />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center bg-zinc-50">
                  <Loader2 className="animate-spin text-green-600 h-10 w-10" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 rounded-full">
              <RefreshCw className="h-3 w-3 text-zinc-400 animate-spin" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                El QR se refresca cada 7s
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
