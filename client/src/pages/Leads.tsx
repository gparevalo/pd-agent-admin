import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { Lead } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { statusColors, statusLabels } from "./leads/LeadCard";
import LeadModal from "./leads/LeadModal";
import { LeadsView } from "./leads/LeadsView";

export default function Leads() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const {
    data: leads,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: !!token,
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || lead.lead_type === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="pd-page-title" data-testid="text-leads-title">
            Leads
          </h1>
          <p className="pd-page-subtitle">Gestiona tus prospectos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setModalOpen(true)}
            data-testid="button-new-lead"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Lead
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refrescar
          </Button>
        </div>
      </motion.div>

      <LeadsView
        filteredLeads={filteredLeads}
        isLoading={isLoading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setModalOpen={setModalOpen}
        statusColors={statusColors}
        statusLabels={statusLabels}
        handleSuccess={handleSuccess}
      />

      {!filteredLeads?.length && statusFilter === "all" && (
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Lead
        </Button>
      )}

      <LeadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
