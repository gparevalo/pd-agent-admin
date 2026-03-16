import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PipelineStepsChecklistProps {
  operationId: string;
  currentStage: string;
}

export default function PipelineStepsChecklist({ operationId, currentStage }: PipelineStepsChecklistProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stepsGrouped, isLoading } = useQuery<Record<string, any[]>>({
    queryKey: [`/api/operations/${operationId}/steps`],
    enabled: !!operationId,
  });

  const toggleStepMutation = useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: string; completed: boolean }) => {
      await apiRequest("PATCH", `/api/operations/steps/${stepId}`, { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/operations/${operationId}/steps`] });
      // Invalidate 360 view if stage progress is shown there
      queryClient.invalidateQueries({ queryKey: [/client-operations\/client-360/] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!stepsGrouped || !stepsGrouped[currentStage]) {
      return (
        <div className="p-5 border rounded-2xl bg-card shadow-sm">
            <p className="text-xs text-muted-foreground italic">No hay tareas pendientes en esta etapa.</p>
        </div>
      );
  }

  const steps = stepsGrouped[currentStage];

  return (
    <div className="space-y-4 p-5 border rounded-2xl bg-card shadow-sm h-full">
      <div className="flex items-center gap-2 text-primary font-semibold mb-2">
        <ListChecks className="h-5 w-5" />
        <h3 className="text-sm">Tareas Pendientes</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 group">
            <Checkbox
              id={step.id}
              checked={step.completed}
              onCheckedChange={(checked) => 
                toggleStepMutation.mutate({ stepId: step.id, completed: !!checked })
              }
              disabled={toggleStepMutation.isPending}
              className="h-5 w-5 rounded-md border-primary/30 data-[state=checked]:bg-primary transition-all"
            />
            <label
              htmlFor={step.id}
              className={`text-sm font-medium transition-all ${
                step.completed ? 'text-muted-foreground line-through opacity-60' : 'text-foreground hover:text-primary'
              } cursor-pointer select-none`}
            >
              {step.step_name}
            </label>
          </div>
        ))}
        {steps.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No hay pasos definidos para esta etapa.</p>
        )}
      </div>
    </div>
  );
}
