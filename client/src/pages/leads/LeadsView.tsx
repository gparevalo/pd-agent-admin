import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Search,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Lead } from "@shared/schema";
import { useState } from "react";
import LeadCard from "./LeadCard";
import LeadModal from "./LeadModal";

function LoadingSkeleton({ viewMode }: { viewMode: string }) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

interface LeadsViewProps {
  filteredLeads: Lead[];
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  viewMode: "cards" | "table";
  setViewMode: (v: "cards" | "table") => void;
  setModalOpen: (v: boolean) => void;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  handleSuccess: () => void;
}

export function LeadsView({
  filteredLeads,
  isLoading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  statusColors,
  statusLabels,
  handleSuccess,
}: LeadsViewProps) {
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Nuevos</SelectItem>
              <SelectItem value="contacted">Contactados</SelectItem>
              <SelectItem value="qualified">Calificados</SelectItem>
              <SelectItem value="converted">Convertidos</SelectItem>
              <SelectItem value="lost">Perdidos</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : filteredLeads.length > 0 ? (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={(lead) => {
                    setEditingLead(lead);
                    setModalOpen(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Conversaciones</TableHead>
                    <TableHead>Mensajes</TableHead>
                    <TableHead>Fuente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredLeads.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#EF0034]/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-[#EF0034]" />
                            </div>
                            <div>
                              <p className="font-medium">{lead.name}</p>
                              <p className="text-muted-foreground">
                                Id. {lead.id.slice(-6)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {lead.email && <p>{lead.email}</p>}
                          {lead.phone && <p>{lead.phone}</p>}
                        </TableCell>

                        <TableCell>{lead.total_conversations ?? 0}</TableCell>
                        <TableCell>{lead.total_messages ?? 0}</TableCell>
                        <TableCell>{lead.source ?? "-"}</TableCell>

                        <TableCell>
                          <Badge
                            className={statusColors[lead.lead_type || "new"]}
                          >
                            {statusLabels[lead.lead_type || "new"]}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge className={statusColors[lead.status || "new"]}>
                            {statusLabels[lead.status || "new"]}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {lead.created_at
                            ? new Date(lead.created_at).toLocaleDateString()
                            : "—"}
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingLead(lead);
                              setModalOpen(true);
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <Users className="h-8 w-8 mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No hay leads</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No se encontraron leads con esos filtros"
                : "Comienza agregando tu primer lead"}
            </p>
          </CardContent>
        </Card>
      )}

      <LeadModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingLead(null); // limpiar estado
        }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingLead(null);
          handleSuccess();
        }}
        lead={editingLead}
      />
    </motion.div>
  );
}
