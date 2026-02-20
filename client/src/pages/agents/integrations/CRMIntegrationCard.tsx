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
  Building2,
  CheckCircle2,
  Edit2,
  Link2,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChannelCard } from "./ChannelCard";

export function CRMIntegrationCard({
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
    locationId: "",
    calendar_id: "",
    api_key: "",
  });

  const isConnected = !!integration;

  // 1. Obtener estado de la base de datos
  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch(
        `/api/channels/status?agentId=${agentId}&type=crm`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) return;
      const data = await response.json();
      setIntegration(data);
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchIntegrationStatus();
  }, [agentId, token]);

  // 2. Lógica de Precarga: Se activa al abrir el modal o cuando cambia la integración
  useEffect(() => {
    if (isModalOpen) {
      if (integration?.integration_details) {
        const details = integration.integration_details;
        setFormData({
          locationId:
            details.locationId || details.credentials?.locationId || "",
          calendar_id:
            details.calendar_id || details.credentials?.calendar_id || "",
          api_key: details.credentials?.api_key || "",
        });
      } else {
        // Reset para nueva conexión
        setFormData({
          locationId: "",
          calendar_id: "",
          api_key: "",
        });
      }
    }
  }, [isModalOpen, integration]);

  const handleSave = async () => {
    // Validación: Solo obligatorios si es creación
    if (
      !isConnected &&
      (!formData.locationId || !formData.calendar_id || !formData.api_key)
    ) {
      return toast({
        variant: "destructive",
        title: "Datos incompletos",
        description:
          "El ID de NeuroAI, el ID de calendario y la API Key son requeridos para la primera conexión.",
      });
    }

    setIsSaving(true);
    try {
      // Body dinámico: Si editamos, solo mandamos el scope para no romper las credenciales
      const credentials = {
        calendar_id: formData.calendar_id,
        locationId: formData.locationId,
        api_key: formData.api_key,
      };

      const response = await fetch("/api/channels/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          company_id: companyId,
          channel_type: "crm",
          provider: "gohighlevel",
          instance_name: "NeurOnai",
          status: "connected",
          api_key: formData.api_key,
          provider_credentials: credentials,
        }),
      });

      if (response.ok) {
        toast({
          title: "¡Éxito!",
          description: isConnected
            ? "Permisos actualizados."
            : "CRM vinculado correctamente.",
        });
        setIsModalOpen(false);
        fetchIntegrationStatus();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de sistema",
        description: "No se pudo procesar la solicitud.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ChannelCard
        title="NeurOnai"
        description="CRM Agencia"
        isConnected={isConnected}
        icon={<Building2 className="h-5 w-5 text-white" />}
      >
        <div className="flex flex-col h-full">
          {!isConnected ? (
            <div className="flex flex-col items-center w-full text-center">
              <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
                <Lock className="h-5 w-5 text-zinc-300" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                Vincular NeurOnai
              </h4>
              <p className="text-[11px] text-zinc-400 max-w-[240px] mb-6 leading-relaxed">
                Conecta tu cuenta de GoHighLevel para sincronizar contactos.
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
                      {integration.integration_details?.api_key ||
                        "ID Configurado"}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsModalOpen(true)}
                    className="h-8 w-8 rounded-xl hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed italic">
                Sincronización de leads activa.
              </p>
            </div>
          )}

          <Button
            onClick={() =>
              isConnected ? fetchIntegrationStatus() : setIsModalOpen(true)
            }
            disabled={loading}
            className={cn(
              "w-full mt-6 rounded-xl font-bold text-xs gap-2 h-11 transition-all",
              isConnected
                ? "bg-emerald-500 text-white hover:bg-emerald-600 border-none"
                : "rounded-xl bg-zinc-900 text-white font-bold text-xs px-8 h-10 shadow-lg transition-all active:scale-95",
            )}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isConnected ? (
              <RefreshCw className="h-3.5 w-3.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
            {isConnected ? "Actualizar Estado" : "Configurar Conexión"}
          </Button>
        </div>
      </ChannelCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {isConnected ? "Gestionar Permisos" : "Configurar GoHighLevel"}
            </DialogTitle>
            <DialogDescription>
              {isConnected
                ? "Las credenciales ya están vinculadas. Puedes modificar los permisos (scopes) de acceso."
                : "Ingresa las credenciales OAuth2 de tu Marketplace de GHL para comenzar."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* API KEY*/}
            <div className={cn("space-y-2", isConnected && "opacity-60")}>
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">
                Api key
              </label>
              <Input
                placeholder="Tu Api Key..."
                value={formData.api_key}
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            {/* LOCATION ID (Disabled al editar) */}
            <div className={cn("space-y-2", isConnected && "opacity-60")}>
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">
                ID Cuenta NeuroAI
              </label>
              <Input
                placeholder="Tu Id de Cuenta NeuroAI..."
                value={formData.locationId}
                onChange={(e) =>
                  setFormData({ ...formData, locationId: e.target.value })
                }
                className="rounded-xl bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            {/* CLIENT ID (Disabled al editar) */}
            <div className={cn("space-y-2", isConnected && "opacity-60")}>
              <label className="text-xs font-bold uppercase text-zinc-500 ml-1">
                Id del Calendario
              </label>
              <Input
                placeholder="Tu Id del Calendario..."
                value={formData.calendar_id}
                onChange={(e) =>
                  setFormData({ ...formData, calendar_id: e.target.value })
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
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl text-xs bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              {isConnected ? "Guardar Cambios" : "Vincular CRM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
