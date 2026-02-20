import { motion } from "framer-motion";
import {
  WhatsAppCard,
  N8nCard,
  GoHighLevelCard,
  tabVariants,
} from ".";

export default function IntegrationsTab({
  agentId,
  companyId,
}: {
  agentId: string;
  companyId: string;
}) {
  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Integraciones del Agente</h2>
          <p className="text-sm text-muted-foreground">
            Canales y automatizaciones conectados a este agente
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WhatsAppCard agentId={agentId} companyId={companyId} />
          <N8nCard agentId={agentId} companyId={companyId} />
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Integraciones de la Empresa
            </h2>
            <p className="text-sm text-muted-foreground">
              Servicios conectados a nivel empresarial
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GoHighLevelCard companyId={companyId} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
