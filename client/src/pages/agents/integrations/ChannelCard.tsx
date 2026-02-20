import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, MessageCircle } from "lucide-react";

interface ChannelCardProps {
  title?: string;
  description?: string;
  isConnected: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode; // <--- Paso 1: Agregar el parámetro children
}

export const ChannelCard = ({
  title = "WhatsApp Business",
  description = "Official Channel",
  isConnected,
  icon = <MessageCircle className="h-5 w-5 text-white" />,
  children, // <--- Paso 2: Recibirlo en la desestructuración
}: ChannelCardProps) => {
  return (
    <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="pd-icon-box"> {icon}</div>
            <div>
              <CardTitle className="pd-section-title text-sm">
                {title}
              </CardTitle>
              <CardDescription className="text-xs font-medium text-zinc-500">
                {description}
              </CardDescription>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-[10px] font-bold transition-all border",
              isConnected
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400",
            )}
          >
            {isConnected ? (
              <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : (
              <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
            )}
            <span className="leading-none uppercase tracking-tighter">
              {isConnected ? "Sincronizado" : "Pendiente"}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* Paso 3: Renderizar el contenido solo si existe */}
      {children && (
        <div className="p-6 relative z-10">
          {children}

          {isConnected && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  Servicio Activo
                </span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
