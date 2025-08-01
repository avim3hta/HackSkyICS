import React from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Zap, Thermometer } from 'lucide-react';

interface SystemHealthProps {
  health: {
    total: number;
    online: number;
    warning: number;
    error: number;
    offline: number;
    healthPercentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  averageTemperature: number;
  totalPowerGeneration: number;
  gridLoad: number;
}

const SystemHealthDashboard: React.FC<SystemHealthProps> = ({
  health,
  averageTemperature,
  totalPowerGeneration,
  gridLoad
}) => {
  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getHealthBarColor = () => {
    if (health.healthPercentage >= 90) return 'bg-green-500';
    if (health.healthPercentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-4">
      {/* System Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-white">System Health</h3>
        </div>
        <span className={`text-sm font-medium uppercase ${getStatusColor()}`}>
          {health.status}
        </span>
      </div>

      {/* Health Percentage Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Overall Health</span>
          <span className="text-white font-medium">{health.healthPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getHealthBarColor()}`}
            style={{ width: `${health.healthPercentage}%` }}
          />
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-green-400 text-sm">Online</span>
            <span className="text-white font-bold text-lg">{health.online}</span>
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-400 text-sm">Warning</span>
            <span className="text-white font-bold text-lg">{health.warning}</span>
          </div>
        </div>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-red-400 text-sm">Error</span>
            <span className="text-white font-bold text-lg">{health.error}</span>
          </div>
        </div>
        
        <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Offline</span>
            <span className="text-white font-bold text-lg">{health.offline}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3 pt-2 border-t border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
          Key Metrics
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm">Total Generation</span>
            </div>
            <span className="text-white font-medium">
              {(totalPowerGeneration / 1000).toFixed(1)} GW
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 text-sm">Grid Load</span>
            </div>
            <span className="text-white font-medium">
              {gridLoad.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-red-400" />
              <span className="text-slate-300 text-sm">Avg Temperature</span>
            </div>
            <span className="text-white font-medium">
              {averageTemperature.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>

      {/* Load Distribution Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-300">Load Distribution</span>
          <span className="text-white font-medium">{gridLoad.toFixed(1)}% Capacity</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              gridLoad >= 90 ? 'bg-red-500' : 
              gridLoad >= 75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(100, gridLoad)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;

