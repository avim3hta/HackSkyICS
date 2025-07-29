import { StatusIndicator } from "./StatusIndicator";
import { PlantConfig } from "@/data/plantConfigs";

interface ProcessStatusProps {
  plantConfig: PlantConfig;
}

export const ProcessStatus = ({ plantConfig }: ProcessStatusProps) => {
  if (!plantConfig) {
    return <div className="dashboard-panel">Loading...</div>;
  }
  
  return (
    <div className="dashboard-panel">
      <h3 className="text-xl font-semibold mb-6 text-primary">Plant Process Status</h3>
      
      {/* Process Diagram */}
      <div className="mb-6 relative">
        <img 
          src={plantConfig.image} 
          alt={`${plantConfig.name} Process Diagram`} 
          className="w-full h-64 object-cover rounded-lg border border-border/50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent rounded-lg"></div>
      </div>

      {/* Process Status Items */}
      <div className="space-y-3">
        {plantConfig.processItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
            <span className="font-medium text-foreground">{item.label}</span>
            <StatusIndicator status={item.type} label={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
};