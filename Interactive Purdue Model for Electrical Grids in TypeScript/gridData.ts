import { GridComponent, ConnectionFlow, PurdueLevel, GridState } from '../types';

// Initial grid components based on user requirements
export const initialComponents: GridComponent[] = [
  // Level 0-1: Physical Process and Intelligent Devices
  {
    id: 'generator-1',
    name: 'GENERATOR-1',
    type: 'generator',
    status: 'online',
    position: { x: 200, y: 550 }, // Moved more to center
    level: 1,
    parameters: {
      voltage: 138,
      activePower: 850000, // 850 MW
      frequency: 60,
      temperature: 75
    }
  },
  {
    id: 'generator-2',
    name: 'GENERATOR-2',
    type: 'generator',
    status: 'online',
    position: { x: 400, y: 550 }, // Moved more to center
    level: 1,
    parameters: {
      voltage: 138,
      activePower: 920000, // 920 MW
      frequency: 60,
      temperature: 78
    }
  },
  {
    id: 'transformer-a',
    name: 'TRANSFORMER-A',
    type: 'transformer',
    status: 'online',
    position: { x: 300, y: 450 }, // Centered between generators
    level: 1,
    parameters: {
      voltage: 138,
      temperature: 65
    }
  },
  {
    id: 'transformer-b',
    name: 'TRANSFORMER-B',
    type: 'transformer',
    status: 'online',
    position: { x: 600, y: 450 }, // Better positioning
    level: 1,
    parameters: {
      voltage: 345,
      temperature: 68
    }
  },
  {
    id: 'substation-1',
    name: 'SUBSTATION-1',
    type: 'substation',
    status: 'online',
    position: { x: 500, y: 350 }, // Centered vertically
    level: 2,
    parameters: {
      voltage: 138,
      temperature: 45
    }
  },
  {
    id: 'substation-2',
    name: 'SUBSTATION-2',
    type: 'substation',
    status: 'online',
    position: { x: 800, y: 350 }, // Better horizontal spacing
    level: 2,
    parameters: {
      voltage: 345,
      temperature: 48
    }
  },
  {
    id: 'protection-system',
    name: 'PROTECTION',
    type: 'protection',
    status: 'online',
    position: { x: 650, y: 250 }, // Centered in control layer
    level: 2,
    parameters: {
      voltage: 138,
      temperature: 35
    }
  },
  {
    id: 'grid-load',
    name: 'GRID LOAD',
    type: 'load',
    status: 'online',
    position: { x: 950, y: 450 }, // Right side for load
    level: 1,
    parameters: {
      capacity: 85, // 85% capacity
      activePower: 1500000, // 1.5 GW
      voltage: 138
    }
  }
];

// Connection flows between components
export const initialConnections: ConnectionFlow[] = [
  {
    id: 'gen1-trans-a',
    from: 'generator-1',
    to: 'transformer-a',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 85
  },
  {
    id: 'gen2-trans-b',
    from: 'generator-2',
    to: 'transformer-b',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 92
  },
  {
    id: 'trans-a-sub1',
    from: 'transformer-a',
    to: 'substation-1',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 85
  },
  {
    id: 'trans-b-sub2',
    from: 'transformer-b',
    to: 'substation-2',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 92
  },
  {
    id: 'sub1-load',
    from: 'substation-1',
    to: 'grid-load',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 85
  },
  {
    id: 'sub2-load',
    from: 'substation-2',
    to: 'grid-load',
    type: 'power',
    direction: 'unidirectional',
    status: 'active',
    flowRate: 92
  },
  {
    id: 'protection-control',
    from: 'protection-system',
    to: 'substation-1',
    type: 'control',
    direction: 'bidirectional',
    status: 'active',
    flowRate: 100
  }
];

// Purdue Model levels
export const purduelevels: PurdueLevel[] = [
  {
    level: 0,
    name: 'Physical Process',
    description: 'The actual physical processes',
    riskLevel: 'critical',
    color: '#ef4444',
    components: []
  },
  {
    level: 1,
    name: 'Intelligent Devices',
    description: 'Sensing and manipulating the physical process',
    riskLevel: 'critical',
    color: '#f97316',
    components: initialComponents.filter(c => c.level === 1)
  },
  {
    level: 2,
    name: 'Control Systems',
    description: 'Supervising, monitoring, and controlling the physical process',
    riskLevel: 'high',
    color: '#eab308',
    components: initialComponents.filter(c => c.level === 2)
  },
  {
    level: 3,
    name: 'Manufacturing Operations',
    description: 'Managing production workflow',
    riskLevel: 'medium',
    color: '#22c55e',
    components: initialComponents.filter(c => c.level === 3)
  },
  {
    level: 3.5,
    name: 'Demilitarized Zone',
    description: 'Access gateway for IT governance and vendor support',
    riskLevel: 'medium',
    color: '#06b6d4',
    components: initialComponents.filter(c => c.level === 3.5)
  },
  {
    level: 4,
    name: 'Business Logistics',
    description: 'Corporate IT systems and business logistics',
    riskLevel: 'low',
    color: '#3b82f6',
    components: initialComponents.filter(c => c.level === 4)
  },
  {
    level: 5,
    name: 'External/Cloud Access',
    description: 'External connections, vendor support, and cloud access',
    riskLevel: 'low',
    color: '#8b5cf6',
    components: initialComponents.filter(c => c.level === 5)
  }
];

// Initial grid state
export const initialGridState: GridState = {
  components: initialComponents,
  connections: initialConnections,
  levels: purduelevels,
  lastUpdated: new Date()
};

