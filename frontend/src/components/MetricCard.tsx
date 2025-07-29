import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: "normal" | "warning" | "critical";
  className?: string;
}

export const MetricCard = ({ title, value, unit, status = "normal", className }: MetricCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "normal":
        return "text-success";
      case "warning":
        return "text-warning";
      case "critical":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className={cn("metric-card", className)}>
      <div className="text-sm text-muted-foreground mb-1">{title}</div>
      <div className={cn("text-2xl font-bold", getStatusColor())}>
        {value}
        {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
};