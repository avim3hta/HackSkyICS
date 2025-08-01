import React from 'react';
import { GridComponent, GridState } from '../types';
import { X, Zap, Thermometer, Activity, Gauge } from 'lucide-react';

interface StatusPanelProps {
  selectedComponent: GridComponent | null;
  gridState: GridState;
  onClose: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  selectedComponent,
  gridState,
  onClose
}) => {
  if (!selectedComponent) {
    return (
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-l border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">System Overview</h2>
        
        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Grid Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">Total Components:</span>
                <span className="text-white font-medium">{gridState.components.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Online:</span>
                <span className="text-green-400 font-medium">
                  {gridState.components.filter(c => c.status === 'online').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Offline:</span>
                <span className="text-red-400 font-medium">
                  {gridState.components.filter(c => c.status === 'offline').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Purdue Levels</h3>
            <div className="space-y-2">
              {gridState.levels.map(level => (
                <div key={level.level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <span className="text-slate-300 text-sm">Level {level.level}</span>
                  </div>
                  <span className="text-white text-sm">
                    {level.components.length} components
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-slate-400 text-sm">
            Click on a component to view detailed information
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium uppercase";
    switch (status) {
      case 'online':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'offline':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'warning':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`;
      case 'error':
        return `${baseClasses} bg-red-600/20 text-red-500 border border-red-600/30`;
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
    }
  };

  return (
    <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-l border-slate-700 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Component Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Component Info */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">{selectedComponent.name}</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Type:</span>
              <span className="text-white font-medium capitalize">{selectedComponent.type}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Status:</span>
              <span className={getStatusBadge(selectedComponent.status)}>
                {selectedComponent.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Purdue Level:</span>
              <span className="text-white font-medium">Level {selectedComponent.level}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Position:</span>
              <span className="text-white font-medium">
                ({selectedComponent.position.x}, {selectedComponent.position.y})
              </span>
            </div>
          </div>
        </div>

        {/* Parameters */}
        {selectedComponent.parameters && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Parameters</h3>
            
            <div className="space-y-3">
              {selectedComponent.parameters.voltage && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-300">Voltage:</span>
                  </div>
                  <span className="text-white font-medium">
                    {selectedComponent.parameters.voltage.toFixed(1)} kV
                  </span>
                </div>
              )}
              
              {selectedComponent.parameters.current && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">Current:</span>
                  </div>
                  <span className="text-white font-medium">
                    {selectedComponent.parameters.current.toFixed(1)} A
                  </span>
                </div>
              )}
              
              {selectedComponent.parameters.activePower && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300">Active Power:</span>
                  </div>
                  <span className="text-white font-medium">
                    {(selectedComponent.parameters.activePower / 1000).toFixed(1)} MW
                  </span>
                </div>
              )}
              
              {selectedComponent.parameters.temperature && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300">Temperature:</span>
                  </div>
                  <span className="text-white font-medium">
                    {selectedComponent.parameters.temperature.toFixed(1)}°C
                  </span>
                </div>
              )}
              
              {selectedComponent.parameters.capacity && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-300">Capacity:</span>
                  </div>
                  <span className="text-white font-medium">
                    {selectedComponent.parameters.capacity.toFixed(1)}%
                  </span>
                </div>
              )}
              
              {selectedComponent.parameters.frequency && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">Frequency:</span>
                  </div>
                  <span className="text-white font-medium">
                    {selectedComponent.parameters.frequency.toFixed(1)} Hz
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Connections */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Connections</h3>
          
          <div className="space-y-2">
            {gridState.connections
              .filter(conn => conn.from === selectedComponent.id || conn.to === selectedComponent.id)
              .map(connection => {
                const isOutgoing = connection.from === selectedComponent.id;
                const connectedComponent = gridState.components.find(
                  c => c.id === (isOutgoing ? connection.to : connection.from)
                );
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-2 bg-slate-600/30 rounded">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          connection.status === 'active' ? 'bg-green-400' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-slate-300 text-sm">
                        {isOutgoing ? '→' : '←'} {connectedComponent?.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 uppercase">
                      {connection.type}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Security Level */}
        <div className="bg-slate-700/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Security Information</h3>
          
          {(() => {
            const level = gridState.levels.find(l => l.level === selectedComponent.level);
            return level ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Risk Level:</span>
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      level.riskLevel === 'critical' ? 'bg-red-500/20 text-red-400' :
                      level.riskLevel === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      level.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {level.riskLevel}
                  </span>
                </div>
                <div className="text-slate-300 text-sm">
                  {level.description}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;

