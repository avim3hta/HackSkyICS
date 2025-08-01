import React, { useState, useMemo } from 'react';

// Types from the original Purdue model
interface GridComponent {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  position: { x: number; y: number };
  level: number;
  parameters?: {
    voltage?: number;
    current?: number;
    activePower?: number;
    temperature?: number;
  };
}

interface GridState {
  components: GridComponent[];
  levels: Array<{
    level: number;
    name: string;
    color: string;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
  lastUpdated: Date;
}

// Sample grid state similar to original
const initialGridState: GridState = {
  components: [
    {
      id: 'gen1',
      name: 'Generator Unit 1',
      type: 'generator',
      status: 'online',
      position: { x: 200, y: 500 },
      level: 0,
      parameters: { voltage: 345000, current: 800, activePower: 400000, temperature: 65 }
    },
    {
      id: 'trans1',
      name: 'Main Transformer',
      type: 'transformer',
      status: 'online',
      position: { x: 400, y: 450 },
      level: 1,
      parameters: { voltage: 138000, current: 1200, activePower: 300000, temperature: 55 }
    },
    {
      id: 'trans2',
      name: 'Distribution Transformer',
      type: 'transformer',
      status: 'online',
      position: { x: 600, y: 400 },
      level: 2,
      parameters: { voltage: 22000, current: 600, activePower: 150000, temperature: 45 }
    },
    {
      id: 'load1',
      name: 'Industrial Load',
      type: 'load',
      status: 'online',
      position: { x: 800, y: 350 },
      level: 3,
      parameters: { voltage: 400, current: 300, activePower: 120000, temperature: 35 }
    }
  ],
  levels: [
    { level: 0, name: 'Generation', color: '#ef4444', bounds: { x: 50, y: 450, width: 300, height: 150 } },
    { level: 1, name: 'Transmission', color: '#f97316', bounds: { x: 350, y: 400, width: 200, height: 150 } },
    { level: 2, name: 'Distribution', color: '#eab308', bounds: { x: 550, y: 350, width: 200, height: 150 } },
    { level: 3, name: 'Load', color: '#22c55e', bounds: { x: 750, y: 300, width: 200, height: 150 } }
  ],
  lastUpdated: new Date()
};

const PurdueLevelLayer: React.FC<{
  level: { level: number; name: string; color: string; bounds: { x: number; y: number; width: number; height: number } };
  width: number;
  height: number;
}> = ({ level }) => (
  <g>
    <rect
      x={level.bounds.x}
      y={level.bounds.y}
      width={level.bounds.width}
      height={level.bounds.height}
      fill={level.color}
      fillOpacity={0.1}
      stroke={level.color}
      strokeWidth={2}
      strokeDasharray="5,5"
      rx={10}
    />
    <text
      x={level.bounds.x + 10}
      y={level.bounds.y + 25}
      fill={level.color}
      fontSize="14"
      fontWeight="bold"
    >
      Level {level.level}: {level.name}
    </text>
  </g>
);

const GridComponentSVG: React.FC<{
  component: GridComponent;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({ component, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }) => {
  const getComponentIcon = () => {
    switch (component.type) {
      case 'generator': return '⚙️';
      case 'transformer': return '🔌';
      case 'load': return '🏭';
      default: return '⚡';
    }
  };

  const getStatusColor = () => {
    switch (component.status) {
      case 'online': return '#22c55e';
      case 'warning': return '#eab308';
      case 'error': return '#ef4444';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <g
      transform={`translate(${component.position.x}, ${component.position.y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="cursor-pointer"
    >
      {/* Component background */}
      <rect
        x={-40}
        y={-30}
        width={80}
        height={60}
        fill={getStatusColor()}
        fillOpacity={isSelected ? 0.3 : isHovered ? 0.2 : 0.1}
        stroke={getStatusColor()}
        strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
        rx={8}
      />
      
      {/* Component icon */}
      <text
        x={0}
        y={-5}
        textAnchor="middle"
        fontSize="20"
      >
        {getComponentIcon()}
      </text>
      
      {/* Component name */}
      <text
        x={0}
        y={15}
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
      >
        {component.name}
      </text>
      
      {/* Status indicator */}
      <circle
        cx={30}
        cy={-20}
        r={4}
        fill={getStatusColor()}
        className={component.status === 'online' ? 'animate-pulse' : ''}
      />
    </g>
  );
};

const ConnectionFlowSVG: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  animated?: boolean;
}> = ({ from, to, animated = true }) => (
  <g>
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon
          points="0 0, 10 3.5, 0 7"
          fill="#3b82f6"
        />
      </marker>
    </defs>
    
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="#3b82f6"
      strokeWidth="3"
      markerEnd="url(#arrowhead)"
      className={animated ? 'animate-pulse' : ''}
    />
  </g>
);

const OriginalPurdueModel: React.FC = () => {
  const [gridState] = useState<GridState>(initialGridState);
  const [selectedComponent, setSelectedComponent] = useState<GridComponent | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const systemMetrics = useMemo(() => {
    const onlineComponents = gridState.components.filter(c => c.status === 'online').length;
    const totalComponents = gridState.components.length;
    const totalPowerGeneration = gridState.components
      .filter(c => c.type === 'generator' && c.status === 'online')
      .reduce((sum, c) => sum + (c.parameters?.activePower || 0), 0);

    return {
      health: {
        status: onlineComponents === totalComponents ? 'healthy' : onlineComponents > totalComponents * 0.8 ? 'warning' : 'critical',
        online: onlineComponents,
        total: totalComponents
      },
      totalPowerGeneration,
      averageTemperature: gridState.components
        .map(c => c.parameters?.temperature || 0)
        .reduce((sum, temp) => sum + temp, 0) / gridState.components.length
    };
  }, [gridState]);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              Interactive Purdue Model - Electrical Grid
            </h1>
            <div className="flex items-center space-x-4 text-sm text-slate-300">
              <span>Last Updated: {gridState.lastUpdated.toLocaleTimeString()}</span>
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  systemMetrics.health.status === 'healthy' ? 'bg-green-500 animate-pulse' :
                  systemMetrics.health.status === 'warning' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500 animate-pulse'
                }`}></div>
                System {systemMetrics.health.status === 'healthy' ? 'Healthy' : 
                        systemMetrics.health.status === 'warning' ? 'Warning' : 'Critical'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4 text-sm">
            <div className="text-center">
              <div className="text-white font-bold">
                {(systemMetrics.totalPowerGeneration / 1000).toFixed(1)} MW
              </div>
              <div className="text-slate-400">Generated</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">
                {systemMetrics.health.online}/{systemMetrics.health.total}
              </div>
              <div className="text-slate-400">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Diagram */}
      <div className="flex-1 p-6">
        <div className="w-full h-96 relative">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1000 500"
            className="bg-slate-900/30 rounded-lg border border-slate-700/50"
          >
            {/* Purdue Level Layers */}
            {gridState.levels.map((level) => (
              <PurdueLevelLayer
                key={level.level}
                level={level}
                width={1000}
                height={500}
              />
            ))}

            {/* Connections between components */}
            <ConnectionFlowSVG
              from={{ x: 250, y: 500 }}
              to={{ x: 400, y: 450 }}
              animated={true}
            />
            <ConnectionFlowSVG
              from={{ x: 450, y: 450 }}
              to={{ x: 600, y: 400 }}
              animated={true}
            />
            <ConnectionFlowSVG
              from={{ x: 650, y: 400 }}
              to={{ x: 800, y: 350 }}
              animated={true}
            />

            {/* Grid Components */}
            {gridState.components.map((component) => (
              <GridComponentSVG
                key={component.id}
                component={component}
                isSelected={selectedComponent?.id === component.id}
                isHovered={hoveredComponent === component.id}
                onClick={() => setSelectedComponent(component)}
                onMouseEnter={() => setHoveredComponent(component.id)}
                onMouseLeave={() => setHoveredComponent(null)}
              />
            ))}
          </svg>
        </div>

        {/* Component Details Panel */}
        {selectedComponent && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-3">{selectedComponent.name}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-slate-400">Status</div>
                <div className={`font-semibold ${
                  selectedComponent.status === 'online' ? 'text-green-400' : 
                  selectedComponent.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {selectedComponent.status.toUpperCase()}
                </div>
              </div>
              {selectedComponent.parameters?.voltage && (
                <div>
                  <div className="text-slate-400">Voltage</div>
                  <div className="text-white font-semibold">
                    {(selectedComponent.parameters.voltage / 1000).toFixed(1)} kV
                  </div>
                </div>
              )}
              {selectedComponent.parameters?.current && (
                <div>
                  <div className="text-slate-400">Current</div>
                  <div className="text-white font-semibold">
                    {selectedComponent.parameters.current} A
                  </div>
                </div>
              )}
              {selectedComponent.parameters?.activePower && (
                <div>
                  <div className="text-slate-400">Power</div>
                  <div className="text-white font-semibold">
                    {(selectedComponent.parameters.activePower / 1000).toFixed(1)} kW
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OriginalPurdueModel;