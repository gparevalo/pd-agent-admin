import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Phone, Link2, Loader2, QrCode, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { IntegrationStatusBadge } from "./IntegrationStatusBadge";

export function WhatsAppCard({
  agentId,
  companyId,
}: {
  agentId: string;
  companyId: string;
}) {
  const { toast } = useToast();

  const [agentChannelId, setAgentChannelId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showNumberModal, setShowNumberModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const instanceName = `agent-${agentId.slice(0, 8)}-wp`;

  // =========================
  // LOAD CHANNEL
  // =========================
  useEffect(() => {
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
          setConnected(data.status === "connected");
          setConnectedNumber(data.external_identifier);
          setQrCode(data.qr_code);
        }
      } catch (err) {
        console.error("Load channel error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannel();
  }, [agentId, companyId]);

  // =========================
  // CONNECT
  // =========================
  const handleConnect = async (phone?: string) => {
    try {
      setIsConnecting(true);
      setShowQRModal(true);
      setPhoneNumber(phone || "");

      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/create-whatsapp-instance",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agentId,
            company_id: companyId,
            phone_number: phone,
            instance_name: instanceName,
          }),
        }
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
            external_identifier: phone,
            provider: "evolution_api",
            provider_instance_id: data.instance_id ?? null,
            qr_code: data.qr_code,
            status: "pending",
          },
          {
            onConflict: "agent_id,company_id,channel_type",
          }
        )
        .select()
        .single();

      if (error) throw error;

      setAgentChannelId(channel.id);
      setQrCode(data.qr_code);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error conectando WhatsApp",
      });
      setShowQRModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  // =========================
  // CHECK STATUS
  // =========================
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
        }
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

        setConnected(true);
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
        }
      );

      await supabase
        .from("agent_channels")
        .update({
          status: "disconnected",
          disconnected_at: new Date().toISOString(),
          qr_code: null,
        })
        .eq("id", agentChannelId);

      setConnected(false);
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

  // =========================
  // UI
  // =========================
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-10 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between mb-4">
            <div className="flex items-center gap-3">
              <Phone className="text-green-600" />
              <div>
                <h3 className="font-semibold">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  Canal conectado al agente
                </p>
              </div>
            </div>
            <IntegrationStatusBadge connected={connected} />
          </div>

          {connected && connectedNumber && (
            <div className="mb-4">
              <p className="text-xs">Número conectado</p>
              <p className="font-medium">{connectedNumber}</p>
            </div>
          )}

          {!connected ? (
            <Button onClick={() => setShowNumberModal(true)}>
              <Link2 className="mr-2 h-4 w-4" /> Conectar WhatsApp
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowQRModal(true)}>
                <QrCode className="mr-2 h-4 w-4" /> Ver QR
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                <X className="mr-2 h-4 w-4" /> Desconectar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL NUMBER */}
      <Dialog open={showNumberModal} onOpenChange={setShowNumberModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular número</DialogTitle>
          </DialogHeader>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+52 1 55..."
          />
          <Button onClick={() => handleConnect(phoneNumber)}>Conectar</Button>
        </DialogContent>
      </Dialog>

      {/* QR MODAL */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanea QR</DialogTitle>
            <DialogDescription>Desde WhatsApp</DialogDescription>
          </DialogHeader>

          {isConnecting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              {qrCode && <img src={qrCode} />}
              <Button onClick={checkWhatsAppStatus} disabled={isChecking}>
                {isChecking ? "Verificando..." : "Listo, conectado"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
