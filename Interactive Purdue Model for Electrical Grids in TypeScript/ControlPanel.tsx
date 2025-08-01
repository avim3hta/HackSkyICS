import React from 'react';
import { Play, Pause, RotateCcw, Power, Settings } from 'lucide-react';

interface ControlPanelProps {
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onResetToInitialState: () => void;
  onToggleComponentStatus: (componentId: string) => void;
  components: Array<{ id: string; name: string; status: string }>;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  onResetToInitialState,
  onToggleComponentStatus,
  components
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Settings className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-white">Control Panel</h3>
      </div>

      {/* Simulation Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
          Simulation Controls
        </h4>
        
        <div className="flex space-x-2">
          <button
            onClick={isSimulating ? onStopSimulation : onStartSimulation}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
              isSimulating
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
            }`}
          >
            {isSimulating ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Start</span>
              </>
            )}
          </button>
          
          <button
            onClick={onResetToInitialState}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-slate-300">
            Simulation {isSimulating ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Component Controls */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
          Component Controls
        </h4>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {components.map((component) => (
            <div
              key={component.id}
              className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    component.status === 'online'
                      ? 'bg-green-500'
                      : component.status === 'warning'
                      ? 'bg-yellow-500'
                      : component.status === 'error'
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                  }`}
                />
                <span className="text-white text-sm font-medium">
                  {component.name}
                </span>
              </div>
              
              <button
                onClick={() => onToggleComponentStatus(component.id)}
                className={`p-1 rounded transition-all ${
                  component.status === 'online'
                    ? 'text-red-400 hover:bg-red-500/20'
                    : 'text-green-400 hover:bg-green-500/20'
                }`}
                title={component.status === 'online' ? 'Turn Off' : 'Turn On'}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Status Legend */}
      <div className="space-y-3 pt-3 border-t border-slate-700">
        <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
          Status Legend
        </h4>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-slate-300">Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-slate-300">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-slate-300">Error</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-slate-300">Offline</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;

