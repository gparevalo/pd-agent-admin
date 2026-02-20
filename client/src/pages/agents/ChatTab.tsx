import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Bot, RotateCcw, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// --- Interfaces ---
interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// --- Sub-componente Typewriter MEMORIZADO ---
const Typewriter = React.memo(
  ({
    text,
    onMessageUpdate,
  }: {
    text: string;
    onMessageUpdate: () => void;
  }) => {
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
      }, 35);

      return () => clearInterval(interval);
    }, [text, onMessageUpdate]);

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap text-[13px]">
        <ReactMarkdown>{displayedText}</ReactMarkdown>
      </div>
    );
  }
);

Typewriter.displayName = "Typewriter";

export function ChatTab({ agentId }: { agentId: string }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Memorizar la función de scroll para que no reinicie el Typewriter
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  const sessionId = useMemo(
    () => `session_${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const currentMessageText = input.trim();
    const messageId = crypto.randomUUID();

    const userMessage: ChatMessage = {
      id: messageId,
      role: "user",
      content: currentMessageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://n8n-n8n-pd.rnpew5.easypanel.host/webhook/pd_sales_agent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "web",
            agent_id: agentId,
            session_id: sessionId,
            user_name: "web_user",
            message_id: messageId,
            message: currentMessageText,
          }),
        }
      );

      if (!response.ok) throw new Error();

      const data = await response.json();

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.output || data.message || "No recibí una respuesta clara.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo contactar con el agente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-4xl mx-auto"
    >
      <Card className="flex flex-col h-[80vh] shadow-2xl border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="border-b bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-md py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold tracking-tight">Chat de Prueba AI</CardTitle>
                <CardDescription className="text-[11px] flex items-center gap-1 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Agente activo
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3 text-primary/60" /> Sandbox
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/30 dark:bg-zinc-950/30">
          <AnimatePresence mode="popLayout" initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-3"
              >
                <Bot className="h-8 w-8 opacity-20" />
                <p className="text-xs italic">Esperando tu primer mensaje...</p>
              </motion.div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[85%] px-4 py-3 rounded-2xl shadow-sm relative",
                    msg.role === "user" 
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-tr-none" 
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none"
                  )}>
                    {msg.role === "agent" && index === messages.length - 1 ? (
                      <Typewriter text={msg.content} onMessageUpdate={scrollToBottom} />
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px]">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    <p className="text-[8px] font-bold uppercase opacity-30 mt-1.5 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-900 border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t bg-white dark:bg-zinc-950">
          <div className="relative flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              disabled={isLoading}
              className="flex-1 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary/20"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/20"
            >
              {isLoading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}