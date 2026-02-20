import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function IntegrationStatusBadge({ connected }: { connected: boolean }) {
  return (
    <Badge
      variant={connected ? "default" : "secondary"}
      data-testid="badge-integration-status"
    >
      {connected ? (
        <>
          <Wifi className="h-3 w-3 mr-1" /> Conectado
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" /> Desconectado
        </>
      )}
    </Badge>
  );
}
