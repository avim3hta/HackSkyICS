import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScenarioPanelProps {
  title: string;
  icon: string;
  items: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  type: "attack" | "defense";
  className?: string;
}

export const ScenarioPanel = ({ title, icon, items, type, className }: ScenarioPanelProps) => {
  const isPanelActive = type === "attack";
  
  return (
    <div className={cn("dashboard-panel", className)}>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">{icon}</span>
        <h3 className={cn(
          "text-xl font-semibold",
          type === "attack" ? "text-warning" : "text-success"
        )}>
          {title}
        </h3>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <Button
            key={item.id}
            variant={type === "attack" ? "destructive" : "secondary"}
            className={cn(
              "w-full justify-start text-left h-auto py-3 px-4",
              type === "defense" && "bg-success/10 hover:bg-success/20 text-success border-success/20"
            )}
            disabled={type === "defense"}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Button>
        ))}
      </div>
      
      {type === "defense" && (
        <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center gap-2 text-success text-sm">
            <span>🛡️</span>
            <span className="font-medium">Systems Armed & Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};