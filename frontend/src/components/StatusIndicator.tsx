import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "normal" | "warning" | "critical";
  label: string;
  className?: string;
}

export const StatusIndicator = ({ status, label, className }: StatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "normal":
        return {
          icon: "🟢",
          classes: "status-normal status-pulse",
        };
      case "warning":
        return {
          icon: "🟡",
          classes: "status-warning status-pulse",
        };
      case "critical":
        return {
          icon: "🔴",
          classes: "bg-destructive/20 text-destructive border border-destructive/30",
        };
      default:
        return {
          icon: "⚪",
          classes: "bg-muted/20 text-muted-foreground border border-muted/30",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn("status-indicator", config.classes, className)}>
      <span className="text-xs">{config.icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
};