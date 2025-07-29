import { useState, useEffect } from "react";
import { MetricCard } from "./MetricCard";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

// SCADA System Data Interface
interface SCADAData {
  timestamp: string;
  facility_type: string;
  system_id: string;
  component: string;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  temperature_c: number;
  pressure_bar: number;
  flow_rate: number;
  alarm_level: string;
  maintenance_due: string;
}

// Network Traffic Data Interface
interface NetworkTraffic {
  timestamp: string;
  source_ip: string;
  dest_ip: string;
  protocol: string;
  port: number;
  packet_size: number;
  facility_type: string;
  device_type: string;
  traffic_type: string;
  bytes_in: number;
  bytes_out: number;
  connection_state: string;
  security_event: string;
}

// Generate realistic SCADA data for different facilities
const generateSCADAData = (facilityType: string) => {
  const data: SCADAData[] = [];
  const now = new Date();
  
  const facilityConfigs = {
    nuclear_power: {
      components: ['reactor_control', 'cooling_system', 'turbine_control', 'safety_system'],
      baseTemp: 315,
      basePressure: 155,
      baseFlow: 1250
    },
    water_facility: {
      components: ['pump_station_1', 'filtration_unit', 'chemical_dosing', 'tank_level'],
      baseTemp: 28,
      basePressure: 4.2,
      baseFlow: 850
    },
    electricity_grid: {
      components: ['transformer_bank_a', 'substation_control', 'load_balancer', 'protection_system'],
      baseTemp: 65,
      basePressure: 0,
      baseFlow: 0
    }
  };

  const config = facilityConfigs[facilityType as keyof typeof facilityConfigs] || facilityConfigs.water_facility;
  
  for (let i = 0; i < 20; i++) {
    const time = new Date(now.getTime() - (20 - i) * 60000); // Every minute
    
    config.components.forEach(component => {
      // Generate realistic variations
      const cpuVariation = (Math.random() - 0.5) * 20;
      const memVariation = (Math.random() - 0.5) * 15;
      const tempVariation = (Math.random() - 0.5) * 10;
      const pressureVariation = (Math.random() - 0.5) * 5;
      const flowVariation = (Math.random() - 0.5) * 100;
      
      // Add occasional anomalies
      const anomaly = Math.random() > 0.95;
      const status = anomaly ? (Math.random() > 0.5 ? 'warning' : 'critical') : 'operational';
      const alarmLevel = anomaly ? (status === 'critical' ? 'high' : 'medium') : 'normal';
      
      data.push({
        timestamp: time.toISOString(),
        facility_type: facilityType,
        system_id: facilityType === 'nuclear_power' ? 'NPP-001' : 
                   facilityType === 'water_facility' ? 'WF-002' : 'EG-003',
        component,
        status,
        cpu_usage: Math.max(10, Math.min(95, 45 + cpuVariation + (anomaly ? 30 : 0))),
        memory_usage: Math.max(20, Math.min(90, 60 + memVariation + (anomaly ? 20 : 0))),
        disk_usage: Math.max(5, Math.min(80, 25 + (Math.random() - 0.5) * 10)),
        temperature_c: Math.max(0, config.baseTemp + tempVariation + (anomaly ? 50 : 0)),
        pressure_bar: Math.max(0, config.basePressure + pressureVariation + (anomaly ? 20 : 0)),
        flow_rate: Math.max(0, config.baseFlow + flowVariation + (anomaly ? 500 : 0)),
        alarm_level: alarmLevel,
        maintenance_due: new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    });
  }
  
  return data;
};

// Generate realistic network traffic data
const generateNetworkTrafficData = (facilityType: string) => {
  const data: NetworkTraffic[] = [];
  const now = new Date();
  
  const protocols = {
    nuclear_power: ['MODBUS', 'DNP3', 'IEC61850', 'TCP', 'ICMP', 'HTTP', 'SSH', 'UDP'],
    water_facility: ['MODBUS', 'DNP3', 'HTTP', 'TCP', 'UDP', 'ICMP', 'SSH', 'HTTPS'],
    electricity_grid: ['IEC61850', 'DNP3', 'MODBUS', 'TCP', 'ICMP', 'HTTP', 'SSH', 'UDP']
  };
  
  const deviceTypes = {
    nuclear_power: ['HMI', 'PLC', 'RTU', 'workstation', 'maintenance_server'],
    water_facility: ['SCADA', 'PLC', 'operator_station', 'sensor_network'],
    electricity_grid: ['smart_meter', 'substation_controller', 'grid_controller', 'protection_relay']
  };
  
  const facilityProtocols = protocols[facilityType as keyof typeof protocols] || protocols.water_facility;
  const facilityDevices = deviceTypes[facilityType as keyof typeof deviceTypes] || deviceTypes.water_facility;
  
  for (let i = 0; i < 30; i++) {
    const time = new Date(now.getTime() - (30 - i) * 2000); // Every 2 seconds
    
    // Generate 2-4 traffic entries per timestamp
    const entriesCount = Math.floor(Math.random() * 3) + 2;
    
         for (let j = 0; j < entriesCount; j++) {
       // Weighted protocol selection based on facility type
       let protocol;
       const rand = Math.random();
       
       if (facilityType === 'nuclear_power') {
         // Nuclear: Heavy on MODBUS and DNP3 for control systems
         if (rand < 0.35) protocol = 'MODBUS';
         else if (rand < 0.60) protocol = 'DNP3';
         else if (rand < 0.75) protocol = 'IEC61850';
         else if (rand < 0.85) protocol = 'TCP';
         else if (rand < 0.92) protocol = 'ICMP';
         else if (rand < 0.96) protocol = 'HTTP';
         else if (rand < 0.98) protocol = 'SSH';
         else protocol = 'UDP';
       } else if (facilityType === 'water_facility') {
         // Water: Balanced mix with more HTTP for operator interfaces
         if (rand < 0.30) protocol = 'MODBUS';
         else if (rand < 0.50) protocol = 'DNP3';
         else if (rand < 0.65) protocol = 'HTTP';
         else if (rand < 0.80) protocol = 'TCP';
         else if (rand < 0.88) protocol = 'UDP';
         else if (rand < 0.94) protocol = 'ICMP';
         else if (rand < 0.97) protocol = 'SSH';
         else protocol = 'HTTPS';
       } else {
         // Electricity: Heavy on IEC61850 for smart grid
         if (rand < 0.40) protocol = 'IEC61850';
         else if (rand < 0.60) protocol = 'DNP3';
         else if (rand < 0.75) protocol = 'MODBUS';
         else if (rand < 0.85) protocol = 'TCP';
         else if (rand < 0.92) protocol = 'ICMP';
         else if (rand < 0.96) protocol = 'HTTP';
         else if (rand < 0.98) protocol = 'SSH';
         else protocol = 'UDP';
       }
       
       const deviceType = facilityDevices[Math.floor(Math.random() * facilityDevices.length)];
      
      // Generate realistic IP addresses
      const baseIP = facilityType === 'nuclear_power' ? '10.1.1' : 
                     facilityType === 'water_facility' ? '10.2.1' : '10.3.1';
      
      const sourceIP = `${baseIP}.${Math.floor(Math.random() * 254) + 1}`;
      const destIP = `${baseIP}.${Math.floor(Math.random() * 254) + 100}`;
      
      // Add occasional security events
      const securityEvent = Math.random() > 0.97 ? 
        (Math.random() > 0.5 ? 'suspicious_login_attempt' : 'unauthorized_access_attempt') : 'normal';
      
      data.push({
        timestamp: time.toISOString(),
        source_ip: securityEvent !== 'normal' && Math.random() > 0.5 ? 'unknown' : sourceIP,
        dest_ip: destIP,
        protocol,
                 port: protocol === 'MODBUS' ? 502 : 
               protocol === 'DNP3' ? 20000 : 
               protocol === 'IEC61850' ? 102 : 
               protocol === 'HTTP' ? 80 : 
               protocol === 'HTTPS' ? 443 : 
               protocol === 'SSH' ? 22 : 
               protocol === 'ICMP' ? 0 : 
               protocol === 'UDP' ? Math.floor(Math.random() * 1000) + 1000 : 
               Math.floor(Math.random() * 65535) + 1,
                 packet_size: protocol === 'MODBUS' ? 64 : 
                     protocol === 'DNP3' ? 128 : 
                     protocol === 'IEC61850' ? 256 : 
                     protocol === 'HTTP' ? 1024 : 
                     protocol === 'HTTPS' ? 1024 : 
                     protocol === 'SSH' ? 512 : 
                     protocol === 'ICMP' ? 84 : 
                     protocol === 'UDP' ? 512 : 
                     Math.floor(Math.random() * 2048) + 64,
        facility_type: facilityType,
        device_type: deviceType,
                 traffic_type: protocol === 'MODBUS' ? 'control_data' : 
                      protocol === 'DNP3' ? 'telemetry' : 
                      protocol === 'IEC61850' ? 'measurement' : 
                      protocol === 'HTTP' ? 'web_interface' : 
                      protocol === 'HTTPS' ? 'secure_web' : 
                      protocol === 'SSH' ? 'remote_access' : 
                      protocol === 'ICMP' ? 'network_ping' : 
                      protocol === 'UDP' ? 'broadcast' : 
                      'maintenance',
        bytes_in: Math.floor(Math.random() * 16384) + 512,
        bytes_out: Math.floor(Math.random() * 8192) + 256,
        connection_state: securityEvent !== 'normal' ? 'failed' : 'established',
        security_event: securityEvent
      });
    }
  }
  
  return data;
};

// Facility Metrics Interface
interface FacilityMetrics {
  modbusCommands: number;
  anomalies: number;
  blocked: number;
  connections: number;
  // Nuclear specific
  reactorTemp?: number;
  pressure?: number;
  powerOutput?: number;
  // Water specific
  flowRate?: number;
  waterQuality?: number;
  // Grid specific
  voltage?: number;
  frequency?: number;
  loadPercentage?: number;
}

// Generate facility-specific metrics
const generateFacilityMetrics = (facilityType: string): FacilityMetrics => {
  const baseMetrics = {
    nuclear_power: {
      modbusCommands: 35,
      anomalies: 0,
      blocked: 0,
      connections: 18,
      reactorTemp: 315,
      pressure: 155,
      powerOutput: 850
    },
    water_facility: {
      modbusCommands: 25,
      anomalies: 0,
      blocked: 0,
      connections: 12,
      flowRate: 850,
      pressure: 4.2,
      waterQuality: 98.5
    },
    electricity_grid: {
      modbusCommands: 28,
      anomalies: 0,
      blocked: 0,
      connections: 15,
      voltage: 138,
      frequency: 60.0,
      loadPercentage: 85
    }
  };
  
  const base = baseMetrics[facilityType as keyof typeof baseMetrics] || baseMetrics.water_facility;
  
  return {
    modbusCommands: Math.max(15, Math.min(50, base.modbusCommands + (Math.random() - 0.5) * 10)),
    anomalies: Math.random() > 0.95 ? base.anomalies + 1 : base.anomalies,
    blocked: Math.random() > 0.98 ? base.blocked + 1 : base.blocked,
    connections: Math.max(8, Math.min(25, base.connections + (Math.random() - 0.5) * 4)),
    ...base
  };
};

interface SecurityMonitoringProps {
  selectedPlantId?: string;
}

export const SecurityMonitoring = ({ selectedPlantId = "water" }: SecurityMonitoringProps) => {
  const [scadaData, setScadaData] = useState<SCADAData[]>([]);
  const [networkData, setNetworkData] = useState<NetworkTraffic[]>([]);
  const [metrics, setMetrics] = useState<FacilityMetrics>(generateFacilityMetrics(selectedPlantId));
  const [recentAlerts, setRecentAlerts] = useState<Array<{type: string, message: string, severity: string}>>([]);

  // Map plant IDs to facility types
  const getFacilityType = (plantId: string) => {
    switch (plantId) {
      case 'nuclear': return 'nuclear_power';
      case 'water': return 'water_facility';
      case 'grid': return 'electricity_grid';
      default: return 'water_facility';
    }
  };

  const facilityType = getFacilityType(selectedPlantId);

  // Update SCADA data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setScadaData(generateSCADAData(facilityType));
    }, 5000);

    return () => clearInterval(interval);
  }, [facilityType]);

  // Update network traffic every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkData(generateNetworkTrafficData(facilityType));
    }, 3000);

    return () => clearInterval(interval);
  }, [facilityType]);

  // Update metrics every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => {
        const newMetrics = generateFacilityMetrics(facilityType);
        
        // Generate alerts based on anomalies
        if (newMetrics.anomalies > prev.anomalies) {
          setRecentAlerts(prevAlerts => [
            {
              type: 'Anomaly Detected',
              message: `Security anomaly detected in ${selectedPlantId} facility`,
              severity: 'warning'
            },
            ...prevAlerts.slice(0, 4)
          ]);
        }
        
        if (newMetrics.blocked > prev.blocked) {
          setRecentAlerts(prevAlerts => [
            {
              type: 'Attack Blocked',
              message: `Unauthorized access attempt blocked`,
              severity: 'critical'
            },
            ...prevAlerts.slice(0, 4)
          ]);
        }
        
        return newMetrics;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [facilityType, selectedPlantId]);

  // Prepare chart data
  const getSCADAChartData = () => {
    const componentData = scadaData.reduce((acc, item) => {
      if (!acc[item.component]) {
        acc[item.component] = [];
      }
      acc[item.component].push({
        time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        cpu: item.cpu_usage,
        memory: item.memory_usage,
        temperature: item.temperature_c,
        pressure: item.pressure_bar
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(componentData).slice(0, 3).map(component => ({
      name: component,
      data: componentData[component]
    }));
  };

  const getNetworkChartData = () => {
    const protocolCounts = networkData.reduce((acc, item) => {
      acc[item.protocol] = (acc[item.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(protocolCounts).map(([protocol, count]) => ({
      name: protocol,
      value: count
    }));
  };

  const scadaChartData = getSCADAChartData();
  const networkChartData = getNetworkChartData();

  return (
    <div className="dashboard-panel">
      <h3 className="text-xl font-semibold mb-6 text-primary flex items-center gap-2">
        <span className="animate-pulse">📊</span>
        SCADA Monitoring - {selectedPlantId.toUpperCase()}
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
          LIVE
        </span>
      </h3>
      
      {/* SCADA System Status */}
      <div className="mb-6">
        <h4 className="text-lg font-medium mb-3 text-accent flex items-center gap-2">
          <span className="animate-pulse">🏭</span>
          SCADA System Status
        </h4>
        <div className="h-32 chart-glow bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scadaChartData[0]?.data || []}>
              <defs>
                <linearGradient id="scadaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="cpu" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

             {/* Network Protocol Distribution */}
      <div className="mb-6">
         <h4 className="text-lg font-medium mb-3 text-accent flex items-center gap-2">
           <span className="animate-pulse">🌐</span>
           Network Protocol Distribution
         </h4>
         <div className="h-48 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
           <div className="grid grid-cols-2 gap-4 h-full">
             {/* Pie Chart */}
             <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={networkChartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={25}
                     outerRadius={70}
                     paddingAngle={3}
                     dataKey="value"
                     isAnimationActive={true}
                     animationDuration={1500}
                     label={false}
                   >
                     {networkChartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={[
                         '#3b82f6', // Blue for MODBUS
                         '#10b981', // Green for DNP3
                         '#f59e0b', // Orange for IEC61850
                         '#ef4444', // Red for TCP
                         '#8b5cf6', // Purple for ICMP
                         '#06b6d4', // Cyan for HTTP
                         '#84cc16', // Lime for UDP
                         '#f97316'  // Orange for SSH
                       ][index % 8]} />
                     ))}
                   </Pie>
                 </PieChart>
          </ResponsiveContainer>
        </div>
             
             {/* Protocol Details */}
             <div className="h-full overflow-y-auto">
               <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                 Protocol Details
               </div>
               <div className="space-y-2">
                 {networkChartData.slice(0, 6).map((protocol, index) => (
                   <div key={protocol.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                     <div className="flex items-center gap-3">
                       <div 
                         className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" 
                         style={{ 
                           backgroundColor: [
                             '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
                           ][index % 6] 
                         }}
                       ></div>
                       <div>
                         <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{protocol.name}</span>
                         <div className="text-xs text-gray-600 dark:text-gray-400">
                           {protocol.name === 'MODBUS' ? 'Industrial Control' :
                            protocol.name === 'DNP3' ? 'Telemetry Data' :
                            protocol.name === 'IEC61850' ? 'Smart Grid' :
                            protocol.name === 'HTTP' ? 'Web Interface' :
                            protocol.name === 'HTTPS' ? 'Secure Web' :
                            protocol.name === 'SSH' ? 'Remote Access' :
                            protocol.name === 'ICMP' ? 'Network Ping' :
                            protocol.name === 'UDP' ? 'Broadcast' : 'General'}
                         </div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                         {protocol.value}
                       </div>
                       <div className="text-xs text-gray-600 dark:text-gray-400">
                         packets
                       </div>
                     </div>
                   </div>
                 ))}
      </div>

               {/* Protocol Info */}
               <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                 <div className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                   Most Active: {networkChartData[0]?.name || 'MODBUS'}
                 </div>
                 <div className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                   Port: {networkChartData[0]?.name === 'MODBUS' ? '502' : 
                          networkChartData[0]?.name === 'DNP3' ? '20000' : 
                          networkChartData[0]?.name === 'IEC61850' ? '102' : 
                          networkChartData[0]?.name === 'HTTP' ? '80' :
                          networkChartData[0]?.name === 'HTTPS' ? '443' :
                          networkChartData[0]?.name === 'SSH' ? '22' :
                          networkChartData[0]?.name === 'ICMP' ? '0' : 'Various'}
                 </div>
                 <div className="text-xs text-blue-600 dark:text-blue-400">
                   {networkChartData[0]?.name === 'MODBUS' ? 'Industrial control commands' :
                    networkChartData[0]?.name === 'DNP3' ? 'Telemetry and monitoring' :
                    networkChartData[0]?.name === 'IEC61850' ? 'Smart grid communications' :
                    networkChartData[0]?.name === 'HTTP' ? 'Web interface traffic' :
                    networkChartData[0]?.name === 'HTTPS' ? 'Secure web traffic' :
                    networkChartData[0]?.name === 'SSH' ? 'Secure remote access' :
                    networkChartData[0]?.name === 'ICMP' ? 'Network diagnostics' :
                    networkChartData[0]?.name === 'UDP' ? 'Broadcast messages' : 'General network traffic'}
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

      

      {/* Facility-Specific Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard 
          title="Modbus Commands/Min" 
          value={Math.round(metrics.modbusCommands)} 
          status="normal"
        />
        <MetricCard 
          title="Anomalies Detected" 
          value={metrics.anomalies} 
          status={metrics.anomalies > 0 ? "warning" : "normal"}
        />
        <MetricCard 
          title="Commands Blocked" 
          value={metrics.blocked} 
          status={metrics.blocked > 0 ? "critical" : "normal"}
        />
        <MetricCard 
          title="Active Connections" 
          value={Math.round(metrics.connections)} 
          status="normal"
        />
      </div>

      {/* Facility-Specific Operational Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {selectedPlantId === 'nuclear' && (
          <>
            <MetricCard title="Reactor Temp (°C)" value={metrics.reactorTemp} unit="°C" status="normal" />
            <MetricCard title="Pressure (bar)" value={metrics.pressure} unit="bar" status="normal" />
            <MetricCard title="Power Output (MW)" value={metrics.powerOutput} unit="MW" status="normal" />
          </>
        )}
        {selectedPlantId === 'water' && (
          <>
            <MetricCard title="Flow Rate (L/min)" value={metrics.flowRate} unit="L/min" status="normal" />
            <MetricCard title="Pressure (bar)" value={metrics.pressure} unit="bar" status="normal" />
            <MetricCard title="Water Quality (%)" value={metrics.waterQuality} unit="%" status="normal" />
          </>
        )}
        {selectedPlantId === 'grid' && (
          <>
            <MetricCard title="Voltage (kV)" value={metrics.voltage} unit="kV" status="normal" />
            <MetricCard title="Frequency (Hz)" value={metrics.frequency} unit="Hz" status="normal" />
            <MetricCard title="Load (%)" value={metrics.loadPercentage} unit="%" status="normal" />
          </>
        )}
      </div>

             {/* Recent Alerts */}
       <div className="mb-4">
         <h4 className="text-lg font-medium mb-3 text-accent flex items-center gap-2">
           <span className="animate-pulse">🚨</span>
           Recent Alerts
         </h4>
         <div className="space-y-2">
           {recentAlerts.length > 0 ? (
             recentAlerts.map((alert, index) => (
               <div key={index} className={`p-3 rounded-lg border-l-4 ${
                 alert.severity === 'critical' 
                   ? 'bg-red-50 border-red-500 text-red-800 dark:bg-red-950/20 dark:border-red-400 dark:text-red-300'
                   : 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-950/20 dark:border-yellow-400 dark:text-yellow-300'
               }`}>
                 <div className="font-semibold text-sm">{alert.type}</div>
                 <div className="text-xs">{alert.message}</div>
               </div>
             ))
           ) : (
             <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-800 dark:bg-green-950/20 dark:border-green-400 dark:text-green-300 rounded-lg">
               <div className="font-semibold text-sm">All Systems Normal</div>
               <div className="text-xs">No security alerts detected</div>
             </div>
           )}
         </div>
       </div>

       {/* Live Network Traffic Log */}
       <div className="mb-4">
         <h4 className="text-lg font-medium mb-3 text-accent flex items-center gap-2">
           <span className="animate-pulse">📡</span>
           Live Network Traffic
         </h4>
         <div className="h-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-hidden">
           <div className="h-full overflow-y-auto space-y-1">
             {networkData.slice(-8).reverse().map((traffic, index) => (
               <div key={index} className={`flex items-center justify-between text-xs p-2 rounded border ${
                 traffic.security_event !== 'normal' 
                   ? 'bg-red-50 border-red-200 text-black dark:bg-red-950/20 dark:border-red-800 dark:text-white' 
                   : 'bg-gray-50 border-gray-100 text-black dark:bg-gray-900/50 dark:border-gray-700 dark:text-white'
               }`}>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                     {new Date(traffic.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </span>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     traffic.protocol === 'MODBUS' ? 'bg-blue-500 text-white' :
                     traffic.protocol === 'DNP3' ? 'bg-green-500 text-white' :
                     traffic.protocol === 'IEC61850' ? 'bg-orange-500 text-white' :
                     traffic.protocol === 'HTTP' ? 'bg-purple-500 text-white' :
                     traffic.protocol === 'HTTPS' ? 'bg-indigo-500 text-white' :
                     traffic.protocol === 'SSH' ? 'bg-gray-600 text-white' :
                     traffic.protocol === 'ICMP' ? 'bg-red-500 text-white' :
                     'bg-gray-500 text-white'
                   }`}>
                     {traffic.protocol}
                   </span>
                   <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200">
                     {traffic.source_ip} → {traffic.dest_ip}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                     {traffic.packet_size}B
                   </span>
                   {traffic.security_event !== 'normal' && (
                     <span className="text-xs bg-red-500 text-white px-2 py-1 rounded font-bold">
                       ⚠️ {traffic.security_event.replace(/_/g, ' ')}
                     </span>
                   )}
                 </div>
               </div>
             ))}
           </div>
         </div>
       </div>

             {/* Real-time Status Indicators */}
       <div className="mt-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg">
         <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
           System Status
         </div>
         <div className="grid grid-cols-3 gap-4">
           <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></span>
             <div>
               <div className="text-sm font-bold text-green-900 dark:text-green-100">SCADA Active</div>
               <div className="text-xs text-green-700 dark:text-green-300">Control systems online</div>
             </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
             <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></span>
             <div>
               <div className="text-sm font-bold text-blue-900 dark:text-blue-100">Monitoring Live</div>
               <div className="text-xs text-blue-700 dark:text-blue-300">Real-time surveillance</div>
             </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
             <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg"></span>
             <div>
               <div className="text-sm font-bold text-purple-900 dark:text-purple-100">AI Analysis</div>
               <div className="text-xs text-purple-700 dark:text-purple-300">Threat detection active</div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
};