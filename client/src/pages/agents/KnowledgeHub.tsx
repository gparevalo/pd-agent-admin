import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Utilidad estándar de shadcn
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { ConfigTab } from "./ConfigTab";
import { KnowledgeTab } from "./KnowledgeTab";

interface KnowledgeHubProps {
  agent: any;
  handleSaveConfig: (data: any) => void;
  handleSaveKnowledge: (data: any) => void;
  updateMutationPending: boolean;
  showChat: boolean;
  setShowChat: (show: boolean) => void;
  scope: "all" | "services" | "faq" | "docs";
  setScope: (scope: "all" | "services" | "faq" | "docs") => void;
  onImproveWithAI: (scope: "services" | "faq" | "docs") => void; // ahora obligatorio
}

type KnowledgeOption = "services" | "faq" | "docs" | null;

export function KnowledgeHub({
  agent,
  handleSaveConfig,
  handleSaveKnowledge,
  updateMutationPending,
  showChat,
  setShowChat,
  scope,
  setScope,
  onImproveWithAI,
}: KnowledgeHubProps) {
  const [selectedOption, setSelectedOption] =
    useState<KnowledgeOption>("services");

  const handleSelectOption = (option: KnowledgeOption) => {
    setSelectedOption(option);

    if (option === "services") {
      onImproveWithAI("services"); // <--- Forzamos apertura del chat al entrar a servicios
    }

    if (option === "faq") {
      onImproveWithAI("faq"); // <--- Forzamos apertura del chat al entrar a faq
    }

    if (option === "docs") {
      onImproveWithAI("docs"); // <--- Usamos el scope de faq para docs por ahora, hasta que tengamos algo específico para docs
    }
  };

  const handleBack = () => {
    setSelectedOption(null);
    setShowChat(false);
    setScope("all");
  };

  const options = [
    {
      id: "services",
      title: "Servicios",
      desc: "Define la lógica y capacidades del agente.",
      icon: Settings,
      color: "text-blue-500",
    },
    {
      id: "faq",
      title: "Preguntas Frecuentes",
      desc: "Entrena al agente con preguntas y respuestas.",
      icon: BookOpen,
      color: "text-purple-500",
    },
    {
      id: "docs",
      title: "Documentos",
      desc: "Sube archivos PDF o TXT para análisis profundo.",
      icon: FileText,
      color: "text-emerald-500",
    },
  ];

  if (!selectedOption) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {options.map((opt) => (
          <Card
            key={opt.id}
            onClick={() => handleSelectOption(opt.id as KnowledgeOption)}
            className="group relative overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm cursor-pointer hover:border-primary/50 transition-all duration-300 p-6 flex flex-col justify-between"
          >
            {/* Efecto de brillo al hacer hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div>
              <div
                className={cn(
                  "p-3 rounded-xl w-fit mb-4 bg-zinc-100 dark:bg-zinc-900 group-hover:scale-110 transition-transform duration-300",
                  opt.color,
                )}
              >
                <opt.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-1">
                {opt.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {opt.desc}
              </p>
            </div>

            <div className="mt-6 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Configurar ahora <Sparkles className="ml-2 h-3 w-3" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-start gap-2 bg-zinc-100 dark:bg-zinc-900 rounded-lg mt-4 mx-4">
          {options.map((opt) => {
            const isActive = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id as KnowledgeOption)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-all",
                  isActive
                    ? "bg-white dark:bg-zinc-800 shadow text-primary font-medium"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                {opt.title}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2"></div>
      </div>

      <div>
        {selectedOption === "services" && (
          <ConfigTab
            agent={agent}
            onSave={handleSaveConfig}
            isSaving={updateMutationPending}
            onImproveWithAI={() => onImproveWithAI("services")}
          />
        )}

        {selectedOption === "faq" && (
          <KnowledgeTab
            agent={agent}
            onSave={handleSaveKnowledge}
            isSaving={updateMutationPending}
            onImproveWithAI={() => onImproveWithAI("faq")}
          />
        )}

        {selectedOption === "docs" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
              <FileText className="text-muted-foreground" />
            </div>
            <h4 className="font-medium">Gestión de Documentos</h4>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Próximamente: Sube archivos para expandir la mente de tu IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
