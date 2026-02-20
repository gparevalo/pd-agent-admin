import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Importaciones de tus componentes separados
import { CRMIntegrationCard } from "./integrations/CRMIntegrationCard";
import { GoogleCalendarIntegrationCard } from "./integrations/GoogleCalendarIntegrationCard";
import { WebWidgetCard } from "./integrations/WebWidgetCard";
import { WhatsAppWorkflowCard } from "./integrations/WhatsAppWorkflowCard";

export default function IntegrationsTab({
  agentId,
  companyId,
}: {
  agentId: string;
  companyId: string;
}) {
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);

  // Polling de estado cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isWhatsAppConnected) {
        // console.log("Consultando API...");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isWhatsAppConnected]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8 max-w-6xl mx-auto pb-20"
    >
      {/* 1. SECCIÓN MAESTRA: WHATSAPP + WORKFLOW */}
      <WhatsAppWorkflowCard
        agentId={agentId}
        companyId={companyId}
        isConnected={isWhatsAppConnected}
        setIsConnected={setIsWhatsAppConnected}
      />

      {/* 2. GRID INFERIOR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <WebWidgetCard agentId={agentId} companyId={companyId} />

        <CRMIntegrationCard companyId={companyId} agentId={agentId} />

        <GoogleCalendarIntegrationCard
          agentId={agentId}
          companyId={companyId}
        />
      </div>
    </motion.div>
  );
}
