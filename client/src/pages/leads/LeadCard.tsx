import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Lead } from "@shared/schema";
import { motion } from "framer-motion";
import { Mail, Pencil, Phone, User } from "lucide-react";

export const statusColors: Record<string, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  MEDIUM:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  LOW: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",

  new: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  contacted:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  qualified:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  converted:
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  lost: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const statusLabels: Record<string, string> = {
  HIGH: "Alto",
  LOW: "Bajo",
  MEDIUM: "Medio",
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  converted: "Convertido",
  lost: "Perdido",
};

export default function LeadCard({
  lead,
  onEdit,
}: {
  lead: Lead;
  onEdit: (lead: any) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover-elevate" data-testid={`card-lead-${lead.id}`}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex items-start gap-3">
              {/* Icono */}
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#EF0034]/10">
                <User className="h-5 w-5 text-[#EF0034]" />
              </div>

              {/* Texto */}
              <div>
                <h3
                  className="font-semibold text-base mb-1"
                  data-testid={`text-lead-name-${lead.id}`}
                >
                  {lead.name}
                </h3>

                {lead.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Mail className="h-3 w-3" />
                    <span>{lead.email}</span>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Phone className="h-3 w-3" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button size="icon" variant="ghost" onClick={() => onEdit(lead)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-muted gap-2 flex-wrap mt-3">
            <span className="text-xs text-muted-foreground capitalize">
              {lead.source || "Sin fuente"}
              {" | "}
              {lead.created_at
                ? new Date(lead.created_at).toLocaleDateString()
                : "—"}
            </span>
            <span className="text-xs text-muted-foreground gap-2">
              <Badge className={statusColors[lead.status || "new"]}>
                {statusLabels[lead.status || "new"]}
              </Badge>
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
