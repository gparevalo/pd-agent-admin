import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, MessageSquare, User } from "lucide-react";

export default function ConversationDetail({
  conversation,
}: {
  conversation: Conversation | null;
}) {
  const { token } = useAuth();
  if (!conversation?.id) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Selecciona una conversación para ver los detalles</p>
      </div>
    );
  }
  const conversationid = conversation?.id;

  const { data: messages, isLoading: loading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationid, "messages"],
    queryFn: async () =>
      api.get(`/conversations/${conversationid}/messages`, token || undefined),
    enabled: !!token && !!conversationid,
  });

  console.log("---> messages: ", messages);

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Conversación #{conversation.id.slice(-6)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {conversation.started_at
                ? new Date(conversation.started_at).toLocaleString()
                : ""}
            </p>
          </div>
          <Badge
            variant={conversation.status === "active" ? "default" : "secondary"}
          >
            {conversation.status === "active" ? "Activa" : "Cerrada"}
          </Badge>
        </div>
      </div>

      {/* MENSAJES */}
      <ScrollArea className="flex-1 p-4">
        {loading && (
          <p className="text-sm text-muted-foreground">Cargando mensajes...</p>
        )}

        <div className="space-y-4">
          {messages &&
            messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-3 ${
                  msg.sender === "agent" ? "" : "flex-row-reverse"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender === "agent" ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {msg.sender === "agent" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div
                  className={`max-w-[70%] ${
                    msg.sender === "agent" ? "" : "text-right"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      msg.sender === "agent"
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(msg.started_at).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>
      </ScrollArea>

      {conversation.summary && (
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Resumen del Agente
          </p>
          <p className="text-sm">{conversation.summary}</p>
        </div>
      )}
    </div>
  );
}
