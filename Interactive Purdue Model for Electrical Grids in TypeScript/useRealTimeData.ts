import { useState, useEffect, useCallback } from 'react';
import { GridState, GridComponent } from '../types';

interface UseRealTimeDataProps {
  initialState: GridState;
  updateInterval?: number;
}

export const useRealTimeData = ({ 
  initialState, 
  updateInterval = 2000 
}: UseRealTimeDataProps) => {
  const [gridState, setGridState] = useState<GridState>(initialState);
  const [isSimulating, setIsSimulating] = useState(true);

  // Simulate realistic parameter variations
  const simulateParameterChanges = useCallback((component: GridComponent): GridComponent => {
    if (!component.parameters) return component;

    const newParameters = { ...component.parameters };

    // Simulate temperature variations based on component type and load
    if (newParameters.temperature !== undefined) {
      const baseTemp = component.type === 'generator' ? 75 : 
                      component.type === 'transformer' ? 65 : 45;
      const variation = (Math.random() - 0.5) * 4; // ±2°C variation
      newParameters.temperature = Math.max(20, Math.min(120, baseTemp + variation));
    }

    // Simulate power variations for generators
    if (newParameters.activePower !== undefined && component.type === 'generator') {
      const basePower = component.id === 'generator-1' ? 850000 : 920000;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      newParameters.activePower = basePower * (1 + variation);
    }

    // Simulate capacity variations for load
    if (newParameters.capacity !== undefined && component.type === 'load') {
      const baseCapacity = 85;
      const variation = (Math.random() - 0.5) * 6; // ±3% variation
      newParameters.capacity = Math.max(75, Math.min(95, baseCapacity + variation));
    }

    // Simulate voltage fluctuations
    if (newParameters.voltage !== undefined) {
      const baseVoltage = component.id.includes('transformer-b') || component.id.includes('substation-2') ? 345 : 138;
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      newParameters.voltage = baseVoltage * (1 + variation);
    }

    // Simulate frequency stability
    if (newParameters.frequency !== undefined) {
      const baseFrequency = 60;
      const variation = (Math.random() - 0.5) * 0.2; // ±0.1 Hz variation
      newParameters.frequency = baseFrequency + variation;
    }

    return {
      ...component,
      parameters: newParameters
    };
  }, []);

  // Simulate component status changes (rare events)
  const simulateStatusChanges = useCallback((component: GridComponent): GridComponent => {
    // 99.5% chance to stay online, 0.5% chance for status change
    if (Math.random() < 0.005) {
      const statuses = ['online', 'warning', 'error'];
      const currentIndex = statuses.indexOf(component.status);
      const newStatus = statuses[(currentIndex + 1) % statuses.length];
      
      return {
        ...component,
        status: newStatus as any
      };
    }
    
    return component;
  }, []);

  // Update grid state with simulated data
  const updateGridState = useCallback(() => {
    if (!isSimulating) return;

    setGridState(prevState => ({
      ...prevState,
      lastUpdated: new Date(),
      components: prevState.components.map(component => {
        let updatedComponent = simulateParameterChanges(component);
        updatedComponent = simulateStatusChanges(updatedComponent);
        return updatedComponent;
      }),
      connections: prevState.connections.map(connection => ({
        ...connection,
        // Update flow rates based on component status
        flowRate: prevState.components.find(c => c.id === connection.from)?.status === 'online' &&
                 prevState.components.find(c => c.id === connection.to)?.status === 'online'
                 ? Math.max(70, Math.min(100, (connection.flowRate || 85) + (Math.random() - 0.5) * 4))
                 : 0
      }))
    }));
  }, [isSimulating, simulateParameterChanges, simulateStatusChanges]);

  // Set up real-time updates
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(updateGridState, updateInterval);
    return () => clearInterval(interval);
  }, [updateGridState, updateInterval, isSimulating]);

  // Control functions
  const startSimulation = useCallback(() => setIsSimulating(true), []);
  const stopSimulation = useCallback(() => setIsSimulating(false), []);
  const resetToInitialState = useCallback(() => {
    setGridState({
      ...initialState,
      lastUpdated: new Date()
    });
  }, [initialState]);

  // Manual component status toggle
  const toggleComponentStatus = useCallback((componentId: string) => {
    setGridState(prevState => ({
      ...prevState,
      components: prevState.components.map(component => 
        component.id === componentId
          ? {
              ...component,
              status: component.status === 'online' ? 'offline' : 'online'
            }
          : component
      )
    }));
  }, []);

  // Get system health metrics
  const getSystemHealth = useCallback(() => {
    const totalComponents = gridState.components.length;
    const onlineComponents = gridState.components.filter(c => c.status === 'online').length;
    const warningComponents = gridState.components.filter(c => c.status === 'warning').length;
    const errorComponents = gridState.components.filter(c => c.status === 'error').length;
    const offlineComponents = gridState.components.filter(c => c.status === 'offline').length;

    const healthPercentage = (onlineComponents / totalComponents) * 100;
    
    return {
      total: totalComponents,
      online: onlineComponents,
      warning: warningComponents,
      error: errorComponents,
      offline: offlineComponents,
      healthPercentage,
      status: healthPercentage >= 90 ? 'healthy' : 
              healthPercentage >= 70 ? 'warning' : 'critical'
    };
  }, [gridState.components]);

  return {
    gridState,
    isSimulating,
    startSimulation,
    stopSimulation,
    resetToInitialState,
    toggleComponentStatus,
    getSystemHealth
  };
};

