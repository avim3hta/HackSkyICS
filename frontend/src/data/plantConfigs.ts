import processDiagram from "@/assets/process-diagram.jpg";
import nuclearDiagram from "@/assets/nuclear-diagram.jpg";
import gridDiagram from "@/assets/grid-diagram.jpg";

export interface ProcessItem {
  id: string;
  label: string;
  status: string;
  type: "normal" | "warning" | "critical";
}

export interface PlantConfig {
  id: string;
  name: string;
  title: string;
  icon: string;
  image: string;
  processItems: ProcessItem[];
  attackScenarios: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  defenseResponses: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
}

export const plantConfigs: PlantConfig[] = [
  {
    id: "water",
    name: "Water Treatment Plant",
    title: "🏭 WATER TREATMENT PLANT - LIVE OPERATIONS",
    icon: "🏭",
    image: processDiagram,
    processItems: [
      { id: "pump1", label: "PUMP-1", status: "ON", type: "normal" },
      { id: "pump2", label: "PUMP-2", status: "ON", type: "normal" },
      { id: "valveA", label: "VALVE-A", status: "50%", type: "normal" },
      { id: "valveB", label: "VALVE-B", status: "75%", type: "normal" },
      { id: "tank", label: "TANK LEVEL", status: "75% FULL", type: "normal" },
    ],
    attackScenarios: [
      { id: "dos", label: "Launch DoS Attack", icon: "⚔️" },
      { id: "control", label: "Unauthorized Control", icon: "⚔️" },
      { id: "manipulation", label: "Data Manipulation", icon: "⚔️" },
    ],
    defenseResponses: [
      { id: "isolation", label: "Auto-Isolation", icon: "🛡️" },
      { id: "filtering", label: "Traffic Filtering", icon: "🛡️" },
      { id: "shutdown", label: "Emergency Shutdown", icon: "🛡️" },
    ],
  },
  {
    id: "nuclear",
    name: "Nuclear Power Plant",
    title: "☢️ NUCLEAR POWER PLANT - LIVE OPERATIONS",
    icon: "☢️",
    image: nuclearDiagram,
    processItems: [
      { id: "reactor1", label: "REACTOR-1", status: "ACTIVE", type: "normal" },
      { id: "reactor2", label: "REACTOR-2", status: "ACTIVE", type: "normal" },
      { id: "coolantA", label: "COOLANT-A", status: "285°C", type: "normal" },
      { id: "coolantB", label: "COOLANT-B", status: "290°C", type: "normal" },
      { id: "containment", label: "CONTAINMENT", status: "SEALED", type: "normal" },
    ],
    attackScenarios: [
      { id: "scram", label: "Forced SCRAM Attack", icon: "⚔️" },
      { id: "coolant", label: "Coolant System Breach", icon: "⚔️" },
      { id: "control", label: "Control Rod Override", icon: "⚔️" },
    ],
    defenseResponses: [
      { id: "scram", label: "Emergency SCRAM", icon: "🛡️" },
      { id: "cooling", label: "Backup Cooling", icon: "🛡️" },
      { id: "isolation", label: "System Isolation", icon: "🛡️" },
    ],
  },
  {
    id: "grid",
    name: "Electrical Grid",
    title: "⚡ ELECTRICAL GRID - LIVE OPERATIONS",
    icon: "⚡",
    image: gridDiagram,
    processItems: [
      { id: "gen1", label: "GENERATOR-1", status: "ONLINE", type: "normal" },
      { id: "gen2", label: "GENERATOR-2", status: "ONLINE", type: "normal" },
      { id: "transA", label: "TRANSFORMER-A", status: "138kV", type: "normal" },
      { id: "transB", label: "TRANSFORMER-B", status: "345kV", type: "normal" },
      { id: "load", label: "GRID LOAD", status: "85% CAP", type: "normal" },
    ],
    attackScenarios: [
      { id: "blackout", label: "Coordinated Blackout", icon: "⚔️" },
      { id: "overload", label: "System Overload", icon: "⚔️" },
      { id: "frequency", label: "Frequency Attack", icon: "⚔️" },
    ],
    defenseResponses: [
      { id: "shedding", label: "Load Shedding", icon: "🛡️" },
      { id: "reroute", label: "Auto Rerouting", icon: "🛡️" },
      { id: "stabilize", label: "Frequency Stabilization", icon: "🛡️" },
    ],
  },
];

export const getPlantConfig = (plantId: string): PlantConfig => {
  return plantConfigs.find(config => config.id === plantId) || plantConfigs[0];
};