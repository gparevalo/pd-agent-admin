import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown"; // Recomendado: npm install react-markdown
import {
  Bot,
  Send,
  Sparkles,
  X,
  Wand2,
  MessageSquarePlus,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Agent } from "@shared/schema";

// --- Interfaces ---

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
  pendingContent?: {
    service?: string;
    faq?: string;
  };
}

interface AgentResponse {
  success: boolean;
  output: string;
  content: {
    service: string;
    faq: string;
    all: string;
  };
}

// --- Sub-componente: Efecto de Escritura con Markdown ---
function Typewriter({
  text,
  onMessageUpdate,
}: {
  text: string;
  onMessageUpdate: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const currentTextRef = useRef("");

  useEffect(() => {
    setDisplayedText("");
    currentTextRef.current = "";

    if (!text) return;

    const words = text.split(" ");
    let i = 0;

    const interval = setInterval(() => {
      if (i < words.length) {
        currentTextRef.current += (i === 0 ? "" : " ") + words[i];
        setDisplayedText(currentTextRef.current);
        i++;
        onMessageUpdate();
      } else {
        clearInterval(interval);
      }
    }, 35); // Velocidad optimizada

    return () => clearInterval(interval);
  }, [text]);

  return (
    // Dentro de tu función Typewriter o en el render de mensajes
    <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
    </div>
  );
}

// --- Componente Principal ---

export function AgentHelp({
  agent,
  onClose,
  onSaveData,
  scope,
  setScope,
}: {
  agent: Agent;
  onClose: () => void;
  onSaveData: (data: {
    content: string;
    scope?: "faq" | "services" | "all" | "docs";
  }) => void;
  scope: "all" | "services" | "faq" | "docs";
  setScope: (scope: "all" | "services" | "faq" | "docs") => void;
}) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    {
      label: "Configurar FAQs",
      value: "Ayúdame a generar preguntas frecuentes para mi servicio.",
    },
    {
      label: "Descripción de Servicio",
      value: "Redacta una descripción profesional de lo que ofrezco.",
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  };

  // Efecto para scroll automático cuando hay carga o nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (overrideInput?: string) => {
    const textToSend = (overrideInput || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/pd_configura_agente`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            scope,
            company_id: agent.company_id,
            agent_id: agent.id,
          }),
        },
      );

      if (!response.ok) throw new Error("Error de conexión con el servidor");

      const data = (await response.json()) as AgentResponse;

      if (data.success) {
        const agentMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.output || "He procesado tu solicitud.",
          timestamp: new Date().toISOString(),
          pendingContent: data.content,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        throw new Error(data.output || "No pude procesar la solicitud.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Oh no, algo salió mal",
        description: error.message || "SebastIAn tuvo un problema técnico.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[85vh] border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm px-6 py-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold tracking-tight">
              SebastIAn AI
            </CardTitle>
            <CardDescription className="text-[11px] flex items-center gap-1 font-medium text-zinc-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En línea para ayudarte
            </CardDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-8 w-8 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm relative leading-relaxed",
                  msg.role === "user"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-tr-none"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none",
                )}
              >
                {msg.role === "agent" && idx === messages.length - 1 ? (
                  <Typewriter
                    text={msg.content}
                    onMessageUpdate={scrollToBottom}
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}

                {/* Bloques de Propuesta con mejor contraste */}
                {msg.pendingContent && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4 space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800"
                  >
                    {msg.pendingContent.service && (
                      <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                          Propuesta de Servicio
                        </span>
                        <div className="mt-2 text-[12px] italic text-zinc-600 dark:text-zinc-400">
                          <ReactMarkdown>
                            {msg.pendingContent.service}
                          </ReactMarkdown>
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => {
                            onSaveData({
                              content: msg.pendingContent!.service!,
                              scope: "services",
                            });
                            toast({
                              title: "¡Hecho!",
                              description: "Servicio actualizado.",
                            });
                          }}
                        >
                          <Check className="h-3 w-3 mr-2" /> Aplicar Cambios
                        </Button>
                      </div>
                    )}

                    {msg.pendingContent.faq && (
                      <div className="bg-purple-50/50 dark:bg-purple-500/5 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20">
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                          Preguntas Sugeridas
                        </span>
                        <div className="mt-2 text-[12px] italic text-zinc-600 dark:text-zinc-400">
                          <ReactMarkdown>
                            {msg.pendingContent.faq}
                          </ReactMarkdown>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="mt-3 h-8 text-[11px] font-bold border-purple-200 dark:border-purple-900"
                          onClick={() => {
                            onSaveData({
                              content: msg.pendingContent!.faq!,
                              scope: "faq",
                            });
                            toast({
                              title: "Guardado",
                              description: "FAQs añadidas con éxito.",
                            });
                          }}
                        >
                          <Check className="h-3 w-3 mr-2" /> Guardar FAQ
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 w-fit rounded-2xl border border-zinc-100 dark:border-zinc-800"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-2" />
      </CardContent>

      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/30 border-t backdrop-blur-md">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s.value)}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[11px] font-bold hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm text-zinc-600 dark:text-zinc-300 active:scale-95"
            >
              <MessageSquarePlus className="h-3 w-3 text-primary" />
              {s.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            "relative rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden",
            isLoading
              ? "border-primary/30 ring-4 ring-primary/5 bg-zinc-50 dark:bg-zinc-900"
              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5",
          )}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Escribe aquí tu mensaje..."
            className="w-full min-h-[80px] bg-transparent border-none focus-visible:ring-0 p-4 resize-none text-sm placeholder:text-zinc-400"
          />

          <div className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50">
            <div className="flex items-center gap-3">
              <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                <SelectTrigger className="h-8 w-[130px] text-[11px] font-black bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">⚡ General</SelectItem>
                  <SelectItem value="services">💼 Servicios</SelectItem>
                  <SelectItem value="faq">❓ Preguntas</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5 text-[10px] text-primary/70 font-black uppercase tracking-widest">
                <Wand2 className="h-3 w-3 animate-pulse" /> IA Activa
              </div>
            </div>

            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              size="sm"
              className="rounded-xl h-9 px-5 font-bold shadow-lg transition-all active:scale-95"
            >
              {isLoading ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
