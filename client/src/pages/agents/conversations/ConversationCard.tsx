import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Conversation } from "@shared/schema";
import { motion } from "framer-motion";
import { CheckCircle, Clock, MessageSquare } from "lucide-react";

export default function ConversationCard({
  conversation,
}: {
  conversation: Conversation;
}) {
  const isActive = conversation.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="hover-elevate"
    >
      <Card className="cursor-pointer transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${isActive ? "bg-primary/10" : "bg-muted"}`}
            >
              <MessageSquare
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-medium truncate">
                  Conversación #{conversation.id.slice(-6)}
                </p>
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Activa" : "Cerrada"}
                </Badge>
              </div>
              {conversation.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {conversation.summary}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {conversation.started_at
                    ? new Date(conversation.started_at).toLocaleDateString()
                    : "—"}
                </span>
                {conversation.ended_at && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Cerrada:{" "}
                    {new Date(conversation.ended_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
