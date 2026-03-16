import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Layout } from "lucide-react";

interface PipelineTimelineProps {
  operationId: string;
}

export default function PipelineTimeline({ operationId }: PipelineTimelineProps) {
  const { data: steps, isLoading } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/operations/${operationId}/steps`],
    enabled: !!operationId,
  });

  if (isLoading || !steps) return null;

  const allSteps = Object.values(steps).flat();
  const totalSteps = allSteps.length;
  const completedSteps = allSteps.filter((s: any) => s.completed).length;
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-4 p-5 border rounded-2xl bg-card shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <Layout className="h-5 w-5" />
          <h3 className="text-sm">Progreso Global</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-tighter text-primary bg-primary/10 px-2 py-1 rounded-lg">
          {completedSteps} / {totalSteps} Pasos
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-muted-foreground uppercase tracking-widest">Ejecución del Pipeline</span>
          <span>{percentage}%</span>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>

      <div className="flex justify-between gap-1 pt-4 border-t border-muted/50">
        {Object.entries(steps).map(([stage, stageSteps]) => {
          const completedCount = stageSteps.filter(s => s.completed).length;
          const totalCount = stageSteps.length;
          const isFull = completedCount === totalCount && totalCount > 0;
          const isPartial = completedCount > 0 && !isFull;

          return (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={`h-1.5 w-full rounded-full transition-colors ${
                isFull ? 'bg-primary' : isPartial ? 'bg-primary/30' : 'bg-muted'
              }`} />
              <span className={`text-[9px] font-bold uppercase truncate max-w-full text-center ${
                isFull ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {stage.replace('_', ' ')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
