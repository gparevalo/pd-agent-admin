import { useState, useEffect } from "react";
import { Shield, Link2, X, Loader2, Key, Eye, EyeOff, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IntegrationStatusBadge } from "./IntegrationStatusBadge";
import { FlowDiagramStep } from "./FlowDiagramStep";
import { Zap } from "lucide-react";

interface GoHighLevelIntegration {
  id: string;
  client_id: string;
  client_secret: string;
  scope: string;
  status: "connected" | "disconnected";
}

export function GoHighLevelCard({ companyId }: { companyId: string }) {
  const { toast } = useToast();
  const [integration, setIntegration] = useState<GoHighLevelIntegration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const defaultScope =
    "locations.readonly contacts.readonly contacts.write opportunities.readonly opportunities.write users.readonly calendars.readonly calendars.write calendars/events.write locations/customFields.readonly locations/customFields.write";

  // Cargar integración al montar el componente
  useEffect(() => {
    loadIntegration();
  }, [companyId]);

  const loadIntegration = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("company_integrations")
        .select("*")
        .eq("company_id", companyId)
        .eq("provider", "gohighlevel")
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setIntegration({
          id: data.id,
          client_id: data.client_id,
          client_secret: data.client_secret,
          scope: data.scope,
          status: (data.status === "connected" ? "connected" : "disconnected") as "connected" | "disconnected",
        });
        setClientId(data.client_id);
        setClientSecret(data.client_secret);
      } else {
        setIntegration(null);
      }
    } catch (error) {
      console.error("Error cargando integración GoHighLevel:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error cargando la integración",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "Ingresa el Client ID y Client Secret",
      });
      return;
    }

    setIsAuthorizing(true);
    try {
      const payload = {
        company_id: companyId,
        provider: "gohighlevel",
        client_id: clientId,
        client_secret: clientSecret,
        scope: defaultScope,
        status: "connected",
      };

      if (integration?.id) {
        // Actualizar integración existente
        const { error } = await supabase
          .from("company_integrations")
          .update(payload)
          .eq("id", integration.id);

        if (error) throw error;
      } else {
        // Crear nueva integración
        const { data, error } = await supabase
          .from("company_integrations")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setIntegration({
            id: data.id,
            client_id: data.client_id,
            client_secret: data.client_secret,
            scope: data.scope,
            status: data.status as "connected" | "disconnected",
          });
        }
      }

      setShowOAuthModal(false);
      toast({
        title: "Go High Level configurado",
        description: "La integración ha sido guardada exitosamente.",
      });
    } catch (error) {
      console.error("Error al autorizar GoHighLevel:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error guardando la integración",
      });
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from("company_integrations")
        .delete()
        .eq("id", integration.id);

      if (error) throw error;

      setIntegration(null);
      setClientId("");
      setClientSecret("");
      toast({
        title: "Go High Level desconectado",
        description: "La integración ha sido eliminada.",
      });
    } catch (error) {
      console.error("Error al desconectar:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al desconectar la integración",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const maskedId = clientId
    ? `${clientId.slice(0, 8)}${"*".repeat(Math.max(0, clientId.length - 8))}`
    : "---";

  return (
    <>
      <Card data-testid="card-integration-gohighlevel">
        <CardContent className="p-6">
          {isLoading ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Go High Level</h3>
                    <p className="text-sm text-muted-foreground">
                      CRM conectado a la empresa
                    </p>
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-10 w-24" />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Go High Level</h3>
                    <p className="text-sm text-muted-foreground">
                      CRM conectado a la empresa
                    </p>
                  </div>
                </div>
                <IntegrationStatusBadge connected={!!integration && integration.status === "connected"} />
              </div>

              {integration && integration.status === "connected" && (
                <div className="space-y-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Client ID</p>
                    <p className="text-sm font-medium font-mono">{maskedId}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Scope</p>
                    <p className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
                      {defaultScope}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!integration || integration.status === "disconnected" ? (
                  <Button
                    onClick={() => setShowOAuthModal(true)}
                    data-testid="button-connect-ghl"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Conectar Go High Level
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    data-testid="button-disconnect-ghl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Desconectando...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Desconectar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showOAuthModal} onOpenChange={setShowOAuthModal}>
        <DialogContent className="w-[90%] max-w-[90%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Conectar Go High Level
            </DialogTitle>
            <DialogDescription>
              Configura la integración OAuth con Go High Level
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <FlowDiagramStep label="Empresa" icon={Shield} />
              <FlowDiagramStep label="OAuth" icon={Key} />
              <FlowDiagramStep label="GHL" icon={ExternalLink} />
              <FlowDiagramStep label="Tokens" icon={Key} />
              <FlowDiagramStep label="Plataforma" icon={Zap} isLast />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client ID</label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Ingresa tu Client ID"
                  disabled={isAuthorizing}
                  data-testid="input-ghl-client-id"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Client Secret</label>
                <div className="relative">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Ingresa tu Client Secret"
                    className="pr-10"
                    disabled={isAuthorizing}
                    data-testid="input-ghl-client-secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowSecret(!showSecret)}
                    disabled={isAuthorizing}
                    data-testid="button-toggle-ghl-secret"
                  >
                    {showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scope</label>
                <Textarea
                  value={defaultScope}
                  readOnly
                  className="min-h-[80px] resize-none text-xs font-mono"
                  data-testid="textarea-ghl-scope"
                />
                <p className="text-xs text-muted-foreground">
                  Los permisos están preconfigurados para la integración
                </p>
              </div>
            </div>

            <Button
              onClick={handleAuthorize}
              disabled={isAuthorizing}
              className="w-full"
              data-testid="button-authorize-ghl"
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Guardar Integración
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
