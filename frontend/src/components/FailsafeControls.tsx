import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useToast } from './ui/use-toast';
import { AlertTriangle, Shield, ShieldAlert, Clock, User, MapPin, Activity } from 'lucide-react';

interface FailsafeStatus {
  isActive: boolean;
  activationTime?: string;
  activationReason?: string;
  activatedBy?: string;
  allowedIP: string;
  metrics: {
    totalActivations: number;
    manualActivations: number;
    automaticActivations: number;
    compromiseDetections: number;
    lastActivation?: string;
    activationHistory: Array<{
      timestamp: string;
      reason: string;
      activatedBy: string;
      type: 'manual' | 'automatic';
      clientIP?: string;
      threat?: any;
    }>;
  };
}

interface FailsafeControlsProps {
  isAdmin: boolean;
  currentUserIP?: string;
}

const FailsafeControls: React.FC<FailsafeControlsProps> = ({ isAdmin, currentUserIP }) => {
  const [status, setStatus] = useState<FailsafeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activationReason, setActivationReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Fetch failsafe status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/failsafe/status/detailed');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        console.error('Failed to fetch failsafe status');
      }
    } catch (error) {
      console.error('Error fetching failsafe status:', error);
    }
  };

  // Auto-refresh status
  useEffect(() => {
    fetchStatus();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to failsafe WebSocket');
      ws.send(JSON.stringify({ type: 'join-failsafe' }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'failsafe:activated') {
        toast({
          title: "🚨 Failsafe Activated",
          description: `Reason: ${data.reason}`,
          variant: "destructive",
        });
        fetchStatus();
      } else if (data.type === 'failsafe:deactivated') {
        toast({
          title: "✅ Failsafe Deactivated",
          description: "Normal operations restored",
        });
        fetchStatus();
      } else if (data.type === 'failsafe:unauthorized_access') {
        toast({
          title: "🚫 Unauthorized Access Blocked",
          description: `IP: ${data.clientIP}`,
          variant: "destructive",
        });
      }
    };
    
    return () => ws.close();
  }, [toast]);

  // Activate failsafe
  const handleActivate = async () => {
    if (!activationReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for activation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/failsafe/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: activationReason.trim() }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "🚨 Failsafe Activated",
          description: result.message,
        });
        setActivationReason('');
        fetchStatus();
      } else {
        toast({
          title: "Error",
          description: result.message || 'Failed to activate failsafe',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while activating failsafe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Deactivate failsafe
  const handleDeactivate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/failsafe/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "✅ Failsafe Deactivated",
          description: result.message,
        });
        fetchStatus();
      } else {
        toast({
          title: "Error",
          description: result.message || 'Failed to deactivate failsafe',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while deactivating failsafe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Test IP check
  const handleTestIP = async () => {
    try {
      const response = await fetch('/api/failsafe/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'check_ip' }),
      });

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "IP Check Result",
          description: `Your IP: ${result.clientIP}, Allowed: ${result.isAllowed ? '✅' : '❌'}`,
        });
      }
    } catch (error) {
      console.error('IP test error:', error);
    }
  };

  if (!isAdmin) {
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Failsafe Recovery System
          </CardTitle>
          <CardDescription>
            Administrative privileges required to access failsafe controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Access denied</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Failsafe Recovery System
          </CardTitle>
          <CardDescription>
            Establishing secure connection to failsafe monitoring service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <div className="space-y-2">
              <p className="font-semibold">Loading failsafe status...</p>
              <p className="text-sm text-gray-600">Connecting to recovery device (10.12.12.108)</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Network Status: Active
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Security: Encrypted
                </div>
              </div>
            </div>
          </div>
          
          {/* Loading progress indicators */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Initializing secure channel</span>
              <span>●●●○</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
          </div>

          {currentUserIP && (
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-500">
                <MapPin className="h-3 w-3 inline mr-1" />
                Your IP: {currentUserIP}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card className={`border-2 ${status.isActive ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.isActive ? (
                <ShieldAlert className="h-6 w-6 text-red-600" />
              ) : (
                <Shield className="h-6 w-6 text-green-600" />
              )}
              Failsafe Recovery System
            </div>
            <Badge variant={status.isActive ? "destructive" : "default"}>
              {status.isActive ? 'ACTIVE' : 'STANDBY'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Emergency access restriction to secure recovery device (10.12.12.108)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isActive && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">🚨 FAILSAFE MODE ACTIVE</h4>
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Activated: {new Date(status.activationTime!).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By: {status.activatedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Reason: {status.activationReason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Allowed IP: {status.allowedIP}</span>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-4">
            {!status.isActive ? (
              <div className="flex-1 space-y-2">
                <Label htmlFor="reason">Activation Reason</Label>
                <Input
                  id="reason"
                  placeholder="Enter reason for failsafe activation..."
                  value={activationReason}
                  onChange={(e) => setActivationReason(e.target.value)}
                />
                <Button 
                  onClick={handleActivate}
                  disabled={loading || !activationReason.trim()}
                  variant="destructive"
                  className="w-full"
                >
                  {loading ? 'Activating...' : '🚨 Activate Failsafe'}
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <Button 
                  onClick={handleDeactivate}
                  disabled={loading || currentUserIP !== status.allowedIP}
                  variant="default"
                  className="w-full"
                >
                  {loading ? 'Deactivating...' : '✅ Deactivate Failsafe'}
                </Button>
                {currentUserIP !== status.allowedIP && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Can only be deactivated from recovery device ({status.allowedIP})
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Auto-refresh status</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>

          {/* Test Controls */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleTestIP}>
                Test IP Check
              </Button>
              <Button variant="outline" size="sm" onClick={fetchStatus}>
                Refresh Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Failsafe Statistics</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.metrics.totalActivations}</div>
              <div className="text-sm text-gray-600">Total Activations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.metrics.manualActivations}</div>
              <div className="text-sm text-gray-600">Manual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{status.metrics.automaticActivations}</div>
              <div className="text-sm text-gray-600">Automatic</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{status.metrics.compromiseDetections}</div>
              <div className="text-sm text-gray-600">Compromises</div>
            </div>
          </div>

          {showHistory && status.metrics.activationHistory.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Recent Activations</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {status.metrics.activationHistory.slice(-10).reverse().map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{event.reason}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(event.timestamp).toLocaleString()} • {event.activatedBy}
                      </div>
                    </div>
                    <Badge variant={event.type === 'automatic' ? 'destructive' : 'default'}>
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FailsafeControls;