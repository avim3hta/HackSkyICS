import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Activity, Zap, Thermometer, Gauge } from 'lucide-react';
import OriginalPurdueModel from '@/components/OriginalPurdueModel';

// Types for electrical grid components
interface GridComponent {
  id: string;
  name: string;
  type: 'transmission_line' | 'transformer' | 'generator' | 'distribution_feeder' | 'load';
  status: 'online' | 'offline' | 'warning' | 'error' | 'anomaly';
  voltage?: number;
  current?: number;
  power?: number;
  temperature?: number;
  frequency?: number;
  position: { x: number; y: number };
  purdueLevel: 0 | 1 | 2 | 3 | 4 | 5;
}

interface AIDetectionData {
  timestamp: string;
  isAnomaly: boolean;
  anomalyScore: number;
  threatLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reconstructionError: number;
  affectedComponents: string[];
}

const ElectricalGridDashboard: React.FC = () => {
  const [gridComponents, setGridComponents] = useState<GridComponent[]>([
    // Level 0: Physical Process
    {
      id: 'STEAM_BOILER_001',
      name: 'Steam Boiler Unit 1',
      type: 'boiler',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 500000,
      temperature: 850,
      frequency: 0,
      position: { x: 50, y: 50 },
      purdueLevel: 0
    },
    {
      id: 'STEAM_TURBINE_001',
      name: 'Steam Turbine 1',
      type: 'turbine',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 450000,
      temperature: 520,
      frequency: 3600,
      position: { x: 150, y: 50 },
      purdueLevel: 0
    },
    {
      id: 'GENERATOR_UNIT_001',
      name: 'Generator Unit 1',
      type: 'generator',
      status: 'online',
      voltage: 22000,
      current: 900,
      power: 400000,
      temperature: 65,
      frequency: 60.0,
      position: { x: 250, y: 50 },
      purdueLevel: 0
    },
    {
      id: 'GENERATOR_UNIT_002',
      name: 'Generator Unit 2',
      type: 'generator',
      status: 'online',
      voltage: 22000,
      current: 850,
      power: 380000,
      temperature: 68,
      frequency: 60.0,
      position: { x: 350, y: 50 },
      purdueLevel: 0
    },
    
    // Level 1: Basic Control
    {
      id: 'MAIN_TRANSFORMER_001',
      name: 'Main Step-Up Transformer',
      type: 'transformer',
      status: 'online',
      voltage: 138000,
      current: 1200,
      power: 300000,
      temperature: 55,
      frequency: 60.0,
      position: { x: 100, y: 150 },
      purdueLevel: 1
    },
    {
      id: 'TRANSMISSION_LINE_345KV_001',
      name: 'Main Transmission Line',
      type: 'transmission_line',
      status: 'online',
      voltage: 345000,
      current: 800,
      power: 276000,
      temperature: 45,
      frequency: 60.0,
      position: { x: 200, y: 150 },
      purdueLevel: 1
    },
    {
      id: 'MAIN_SWITCHGEAR_001',
      name: 'Main Switchgear',
      type: 'switchgear',
      status: 'online',
      voltage: 345000,
      current: 850,
      power: 320000,
      temperature: 40,
      frequency: 60.0,
      position: { x: 300, y: 150 },
      purdueLevel: 1
    },
    
    // Level 2: Supervisory Control
    {
      id: 'DISTRIBUTION_FEEDER_22KV_001',
      name: 'Distribution Feeder 1',
      type: 'distribution_feeder',
      status: 'online',
      voltage: 22000,
      current: 600,
      power: 150000,
      temperature: 35,
      frequency: 60.0,
      position: { x: 150, y: 250 },
      purdueLevel: 2
    },
    {
      id: 'SCADA_SYSTEM_001',
      name: 'SCADA Control System',
      type: 'scada',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 25,
      frequency: 0,
      position: { x: 250, y: 250 },
      purdueLevel: 2
    },
    {
      id: 'HMI_STATION_001',
      name: 'HMI Control Station',
      type: 'hmi',
      status: 'warning',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 30,
      frequency: 0,
      position: { x: 350, y: 250 },
      purdueLevel: 2
    },
    
    // Level 3: Operations Management
    {
      id: 'EMS_SYSTEM_001',
      name: 'Energy Management System',
      type: 'ems',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 22,
      frequency: 0,
      position: { x: 200, y: 350 },
      purdueLevel: 3
    },
    {
      id: 'DATA_HISTORIAN_001',
      name: 'Data Historian',
      type: 'historian',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 24,
      frequency: 0,
      position: { x: 300, y: 350 },
      purdueLevel: 3
    },
    {
      id: 'OMS_SYSTEM_001',
      name: 'Outage Management System',
      type: 'oms',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 26,
      frequency: 0,
      position: { x: 400, y: 350 },
      purdueLevel: 3
    },
    
    // Level 4: Business Planning
    {
      id: 'ERP_SYSTEM_001',
      name: 'Enterprise Resource Planning',
      type: 'erp',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 20,
      frequency: 0,
      position: { x: 150, y: 450 },
      purdueLevel: 4
    },
    {
      id: 'BILLING_SYSTEM_001',
      name: 'Customer Billing System',
      type: 'billing',
      status: 'online',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 21,
      frequency: 0,
      position: { x: 250, y: 450 },
      purdueLevel: 4
    },
    {
      id: 'CRM_SYSTEM_001',
      name: 'Customer Relations Management',
      type: 'crm',
      status: 'warning',
      voltage: 0,
      current: 0,
      power: 0,
      temperature: 23,
      frequency: 0,
      position: { x: 350, y: 450 },
      purdueLevel: 4
    }
  ]);

  const [aiDetectionData, setAIDetectionData] = useState<AIDetectionData[]>([]);
  const [currentThreatLevel, setCurrentThreatLevel] = useState<string>('NORMAL');
  const [isAIDetectionActive, setIsAIDetectionActive] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<GridComponent | null>(null);
  const [modelStats, setModelStats] = useState({
    totalSamples: 0,
    anomaliesDetected: 0,
    accuracy: 96.4,
    falsePositiveRate: 5.0,
    rocAuc: 98.7
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setGridComponents(prev => prev.map(component => ({
        ...component,
        voltage: component.voltage! + (Math.random() - 0.5) * component.voltage! * 0.02,
        current: component.current! + (Math.random() - 0.5) * component.current! * 0.1,
        power: component.power! + (Math.random() - 0.5) * component.power! * 0.05,
        temperature: component.temperature! + (Math.random() - 0.5) * 5,
        frequency: 60.0 + (Math.random() - 0.5) * 0.1
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // AI Detection polling
  useEffect(() => {
    if (!isAIDetectionActive) return;

    const pollAIDetection = async () => {
      try {
        // Fetch ML model statistics
        const statsResponse = await fetch('/api/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setModelStats({
            totalSamples: statsData.total_samples_processed || 0,
            anomaliesDetected: statsData.anomalies_detected || 0,
            accuracy: statsData.accuracy || 96.4,
            falsePositiveRate: statsData.false_positive_rate || 5.0,
            rocAuc: statsData.roc_auc || 98.7
          });
        }
        
                 // Update component statuses based on ML detection results
         if (modelStats.anomaliesDetected > 0) {
           // Update threat level based on anomalies detected
           const threatLevel = modelStats.anomaliesDetected > 10 ? 'CRITICAL' :
                              modelStats.anomaliesDetected > 5 ? 'HIGH' :
                              modelStats.anomaliesDetected > 2 ? 'MEDIUM' : 'LOW';
           setCurrentThreatLevel(threatLevel);
           
           // Simulate component status changes based on ML detection
           setGridComponents(prev => prev.map(comp => {
             // Randomly assign anomaly status to some components when threats are detected
             if (comp.purdueLevel <= 2 && Math.random() < 0.3) { // Only affect levels 0-2
               return { ...comp, status: 'anomaly' };
             }
             return comp;
           }));
         } else {
           // Reset to normal when no threats detected
           setCurrentThreatLevel('NORMAL');
           setGridComponents(prev => prev.map(comp => ({
             ...comp,
             status: comp.status === 'anomaly' ? 'online' : comp.status
           })));
         }
      } catch (error) {
        console.error('AI Detection polling error:', error);
      }
    };

    const interval = setInterval(pollAIDetection, 2000);
    return () => clearInterval(interval);
  }, [isAIDetectionActive]);

  const systemMetrics = useMemo(() => {
    // Calculate system health based on ML detection stats
    const totalComponents = gridComponents.length;
    const anomalyComponents = gridComponents.filter(c => c.status === 'anomaly').length;
    const warningComponents = gridComponents.filter(c => c.status === 'warning').length;
    const errorComponents = gridComponents.filter(c => c.status === 'error').length;
    
    // System health based on ML detection: 100% if no anomalies, decreases with threats
    const systemHealth = Math.max(0, 100 - (anomalyComponents * 20) - (warningComponents * 10) - (errorComponents * 15));
    
    // Real-time metrics from ML model
    const detectionRate = modelStats.totalSamples > 0 
      ? ((modelStats.anomaliesDetected / modelStats.totalSamples) * 100)
      : 0;
    
    const threatLevel = currentThreatLevel === 'CRITICAL' ? 'HIGH' : 
                       currentThreatLevel === 'HIGH' ? 'MEDIUM' : 
                       currentThreatLevel === 'MEDIUM' ? 'LOW' : 'NORMAL';

    return {
      systemHealth,
      totalComponents,
      anomalyComponents,
      warningComponents,
      errorComponents,
      detectionRate,
      threatLevel,
      modelAccuracy: modelStats.accuracy,
      anomaliesDetected: modelStats.anomaliesDetected
    };
  }, [gridComponents, modelStats, currentThreatLevel]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'anomaly': return 'bg-purple-500 animate-pulse';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800 animate-pulse';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDetectionRate = () => {
    return modelStats.totalSamples > 0 
      ? ((modelStats.anomaliesDetected / modelStats.totalSamples) * 100).toFixed(1)
      : '0.0';
  };

  const PurdueLevel = ({ level, title, children }: { level: number; title?: string; children: React.ReactNode }) => (
    <div className={`mb-4 p-4 rounded-lg border-2 border-dashed ${
      level === 0 ? 'border-red-500 bg-red-500/10' :
      level === 1 ? 'border-orange-500 bg-orange-500/10' :
      level === 2 ? 'border-yellow-500 bg-yellow-500/10' :
      level === 3 ? 'border-green-500 bg-green-500/10' :
      'border-blue-500 bg-blue-500/10'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">
          {title || `Level ${level}: ${
            level === 0 ? 'Physical Process' :
            level === 1 ? 'Basic Control' :
            level === 2 ? 'Supervisory Control' :
            level === 3 ? 'Operations Management' :
            'Business Planning'
          }`}
        </h3>
        <Badge variant="outline" className="text-xs">
          Purdue Level {level}
        </Badge>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
              <Zap className="h-8 w-8" />
              Electrical Grid - AI Detection System
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={getThreatLevelColor(currentThreatLevel)}>
              {currentThreatLevel === 'NORMAL' ? '🟢' : 
               currentThreatLevel === 'LOW' ? '🔵' :
               currentThreatLevel === 'MEDIUM' ? '🟡' :
               currentThreatLevel === 'HIGH' ? '🟠' : '🔴'} 
              THREAT: {currentThreatLevel}
            </Badge>
            <Button
              onClick={() => setIsAIDetectionActive(!isAIDetectionActive)}
              variant={isAIDetectionActive ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {isAIDetectionActive ? 'Stop AI Detection' : 'Start AI Detection'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              ← Back to Main
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* System Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                systemMetrics.systemHealth >= 80 ? 'text-green-400' :
                systemMetrics.systemHealth >= 60 ? 'text-yellow-400' :
                systemMetrics.systemHealth >= 40 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {systemMetrics.systemHealth.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                {systemMetrics.anomalyComponents} Anomalies • {systemMetrics.warningComponents} Warnings
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Threat Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                systemMetrics.threatLevel === 'NORMAL' ? 'text-green-400' :
                systemMetrics.threatLevel === 'LOW' ? 'text-blue-400' :
                systemMetrics.threatLevel === 'MEDIUM' ? 'text-yellow-400' :
                systemMetrics.threatLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {systemMetrics.threatLevel}
              </div>
              <p className="text-xs text-gray-500">Current Security Status</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Detection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {systemMetrics.detectionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">
                {systemMetrics.anomaliesDetected} Threats Detected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {systemMetrics.modelAccuracy}%
              </div>
              <p className="text-xs text-gray-500">
                {modelStats.totalSamples.toLocaleString()} Samples Analyzed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Purdue Model Diagram - 5 Levels */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Electrical Grid - AI Detection System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg p-4" style={{ minHeight: '600px' }}>
                  {/* Purdue Level 0: Physical Process */}
                  <PurdueLevel level={0} title="Level 0: Physical Process">
                    <div className="grid grid-cols-4 gap-3">
                      {gridComponents.filter(c => c.purdueLevel === 0).map(component => (
                        <div
                          key={component.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${getStatusColor(component.status)} bg-opacity-20 border-opacity-50`}
                          onClick={() => setSelectedComponent(component)}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {component.type === 'generator' ? '⚙️' :
                               component.type === 'turbine' ? '🌪️' :
                               component.type === 'boiler' ? '🔥' : '⚡'}
                            </div>
                            <div className="text-xs font-semibold">{component.name}</div>
                            <div className="text-xs mt-1">
                              {component.voltage && `${(component.voltage/1000).toFixed(1)}kV`}
                            </div>
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PurdueLevel>

                  {/* Purdue Level 1: Basic Control */}
                  <PurdueLevel level={1} title="Level 1: Basic Control">
                    <div className="grid grid-cols-3 gap-4">
                      {gridComponents.filter(c => c.purdueLevel === 1).map(component => (
                        <div
                          key={component.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${getStatusColor(component.status)} bg-opacity-20 border-opacity-50`}
                          onClick={() => setSelectedComponent(component)}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {component.type === 'transmission_line' ? '⚡' :
                               component.type === 'transformer' ? '🔌' :
                               component.type === 'switchgear' ? '🔀' : '🔋'}
                            </div>
                            <div className="text-xs font-semibold">{component.name}</div>
                            <div className="text-xs mt-1">
                              {component.voltage && `${(component.voltage/1000).toFixed(1)}kV`}
                            </div>
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PurdueLevel>

                  {/* Purdue Level 2: Supervisory Control */}
                  <PurdueLevel level={2} title="Level 2: Supervisory Control">
                    <div className="grid grid-cols-2 gap-4">
                      {gridComponents.filter(c => c.purdueLevel === 2).map(component => (
                        <div
                          key={component.id}
                          className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${getStatusColor(component.status)} bg-opacity-20 border-opacity-50`}
                          onClick={() => setSelectedComponent(component)}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {component.type === 'distribution_feeder' ? '🌐' :
                               component.type === 'scada' ? '🖥️' :
                               component.type === 'hmi' ? '📊' : '🔌'}
                            </div>
                            <div className="text-xs font-semibold">{component.name}</div>
                            <div className="text-xs mt-1">
                              {component.voltage && `${(component.voltage/1000).toFixed(1)}kV`}
                            </div>
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PurdueLevel>

                                     {/* Purdue Level 3: Operations Management */}
                   <PurdueLevel level={3} title="Level 3: Operations Management">
                     <div className="grid grid-cols-2 gap-4">
                       {gridComponents.filter(c => c.purdueLevel === 3).map(component => (
                         <div
                           key={component.id}
                           className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${getStatusColor(component.status)} bg-opacity-20 border-opacity-50`}
                         >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {component.type === 'ems' ? '🏢' :
                               component.type === 'historian' ? '📚' :
                               component.type === 'oms' ? '⚙️' : '💼'}
                            </div>
                            <div className="text-xs font-semibold">{component.name}</div>
                            <div className="text-xs mt-1">Operations</div>
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PurdueLevel>

                                     {/* Purdue Level 4: Business Planning */}
                   <PurdueLevel level={4} title="Level 4: Business Planning">
                     <div className="grid grid-cols-2 gap-4">
                       {gridComponents.filter(c => c.purdueLevel === 4).map(component => (
                         <div
                           key={component.id}
                           className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${getStatusColor(component.status)} bg-opacity-20 border-opacity-50`}
                         >
                          <div className="text-center">
                            <div className="text-2xl mb-2">
                              {component.type === 'erp' ? '🏛️' :
                               component.type === 'billing' ? '💳' :
                               component.type === 'crm' ? '👥' : '📈'}
                            </div>
                            <div className="text-xs font-semibold">{component.name}</div>
                            <div className="text-xs mt-1">Business</div>
                            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(component.status)}`}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PurdueLevel>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component Details & AI Detection */}
          <div className="space-y-6">
                         {/* Selected Component Details - Only for Levels 0-2 */}
             {selectedComponent && selectedComponent.purdueLevel <= 2 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Component Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-400">Name</div>
                    <div className="text-white">{selectedComponent.name}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-400">Status</div>
                    <Badge className={selectedComponent.status === 'online' ? 'bg-green-500' : 
                                    selectedComponent.status === 'anomaly' ? 'bg-purple-500' : 'bg-red-500'}>
                      {selectedComponent.status.toUpperCase()}
                    </Badge>
                  </div>
                  {selectedComponent.voltage && (
                    <div>
                      <div className="text-sm font-medium text-gray-400">Voltage</div>
                      <div className="text-white">{selectedComponent.voltage.toFixed(0)} V</div>
                    </div>
                  )}
                  {selectedComponent.current && (
                    <div>
                      <div className="text-sm font-medium text-gray-400">Current</div>
                      <div className="text-white">{selectedComponent.current.toFixed(1)} A</div>
                    </div>
                  )}
                  {selectedComponent.power && (
                    <div>
                      <div className="text-sm font-medium text-gray-400">Power</div>
                      <div className="text-white">{(selectedComponent.power/1000).toFixed(1)} kW</div>
                    </div>
                  )}
                  {selectedComponent.temperature && (
                    <div>
                      <div className="text-sm font-medium text-gray-400">Temperature</div>
                      <div className="text-white">{selectedComponent.temperature.toFixed(1)}°C</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Detection Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  AI Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <Badge variant={isAIDetectionActive ? "default" : "secondary"}>
                      {isAIDetectionActive ? '🟢 ACTIVE' : '⚪ INACTIVE'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Threat Level</span>
                    <Badge className={getThreatLevelColor(currentThreatLevel)}>
                      {currentThreatLevel}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Detections</span>
                    <span className="text-white">{aiDetectionData.length}</span>
                  </div>

                  {aiDetectionData.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-400 mb-2">Recent Detections</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {aiDetectionData.slice(0, 5).map((detection, index) => (
                          <div key={index} className={`p-2 rounded text-xs ${detection.isAnomaly ? 'bg-red-900/30 border border-red-500/30' : 'bg-green-900/30 border border-green-500/30'}`}>
                            <div className="flex justify-between items-center">
                              <span>{detection.isAnomaly ? '🚨 Anomaly' : '✅ Normal'}</span>
                              <span className="text-gray-400">
                                {new Date(detection.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {detection.isAnomaly && (
                              <div className="mt-1 text-gray-300">
                                Score: {detection.anomalyScore.toFixed(3)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        .purdue-level-0 { border-color: #ef4444; background-color: rgba(239, 68, 68, 0.1); }
        .purdue-level-1 { border-color: #f97316; background-color: rgba(249, 115, 22, 0.1); }
        .purdue-level-2 { border-color: #eab308; background-color: rgba(234, 179, 8, 0.1); }
        .purdue-level-3 { border-color: #22c55e; background-color: rgba(34, 197, 94, 0.1); }
        .purdue-level-4 { border-color: #3b82f6; background-color: rgba(59, 130, 246, 0.1); }
        .purdue-level-5 { border-color: #8b5cf6; background-color: rgba(139, 92, 246, 0.1); }
      `}</style>
    </div>
  );
};

export default ElectricalGridDashboard;