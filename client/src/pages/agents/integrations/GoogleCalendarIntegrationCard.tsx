import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckCircle2,
  Link2,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChannelCard } from "./ChannelCard";

export function GoogleCalendarIntegrationCard({
  agentId,
  companyId,
}: {
  agentId: string;
  companyId: string;
}) {
  const { toast } = useToast();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [integration, setIntegration] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    clientSecret: "",
  });

  const isConnected = !!integration;

  // 1. Obtener estado inicial
  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch(
        `/api/channels/status?agentId=${agentId}&type=calendar`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) return;
      const data = await response.json();
      setIntegration(data);
    } catch (error) {
      console.error("Error fetching calendar status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchIntegrationStatus();
  }, [agentId, token]);

  // 2. Vincular nueva cuenta
  const handleConnect = async () => {
    if (!formData.clientId || !formData.clientSecret) {
      return toast({
        variant: "destructive",
        title: "Campos obligatorios",
        description:
          "Ingresa el Client ID y Client Secret de Google Cloud Console.",
      });
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/channels/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          company_id: companyId,
          channel_type: "calendar",
          provider: "google",
          instance_name: "Google Calendar",
          status: "connected",
          provider_credentials: {
            client_id: formData.clientId,
            client_secret: formData.clientSecret,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "¡Conectado!",
          description: "Google Calendar se ha vinculado.",
        });
        setIsModalOpen(false);
        fetchIntegrationStatus();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo realizar la conexión.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Desconectar integración
  const handleDisconnect = async () => {
    if (!confirm("¿Estás seguro de que deseas desconectar Google Calendar?"))
      return;

    setLoading(true);
    try {
      const response = await fetch("/api/channels/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          channel_type: "calendar",
        }),
      });

      if (response.ok) {
        setIntegration(null);
        toast({
          title: "Desconectado",
          description: "La integración ha sido eliminada.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo desconectar.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ChannelCard
        title="Google Calendar"
        description="Agendar Citas"
        isConnected={isConnected}
        icon={<Calendar className="h-5 w-5 text-white" />}
      >
        <div className="flex flex-col h-full">
          {!isConnected ? (
            <div className="flex flex-col items-center w-full text-center">
              <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                <Lock className="h-5 w-5 text-zinc-300" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Vincular Calendario
              </h4>
              <p className="text-[11px] text-zinc-400 max-w-[240px] mb-6 leading-relaxed">
                Permite que tu agente agende reuniones directamente en Google
                Calendar.
              </p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Conectado
                      </p>
                    </div>
                    <code className="text-xs text-zinc-600 dark:text-zinc-300 font-mono block truncate">
                      {integration.integration_details?.client_id ||
                        "Google API Active"}
                    </code>
                  </div>
                  {/* Botón de eliminar en lugar de editar */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDisconnect}
                    className="h-8 w-8 rounded-xl hover:bg-red-500/10 text-red-500 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed italic">
                Sincronización de eventos habilitada.
              </p>
            </div>
          )}

          <Button
            onClick={() => !isConnected && setIsModalOpen(true)}
            disabled={loading }
            className={cn(
              "w-full mt-6 rounded-xl font-bold text-xs gap-2 h-11 transition-all",
              isConnected
                ? "bg-emerald-500 text-white hover:bg-emerald-600 border-none"
                : "rounded-xl bg-zinc-900 text-white font-bold text-xs px-8 h-10 shadow-lg transition-all active:scale-95",
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {isConnected ? "Calendario Vinculado" : "Configurar Google Cloud"}
          </Button>
        </div>
      </ChannelCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Conectar Google Calendar</DialogTitle>
            <DialogDescription>
              Necesitas un proyecto en Google Cloud Console con la Calendar API
              habilitada.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">
                Client ID
              </label>
              <Input
                placeholder="000000000000-xxx.apps.googleusercontent.com"
                value={formData.clientId}
                onChange={(e) =>
                  setFormData({ ...formData, clientId: e.target.value })
                }
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">
                Client Secret
              </label>
              <Input
                type="password"
                placeholder="GOCSPX-........"
                value={formData.clientSecret}
                onChange={(e) =>
                  setFormData({ ...formData, clientSecret: e.target.value })
                }
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConnect}
              disabled={isSaving}
              className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Establecer Conexión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
