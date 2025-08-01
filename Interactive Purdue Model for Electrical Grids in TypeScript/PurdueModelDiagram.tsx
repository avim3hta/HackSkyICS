import React, { useState, useMemo } from 'react';
import { GridComponent, StatusIndicator } from '../types';
import { initialGridState } from '../data/gridData';
import { useRealTimeData } from '../hooks/useRealTimeData';
import GridComponentSVG from './GridComponentSVG';
import ConnectionFlowSVG from './ConnectionFlowSVG';
import PurdueLevelLayer from './PurdueLevelLayer';
import StatusPanel from './StatusPanel';
import SystemHealthDashboard from './SystemHealthDashboard';
import ControlPanel from './ControlPanel';
import AnimatedBackground from './AnimatedBackground';

const PurdueModelDiagram: React.FC = () => {
  const {
    gridState,
    isSimulating,
    startSimulation,
    stopSimulation,
    resetToInitialState,
    toggleComponentStatus,
    getSystemHealth
  } = useRealTimeData({ initialState: initialGridState });

  const [selectedComponent, setSelectedComponent] = useState<GridComponent | null>(null);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  // Calculate system metrics
  const systemMetrics = useMemo(() => {
    const health = getSystemHealth();
    
    const temperatures = gridState.components
      .map(c => c.parameters?.temperature)
      .filter(t => t !== undefined) as number[];
    const averageTemperature = temperatures.length > 0 
      ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length 
      : 0;

    const totalPowerGeneration = gridState.components
      .filter(c => c.type === 'generator' && c.status === 'online')
      .reduce((sum, c) => sum + (c.parameters?.activePower || 0), 0);

    const gridLoadComponent = gridState.components.find(c => c.type === 'load');
    const gridLoad = gridLoadComponent?.parameters?.capacity || 0;

    return {
      health,
      averageTemperature,
      totalPowerGeneration,
      gridLoad
    };
  }, [gridState, getSystemHealth]);

  const getStatusIndicator = (status: string): StatusIndicator => {
    switch (status) {
      case 'online':
        return {
          status: 'online',
          color: '#22c55e',
          glowColor: '#22c55e',
          animation: true
        };
      case 'offline':
        return {
          status: 'offline',
          color: '#ef4444',
          glowColor: '#ef4444',
          animation: false
        };
      case 'warning':
        return {
          status: 'warning',
          color: '#eab308',
          glowColor: '#eab308',
          animation: true
        };
      case 'error':
        return {
          status: 'error',
          color: '#dc2626',
          glowColor: '#dc2626',
          animation: true
        };
      default:
        return {
          status: 'offline',
          color: '#6b7280',
          glowColor: '#6b7280',
          animation: false
        };
    }
  };

  const handleComponentClick = (component: GridComponent) => {
    setSelectedComponent(component);
  };

  const handleComponentHover = (componentId: string | null) => {
    setHoveredComponent(componentId);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header - Reduced height */}
      <div className="glass-panel border-b border-slate-700 p-3 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              Interactive Purdue Model - Electrical Grid Visualization
            </h1>
            <div className="flex items-center space-x-4 text-xs text-slate-300">
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
          
          {/* Quick Stats - Compact */}
          <div className="flex space-x-3 text-xs">
            <div className="text-center interactive-element">
              <div className="text-white font-bold text-sm">
                {(systemMetrics.totalPowerGeneration / 1000).toFixed(1)}
              </div>
              <div className="text-slate-400">GW Generated</div>
            </div>
            <div className="text-center interactive-element">
              <div className="text-white font-bold text-sm">
                {systemMetrics.gridLoad.toFixed(0)}%
              </div>
              <div className="text-slate-400">Grid Load</div>
            </div>
            <div className="text-center interactive-element">
              <div className="text-white font-bold text-sm">
                {systemMetrics.health.online}/{systemMetrics.health.total}
              </div>
              <div className="text-slate-400">Online</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Left Sidebar - Reduced width */}
        <div className="w-64 glass-panel border-r border-slate-700 p-3 space-y-3 overflow-y-auto relative z-10">
          <SystemHealthDashboard
            health={systemMetrics.health}
            averageTemperature={systemMetrics.averageTemperature}
            totalPowerGeneration={systemMetrics.totalPowerGeneration}
            gridLoad={systemMetrics.gridLoad}
          />
          
          <ControlPanel
            isSimulating={isSimulating}
            onStartSimulation={startSimulation}
            onStopSimulation={stopSimulation}
            onResetToInitialState={resetToInitialState}
            onToggleComponentStatus={toggleComponentStatus}
            components={gridState.components.map(c => ({
              id: c.id,
              name: c.name,
              status: c.status
            }))}
          />
        </div>

        {/* Main Diagram Area - Centered and properly sized */}
        <div className="flex-1 relative flex items-center justify-center">
          <svg
            width="90%"
            height="85%"
            viewBox="0 0 1200 700"
            className="bg-slate-900/30 rounded-lg border border-slate-700/50"
          >
            {/* Purdue Level Background Layers - Reduced opacity to prevent overlap */}
            {gridState.levels.map((level) => (
              <PurdueLevelLayer
                key={level.level}
                level={{
                  ...level,
                  color: level.color + '40' // Add transparency
                }}
                width={1200}
                height={700}
              />
            ))}

            {/* Grid for reference */}
            <defs>
              <pattern
                id="grid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
              </pattern>
              
              {/* Enhanced glow filters */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Connection Flows */}
            {gridState.connections.map((connection) => (
              <ConnectionFlowSVG
                key={connection.id}
                connection={connection}
                components={gridState.components}
                isHighlighted={
                  hoveredComponent === connection.from ||
                  hoveredComponent === connection.to
                }
              />
            ))}

            {/* Grid Components */}
            {gridState.components.map((component) => (
              <GridComponentSVG
                key={component.id}
                component={component}
                statusIndicator={getStatusIndicator(component.status)}
                isSelected={selectedComponent?.id === component.id}
                isHovered={hoveredComponent === component.id}
                onClick={() => handleComponentClick(component)}
                onHover={(id) => handleComponentHover(id)}
              />
            ))}

            {/* Level Labels - Reduced opacity and size */}
            {gridState.levels.map((level, index) => (
              <text
                key={level.level}
                x="20"
                y={50 + index * 100}
                fill={level.color}
                fontSize="12"
                fontWeight="bold"
                className="font-mono"
                opacity="0.6"
                filter="url(#glow)"
              >
                Level {level.level}: {level.name}
              </text>
            ))}
          </svg>
        </div>

        {/* Right Side Panel - Conditional rendering and reduced width */}
        {selectedComponent && (
          <div className="w-72">
            <StatusPanel
              selectedComponent={selectedComponent}
              gridState={gridState}
              onClose={() => setSelectedComponent(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PurdueModelDiagram;

