import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Cable,
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  Link,
  Loader2,
  Lock,
  Terminal,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ChannelCard } from "./ChannelCard";

interface WebWidgetCardProps {
  agentId: string;
  companyId: string;
}

async function generateSecureKey(agentId: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(agentId + self.crypto.randomUUID()); // Mezclamos ID + Random
  const hashBuffer = await self.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `pd_${hashHex.slice(0, 40)}`; // Retornamos prefijo + 40 caracteres del hash
}

// 2. URL estática de tu n8n
const FIXED_WEBHOOK_URL =
  "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/pd_sales_agent";

export function WebWidgetCard({ agentId, companyId }: WebWidgetCardProps) {
  const { toast } = useToast();
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  // 1. Cargar estado inicial y API Key
  useEffect(() => {
    const checkIntegration = async () => {
      try {
        const { data } = await supabase
          .from("agent_channels")
          .select(
            `
            id, 
            status, 
            api_key
          `,
          )
          .eq("agent_id", agentId)
          .eq("channel_type", "web_widget")
          .maybeSingle();

        if (data && data.api_key) {
          setIsActivated(true);
          setApiKey(data.api_key);
          setWebhookUrl(FIXED_WEBHOOK_URL);
        }
      } catch (err) {
        console.error("Error checking web integration:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkIntegration();
  }, [agentId]);

  // 2. Generar integración y API Key permanente
  const handleActivate = async () => {
    setIsProcessing(true);
    try {
      // 1. Generamos la Key única para este agente
      const newApiKey = await generateSecureKey(agentId);

      const instanceName = `widget-${agentId.slice(0, 8)}`;

      // 3. Registro único en la tabla principal
      const { data, error } = await supabase
        .from("agent_channels")
        .upsert(
          {
            agent_id: agentId,
            company_id: companyId,
            channel_type: "web_widget",
            instance_name: instanceName,
            provider: "sales_agent",
            status: "connected",
            api_key: newApiKey,
          },
          { onConflict: "agent_id,company_id,channel_type" },
        )
        .select()
        .single();

      if (error) throw error;

      // 4. Actualizamos UI
      setApiKey(newApiKey);
      setWebhookUrl(FIXED_WEBHOOK_URL);
      setIsActivated(true);

      toast({
        title: "Conexión Generada",
        description: "API Key vinculada exitosamente al agente.",
      });
    } catch (err: any) {
      console.error("Error:", err);
      toast({
        variant: "destructive",
        title: "Error de sistema",
        description: "No se pudo registrar la API Key en la base de datos.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: `${label} copiado al portapapeles`,
    });
  };

  // Fragmentos de código para el modal
  const codeSnippets = {
    javascript: `const response = await fetch("${webhookUrl}", {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "x-api-key": "${apiKey}" 
  },
  body: JSON.stringify({
    channel: "web",
    agent_id: "${agentId}",
    session_id: "SESSION_ID_AQUI", 
    user_name: "web_user",
    message: "Hola AI",
    message_id: "msg_" + Date.now()
  })
});`,
    python: `import requests
import time

url = "${webhookUrl}"
headers = {"x-api-key": "${apiKey}"}
data = {
    "channel": "web",
    "agent_id": "${agentId}",
    "session_id": "sesion_123",
    "message": "Hola AI",
    "message_id": f"msg_{int(time.time())}"
}

response = requests.post(url, json=data, headers=headers)`,
    curl: `curl -X POST "${webhookUrl}" \\
     -H "Content-Type: application/json" \\
     -H "x-api-key: ${apiKey}" \\
     -d '{
        "channel": "web",
        "agent_id": "${agentId}",
        "message": "Hola AI"
     }'`,
  };

  if (isLoading)
    return (
      <Card className="h-[300px] flex items-center justify-center border-none shadow-xl rounded-[2.5rem]">
        <Loader2 className="animate-spin text-zinc-300" />
      </Card>
    );

  return (
    <ChannelCard
      title="Widget & API"
      description="Web Integration"
      isConnected={isActivated}
      icon={<Globe className="h-5 w-5 text-white" />}
    >
      {!isActivated && (
        <div className="flex flex-col items-center w-full">
          <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
            <Lock className="h-5 w-5 text-zinc-300" />
          </div>
          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
            Activar Canal Web
          </h4>
          <p className="text-[11px] text-zinc-400 max-w-[240px] mb-6 leading-relaxed">
            Genera una API Key única para conectar este agente a tu sitio web o
            aplicación externa.
          </p>
        </div>
      )}

      {isActivated && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="pd-label mb-0 text-[10px] uppercase text-zinc-400">
                API Gateway
              </p>
              <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 italic truncate max-w-[150px]">
                {webhookUrl ? "Conexión Establecida" : "Pendiente"}
              </p>
            </div>

            {isActivated && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-2 font-bold text-xs h-9 border-zinc-200 hover:bg-zinc-100 transition-all"
                  >
                    <Code2 className="h-4 w-4 text-[#EF0034]" /> Docs
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] w-[95vw] rounded-[2.5rem] bg-white dark:bg-zinc-950 p-8 border-none shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                      <Terminal className="h-6 w-6 text-[#EF0034]" />{" "}
                      Integración de Código
                    </DialogTitle>
                  </DialogHeader>

                  <div className="mt-4 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">
                      Tu API Key Permanente
                    </p>
                    <div className="flex items-center justify-between bg-white dark:bg-black p-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <code className="text-xs font-mono text-[#EF0034]">
                        {apiKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(apiKey || "", "API Key")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="javascript" className="w-full mt-6">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1">
                      <TabsTrigger
                        value="javascript"
                        className="rounded-lg text-[10px] font-bold uppercase"
                      >
                        JS / Fetch
                      </TabsTrigger>
                      <TabsTrigger
                        value="python"
                        className="rounded-lg text-[10px] font-bold uppercase"
                      >
                        Python
                      </TabsTrigger>
                      <TabsTrigger
                        value="curl"
                        className="rounded-lg text-[10px] font-bold uppercase"
                      >
                        cURL
                      </TabsTrigger>
                    </TabsList>
                    {Object.entries(codeSnippets).map(([lang, code]) => (
                      <TabsContent
                        key={lang}
                        value={lang}
                        className="relative mt-4 group"
                      >
                        <pre className="p-5 bg-zinc-950 text-zinc-100 rounded-2xl text-[11px] font-mono overflow-x-auto border border-white/5 leading-relaxed">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                          onClick={() => copyToClipboard(code, "Código")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TabsContent>
                    ))}
                  </Tabs>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <code className="text-[10px] text-zinc-400 font-mono block truncate mr-4">
              {webhookUrl || "URL no generada"}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => copyToClipboard(webhookUrl || "", "URL")}
            >
              <Link className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}

      <Button
        onClick={!isActivated ? handleActivate : () => {}}
        disabled={isProcessing}
        className={cn(
          "w-full mt-6 rounded-xl font-bold text-xs gap-2 h-11 transition-all",
          isActivated
            ? "bg-emerald-500 text-white hover:bg-zinc-200 border-none"
            : "border-none shadow-lg shadow-amber-500/20",
        )}
      >
        {isActivated ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Cable className="h-3.5 w-3.5" />
        )}
        {isActivated ? "Servicio Activo" : "Generar conexión"}
      </Button>
 
    </ChannelCard>
  );
}
