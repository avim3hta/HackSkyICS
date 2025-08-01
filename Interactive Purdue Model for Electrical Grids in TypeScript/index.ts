// Types for the Purdue Model Electrical Grid Application

export interface GridComponent {
  id: string;
  name: string;
  type: 'generator' | 'transformer' | 'substation' | 'protection' | 'load';
  status: 'online' | 'offline' | 'warning' | 'error';
  position: {
    x: number;
    y: number;
  };
  level: 0 | 1 | 2 | 3 | 3.5 | 4 | 5;
  parameters?: GridParameters;
}

export interface GridParameters {
  voltage?: number; // in kV
  current?: number; // in A
  activePower?: number; // in kW
  apparentPower?: number; // in kVA
  harmonics?: number; // THD percentage
  temperature?: number; // in Celsius
  capacity?: number; // percentage
  frequency?: number; // in Hz
}

export interface ConnectionFlow {
  id: string;
  from: string;
  to: string;
  type: 'power' | 'data' | 'control';
  direction: 'bidirectional' | 'unidirectional';
  status: 'active' | 'inactive';
  flowRate?: number; // percentage of capacity
}

export interface PurdueLevel {
  level: 0 | 1 | 2 | 3 | 3.5 | 4 | 5;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  components: GridComponent[];
}

export interface GridState {
  components: GridComponent[];
  connections: ConnectionFlow[];
  levels: PurdueLevel[];
  lastUpdated: Date;
}

export interface StatusIndicator {
  status: 'online' | 'offline' | 'warning' | 'error';
  color: string;
  glowColor: string;
  animation: boolean;
}

