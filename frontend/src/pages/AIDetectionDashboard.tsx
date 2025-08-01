import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, Activity, Brain, Target, Zap } from 'lucide-react';

interface DetectionResult {
  timestamp: string;
  isAnomaly: boolean;
  anomalyScore: number;
  reconstructionError: number;
  threshold: number;
  confidence: number;
  threatLevel: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sensorData: {
    device_id: string;
    sensor_name: string;
    sensor_value: number;
    nominal_value: number;
    voltage_level: string;
  };
}

interface AttackSimulationData {
  attackType: string;
  targetDevice: string;
  isActive: boolean;
  startTime: string;
  detectedTime?: string;
  detectionLatency?: number;
}

interface AttackWarning {
  id: string;
  timestamp: string;
  attackType: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedDevice: string;
  sensorValue: number;
  nominalValue: number;
  deviation: number;
  recommendations: string[];
}

const AIDetectionDashboard: React.FC = () => {
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentThreatLevel, setCurrentThreatLevel] = useState<string>('NORMAL');
  const [attackSimulation, setAttackSimulation] = useState<AttackSimulationData | null>(null);
  const [attackWarnings, setAttackWarnings] = useState<AttackWarning[]>([]);
  const [modelStats, setModelStats] = useState({
    totalSamples: 0,
    anomaliesDetected: 0,
    averageLatency: 0,
    accuracy: 96.4,
    falsePositiveRate: 5.0
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);

  // WebSocket connection for real-time AI detection
  useEffect(() => {
    if (!isMonitoring) return;

    const connectWebSocket = () => {
      try {
        // Connect to your ML model's WebSocket endpoint (proxied through Vite)
        wsRef.current = new WebSocket('ws://localhost:8080/ws/ai-detection');
        
        wsRef.current.onopen = () => {
          console.log('Connected to AI Detection WebSocket');
        };

        wsRef.current.onmessage = (event) => {
          const detection: DetectionResult = JSON.parse(event.data);
          
          setDetectionResults(prev => [detection, ...prev.slice(0, 99)]); // Keep last 100
          setCurrentThreatLevel(detection.threatLevel);
          
          // Update model stats
          setModelStats(prev => ({
            ...prev,
            totalSamples: prev.totalSamples + 1,
            anomaliesDetected: detection.isAnomaly ? prev.anomaliesDetected + 1 : prev.anomaliesDetected
          }));

          // Generate attack warning if anomaly detected
          if (detection.isAnomaly) {
            const attackWarning = predictAttackType(detection);
            setAttackWarnings(prev => [attackWarning, ...prev.slice(0, 9)]); // Keep last 10 warnings
          }

          // Check if this detection corresponds to an active attack simulation
          if (attackSimulation && attackSimulation.isActive && detection.isAnomaly) {
            const detectionLatency = new Date(detection.timestamp).getTime() - new Date(attackSimulation.startTime).getTime();
            setAttackSimulation(prev => prev ? {
              ...prev,
              detectedTime: detection.timestamp,
              detectionLatency: detectionLatency / 1000 // Convert to seconds
            } : null);
          }
        };

        wsRef.current.onclose = () => {
          console.log('AI Detection WebSocket closed');
          // Attempt to reconnect after 3 seconds
          if (isMonitoring) {
            setTimeout(connectWebSocket, 3000);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        // Fallback to HTTP polling
        startHttpPolling();
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isMonitoring, attackSimulation]);

  // Fallback HTTP polling if WebSocket fails
  const startHttpPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const stats = await response.json();
          setModelStats(prev => ({
            ...prev,
            totalSamples: stats.total_samples_processed,
            anomaliesDetected: stats.anomalies_detected
          }));
        }
      } catch (error) {
        console.error('HTTP polling error:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  // Simulate attack from external VM
  const simulateAttack = async (attackType: string) => {
    try {
      setAttackSimulation({
        attackType,
        targetDevice: 'TRANSMISSION_LINE_345KV_001',
        isActive: true,
        startTime: new Date().toISOString()
      });

      // This endpoint will be called by your VM to inject attack data
      const response = await fetch('/api/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackType,
          targetDevice: 'TRANSMISSION_LINE_345KV_001',
          duration: 30 // seconds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start attack simulation');
      }

      // Stop simulation after 30 seconds
      setTimeout(() => {
        setAttackSimulation(prev => prev ? { ...prev, isActive: false } : null);
      }, 30000);

    } catch (error) {
      console.error('Attack simulation error:', error);
      setAttackSimulation(null);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'NORMAL': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDetectionRate = () => {
    return modelStats.totalSamples > 0 
      ? ((modelStats.anomaliesDetected / modelStats.totalSamples) * 100).toFixed(2)
      : '0.00';
  };

  const predictAttackType = (detection: DetectionResult): AttackWarning => {
    const sensorName = detection.sensorData.sensor_name.toLowerCase();
    const sensorValue = detection.sensorData.sensor_value;
    const nominalValue = detection.sensorData.nominal_value;
    const deviation = Math.abs(sensorValue - nominalValue) / nominalValue * 100;
    
    let attackType = 'Unknown Attack';
    let confidence = detection.confidence;
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let description = '';
    let recommendations: string[] = [];

    // Predict attack type based on sensor data
    if (sensorName.includes('voltage')) {
      if (sensorValue > nominalValue * 1.5) {
        attackType = 'Voltage Surge Attack';
        description = 'Detected abnormal voltage spike that could damage equipment';
        recommendations = [
          'Immediately isolate affected circuit',
          'Check surge protection devices',
          'Monitor other voltage sensors',
          'Prepare for potential equipment shutdown'
        ];
      } else if (sensorValue < nominalValue * 0.6) {
        attackType = 'Voltage Sag Attack';
        description = 'Detected significant voltage drop indicating potential grid instability';
        recommendations = [
          'Activate backup power systems',
          'Check for load balancing issues',
          'Monitor frequency stability',
          'Prepare for brownout conditions'
        ];
      }
    } else if (sensorName.includes('power')) {
      if (sensorValue > nominalValue * 2) {
        attackType = 'Power Overload Attack';
        description = 'Detected excessive power consumption that could cause system failure';
        recommendations = [
          'Immediately reduce load',
          'Activate circuit breakers',
          'Check for unauthorized connections',
          'Prepare emergency shutdown procedures'
        ];
      }
    } else if (sensorName.includes('frequency')) {
      if (sensorValue < 58 || sensorValue > 62) {
        attackType = 'Frequency Manipulation Attack';
        description = 'Detected frequency deviation that could destabilize the grid';
        recommendations = [
          'Activate frequency regulation systems',
          'Check generator synchronization',
          'Monitor grid stability',
          'Prepare for potential blackout'
        ];
      }
    } else if (sensorName.includes('current')) {
      if (sensorValue > nominalValue * 1.8) {
        attackType = 'Current Overload Attack';
        description = 'Detected excessive current flow that could damage transformers';
        recommendations = [
          'Activate current limiting devices',
          'Check transformer temperatures',
          'Monitor for thermal damage',
          'Prepare for equipment protection'
        ];
      }
    }

    // Determine severity based on deviation and confidence
    if (deviation > 100 || confidence > 0.9) {
      severity = 'CRITICAL';
    } else if (deviation > 50 || confidence > 0.7) {
      severity = 'HIGH';
    } else if (deviation > 25 || confidence > 0.5) {
      severity = 'MEDIUM';
    } else {
      severity = 'LOW';
    }

    return {
      id: Date.now().toString(),
      timestamp: detection.timestamp,
      attackType,
      confidence: confidence * 100,
      severity,
      description,
      affectedDevice: detection.sensorData.device_id,
      sensorValue,
      nominalValue,
      deviation,
      recommendations
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-3">
              <Brain className="h-8 w-8" />
              AI Anomaly Detection Dashboard
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
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/electrical-grid'}>
              ⚡ Grid View
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 max-w-7xl">
        {/* Model Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Model Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {modelStats.accuracy}%
              </div>
              <p className="text-xs text-gray-500">Overall Performance</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Samples Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {modelStats.totalSamples.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500">Total Analyzed</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Anomalies Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {modelStats.anomaliesDetected}
              </div>
              <p className="text-xs text-gray-500">{getDetectionRate()}% Detection Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">False Positive Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">
                {modelStats.falsePositiveRate}%
              </div>
              <p className="text-xs text-gray-500">Low False Alarms</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">ROC-AUC Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                98.7%
              </div>
              <p className="text-xs text-gray-500">Excellent Performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real-time Detection Feed */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Detection Feed
                  {isMonitoring && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {detectionResults.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      {isMonitoring ? 'Waiting for detection data...' : 'Start monitoring to see real-time detections'}
                    </div>
                  )}
                  
                  {detectionResults.map((detection, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        detection.isAnomaly 
                          ? 'bg-red-900/30 border-red-500/50 hover:bg-red-900/40' 
                          : 'bg-green-900/30 border-green-500/50 hover:bg-green-900/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">
                              {detection.isAnomaly ? '🚨' : '✅'}
                            </span>
                            <span className="font-semibold">
                              {detection.isAnomaly ? 'ANOMALY DETECTED' : 'Normal Operation'}
                            </span>
                            <Badge className={getThreatLevelColor(detection.threatLevel)}>
                              {detection.threatLevel}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-300 space-y-1">
                            <div>Device: {detection.sensorData.device_id}</div>
                            <div>Sensor: {detection.sensorData.sensor_name}</div>
                            <div>Value: {detection.sensorData.sensor_value.toFixed(2)} {detection.sensorData.voltage_level}</div>
                            {detection.isAnomaly && (
                              <>
                                <div>Anomaly Score: {detection.anomalyScore.toFixed(3)}</div>
                                <div>Reconstruction Error: {detection.reconstructionError.toFixed(6)}</div>
                                <div>Confidence: {(detection.confidence * 100).toFixed(1)}%</div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel & Attack Simulation */}
          <div className="space-y-6">
            {/* System Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold">Normal Operations</span>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div>🔋 Power Generation: Normal</div>
                    <div>⚡ Transmission: Stable</div>
                    <div>🌐 Distribution: Operational</div>
                    <div>🛡️ AI Detection: Active</div>
                  </div>
                  
                  <div className="mt-4 p-2 bg-blue-900/30 rounded text-xs">
                    <div className="font-semibold text-blue-400">Demo Ready</div>
                    <div>System monitoring electrical grid for anomalies</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Model Information */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Model Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-400">Architecture</div>
                  <div className="text-white">Reconstruction Autoencoder</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Training Data</div>
                  <div className="text-white">1M Normal Samples (0% Attacks)</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Detection Method</div>
                  <div className="text-white">Reconstruction Error Threshold</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Threshold</div>
                  <div className="text-white">0.004187</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400">Zero-Day Capable</div>
                  <div className="text-green-400">✅ Yes - 96% Detection Rate</div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">ML Model API</span>
                  <Badge variant={isMonitoring ? "default" : "secondary"}>
                    {isMonitoring ? '🟢 Connected' : '⚪ Disconnected'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">WebSocket Stream</span>
                  <Badge variant={wsRef.current?.readyState === WebSocket.OPEN ? "default" : "secondary"}>
                    {wsRef.current?.readyState === WebSocket.OPEN ? '🟢 Active' : '⚪ Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Attack VM</span>
                  <Badge variant="secondary">
                    🔵 Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attack Warning Notifications */}
        {attackWarnings.length > 0 && (
          <div className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Attack Warning Notifications
                  <Badge className="bg-red-500 text-white ml-2">
                    {attackWarnings.length} Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {attackWarnings.map((warning) => (
                    <div
                      key={warning.id}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        warning.severity === 'CRITICAL' ? 'bg-red-900/30 border-red-500 animate-pulse' :
                        warning.severity === 'HIGH' ? 'bg-orange-900/30 border-orange-500' :
                        warning.severity === 'MEDIUM' ? 'bg-yellow-900/30 border-yellow-500' :
                        'bg-blue-900/30 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {warning.severity === 'CRITICAL' ? '🚨' :
                             warning.severity === 'HIGH' ? '⚠️' :
                             warning.severity === 'MEDIUM' ? '⚡' : '🔍'}
                          </span>
                          <div>
                            <div className="font-bold text-lg">{warning.attackType}</div>
                            <div className="text-sm text-gray-300">{warning.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${
                            warning.severity === 'CRITICAL' ? 'bg-red-500' :
                            warning.severity === 'HIGH' ? 'bg-orange-500' :
                            warning.severity === 'MEDIUM' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          } text-white`}>
                            {warning.severity}
                          </Badge>
                          <div className="text-sm text-gray-400 mt-1">
                            {warning.confidence.toFixed(1)}% Confidence
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium text-gray-400">Affected Device</div>
                          <div className="text-white">{warning.affectedDevice}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-400">Deviation</div>
                          <div className="text-white">{warning.deviation.toFixed(1)}% from normal</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-400">Current Value</div>
                          <div className="text-white">{warning.sensorValue.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-400">Normal Range</div>
                          <div className="text-white">~{warning.nominalValue.toFixed(2)}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-400 mb-2">Recommended Actions:</div>
                        <div className="space-y-1">
                          {warning.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span className="text-gray-300">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-3">
                        Detected at {new Date(warning.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDetectionDashboard;