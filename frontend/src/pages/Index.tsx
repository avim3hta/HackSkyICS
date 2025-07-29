import { useState } from "react";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ProcessStatus } from "@/components/ProcessStatus";
import { SecurityMonitoring } from "@/components/SecurityMonitoring";
import { ScenarioPanel } from "@/components/ScenarioPanel";
import { PlantSelector } from "@/components/PlantSelector";
import { getPlantConfig } from "@/data/plantConfigs";

const Index = () => {
  const [selectedPlantId, setSelectedPlantId] = useState("water");
  const selectedPlant = getPlantConfig(selectedPlantId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Bar */}
      <header className="bg-card border-b border-border px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-3">
              <span className="text-3xl">{selectedPlant.icon}</span>
              {selectedPlant.title}
            </h1>
            <PlantSelector 
              selectedPlant={selectedPlant} 
              onPlantChange={setSelectedPlantId} 
            />
          </div>
          
          <div className="flex items-center gap-6">
            <StatusIndicator status="normal" label="SYSTEM NORMAL" />
            <StatusIndicator status="normal" label="PROTECTED" />
            <div className="status-indicator bg-muted/20 text-muted-foreground border border-muted/30">
              <span className="text-xs">🔵</span>
              <span className="font-medium">THREAT LEVEL: LOW</span>
            </div>
            <a 
              href="/anomaly" 
              className="px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-md text-sm font-medium hover:bg-blue-500/20 transition-colors"
            >
              🤖 AI Detection
            </a>
            <a 
              href="/admin" 
              className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              🔧 Admin
            </a>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column: Process Overview */}
          <ProcessStatus plantConfig={selectedPlant} />
          
          {/* Right Column: Security Monitoring */}
          <SecurityMonitoring selectedPlantId={selectedPlantId} />
        </div>

        {/* Bottom Section: Defense Responses */}
        <div className="grid grid-cols-1 gap-6">
          <ScenarioPanel
            title="Autonomous Defense Responses"
            icon="🛡️"
            items={selectedPlant.defenseResponses}
          />
        </div>
      </main>


    </div>
  );
};

export default Index;