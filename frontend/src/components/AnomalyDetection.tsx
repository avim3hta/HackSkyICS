import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { AlertTriangle, Activity, Zap, Shield, Play, Pause, Settings } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import io from 'socket.io-client';

interface SensorData {
  timestamp: string;
  facility_type: string;
  device_id: string;
  sensor_name: string;
  sensor_value: number;
  device_type: string;
  criticality: string;
  is_anomaly: number;
  anomaly_type?: string;
}

interface AnomalyPrediction {
  timestamp: string;
  sensor_data: SensorData;
  anomaly_score: number;
  is_anomaly: boolean;
  confidence: number;
  model_used: string;
  facility_type: string;
  device_id: string;
}

interface AnomalyAlert {
  id: string;
  timestamp: string;
  facility: string;
  device: string;
  sensor: string;
  value: number;
  anomaly_score: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ModelStats {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_predictions: number;
  detected_anomalies: number;
  current_anomaly_rate: string;
  model_status: string;
  last_prediction?: string;
}

interface StreamingStats {
  is_streaming: boolean;
  total_data_points: number;
  current_index: number;
  stream_speed: number;
  anomaly_detection_enabled: boolean;
  progress_percentage: string;
}

const AnomalyDetection: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [streamingStats, setStreamingStats] = useState<StreamingStats | null>(null);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  const [anomalyDetectionEnabled, setAnomalyDetectionEnabled] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const socketRef = useRef<any>(null);
  const maxDataPoints = 50;

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to ML streaming server');
      
      // Join ML streaming rooms
      socketRef.current.emit('join-ml-stream');
      socketRef.current.emit('join-anomaly-alerts');
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from ML streaming server');
    });

    // Listen for sensor data with anomaly predictions
    socketRef.current.on('sensor-data', (data: { sensor_data: SensorData; anomaly_prediction: AnomalyPrediction; stream_index: number }) => {
      const { sensor_data, anomaly_prediction } = data;
      
      // Update sensor data history
      setSensorData(prev => {
        const newData = [...prev, sensor_data].slice(-maxDataPoints);
        return newData;
      });

      // Update realtime chart data
      setRealtimeData(prev => {
        const newPoint = {
          timestamp: new Date(sensor_data.timestamp).toLocaleTimeString(),
          value: sensor_data.sensor_value,
          anomaly_score: anomaly_prediction.anomaly_score,
          is_anomaly: anomaly_prediction.is_anomaly,
          facility: sensor_data.facility_type,
          sensor: sensor_data.sensor_name
        };
        return [...prev, newPoint].slice(-maxDataPoints);
      });
    });

    // Listen for anomaly alerts
    socketRef.current.on('anomaly-detected', (data: { alert: AnomalyAlert }) => {
      setAnomalyAlerts(prev => [data.alert, ...prev].slice(0, 20));
    });

    // Listen for streaming status updates
    socketRef.current.on('stream-status', (status: StreamingStats) => {
      setStreamingStats(status);
      setIsStreaming(status.is_streaming);
    });

    // Fetch initial model stats
    fetchModelStats();
    fetchStreamingStatus();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchModelStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/stats');
      const data = await response.json();
      if (data.success) {
        setModelStats(data.model_stats);
      }
    } catch (error) {
      console.error('Error fetching model stats:', error);
    }
  };

  const fetchStreamingStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/stream/status');
      const data = await response.json();
      if (data.success) {
        setStreamingStats(data.streaming_status);
        setIsStreaming(data.streaming_status.is_streaming);
      }
    } catch (error) {
      console.error('Error fetching streaming status:', error);
    }
  };

  const startStreaming = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/stream/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setIsStreaming(true);
        fetchStreamingStatus();
      }
    } catch (error) {
      console.error('Error starting streaming:', error);
    }
  };

  const stopStreaming = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/stream/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setIsStreaming(false);
        fetchStreamingStatus();
      }
    } catch (error) {
      console.error('Error stopping streaming:', error);
    }
  };

  const toggleAnomalyDetection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/stream/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomaly_detection_enabled: !anomalyDetectionEnabled })
      });
      const data = await response.json();
      if (data.success) {
        setAnomalyDetectionEnabled(!anomalyDetectionEnabled);
        fetchStreamingStatus();
      }
    } catch (error) {
      console.error('Error toggling anomaly detection:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFacilityColor = (facility: string) => {
    switch (facility) {
      case 'water_treatment': return 'bg-blue-500';
      case 'nuclear_plant': return 'bg-yellow-500';
      case 'electrical_grid': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Anomaly Detection</h1>
          <p className="text-gray-600">Real-time industrial sensor monitoring with ML-powered anomaly detection</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Streaming Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={isStreaming ? stopStreaming : startStreaming}
                  variant={isStreaming ? "destructive" : "default"}
                  size="sm"
                >
                  {isStreaming ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isStreaming ? 'Stop Stream' : 'Start Stream'}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="anomaly-detection"
                  checked={anomalyDetectionEnabled}
                  onCheckedChange={toggleAnomalyDetection}
                />
                <Label htmlFor="anomaly-detection">Anomaly Detection</Label>
              </div>
            </div>

            {streamingStats && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Progress: {streamingStats.progress_percentage}%</span>
                <span>Speed: {streamingStats.stream_speed}ms</span>
                <span>Data Points: {streamingStats.current_index}/{streamingStats.total_data_points}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Stats */}
      {modelStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold">{(modelStats.accuracy * 100).toFixed(1)}%</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precision</p>
                  <p className="text-2xl font-bold">{(modelStats.precision * 100).toFixed(1)}%</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Predictions</p>
                  <p className="text-2xl font-bold">{modelStats.total_predictions.toLocaleString()}</p>
                </div>
                <Zap className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Anomaly Rate</p>
                  <p className="text-2xl font-bold">{modelStats.current_anomaly_rate}%</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Data Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Sensor Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="anomaly_score" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Anomaly Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Recent Anomaly Alerts</span>
            <Badge variant="secondary">{anomalyAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalyAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No anomalies detected yet</p>
            ) : (
              anomalyAlerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getFacilityColor(alert.facility)}`}></div>
                    <div>
                      <p className="font-medium">{alert.device} - {alert.sensor}</p>
                      <p className="text-sm text-gray-600">
                        Value: {alert.value.toFixed(2)} | Score: {alert.anomaly_score.toFixed(3)} | 
                        Confidence: {(alert.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Sensor Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Sensor Data Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Timestamp</th>
                  <th className="text-left p-2">Facility</th>
                  <th className="text-left p-2">Device</th>
                  <th className="text-left p-2">Sensor</th>
                  <th className="text-left p-2">Value</th>
                  <th className="text-left p-2">Criticality</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.slice(-10).reverse().map((data, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(data.timestamp).toLocaleTimeString()}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getFacilityColor(data.facility_type)}`}></div>
                        <span>{data.facility_type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="p-2">{data.device_id}</td>
                    <td className="p-2">{data.sensor_name.replace('_', ' ')}</td>
                    <td className="p-2 font-mono">{data.sensor_value.toFixed(2)}</td>
                    <td className="p-2">
                      <Badge variant={data.criticality === 'critical' ? 'destructive' : 'secondary'}>
                        {data.criticality}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {data.is_anomaly ? (
                        <Badge variant="destructive">Anomaly</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnomalyDetection; 