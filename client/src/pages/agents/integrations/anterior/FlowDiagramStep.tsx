import { ArrowRight } from "lucide-react";
import React from "react";

export function FlowDiagramStep({
  label,
  icon: Icon,
  isLast,
}: {
  label: string;
  icon: React.ComponentType<any>;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      {!isLast && (
        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mx-1" />
      )}
    </div>
  );
}
