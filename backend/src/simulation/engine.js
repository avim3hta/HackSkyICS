const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SimulationEngine {
  constructor(io) {
    this.io = io;
    this.isRunning = false;
    this.devices = this.initializeDevices();
    this.processes = this.initializeProcesses();
    this.securityEvents = [];
    this.modbusTraffic = [];
    this.intervals = {};
    
    // Configuration
    this.updateInterval = parseInt(process.env.MODBUS_UPDATE_INTERVAL) || 5000;
    this.anomalyRate = parseFloat(process.env.ANOMALY_INJECTION_RATE) || 0.05;
    this.securityEventRate = parseFloat(process.env.SECURITY_EVENT_RATE) || 0.02;
  }

  initializeDevices() {
    return {
      // Water Treatment Plant Devices
      water: {
        'PUMP_001': {
          id: 'PUMP_001',
          type: 'pump',
          status: 'running',
          speed: 75,
          temperature: 45.2,
          vibration: 0.3,
          efficiency: 92.5,
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-02-15',
          location: 'water_treatment',
          critical: true
        },
        'PUMP_002': {
          id: 'PUMP_002',
          type: 'pump',
          status: 'standby',
          speed: 0,
          temperature: 28.1,
          vibration: 0.1,
          efficiency: 94.2,
          last_maintenance: '2024-01-10',
          next_maintenance: '2024-02-10',
          location: 'water_treatment',
          critical: true
        },
        'VALVE_A': {
          id: 'VALVE_A',
          type: 'valve',
          status: 'open',
          position: 75,
          flow_rate: 850.3,
          pressure: 4.2,
          last_maintenance: '2024-01-12',
          next_maintenance: '2024-02-12',
          location: 'water_treatment',
          critical: false
        },
        'VALVE_B': {
          id: 'VALVE_B',
          type: 'valve',
          status: 'open',
          position: 60,
          flow_rate: 650.8,
          pressure: 3.8,
          last_maintenance: '2024-01-08',
          next_maintenance: '2024-02-08',
          location: 'water_treatment',
          critical: false
        },
        'TANK_MAIN': {
          id: 'TANK_MAIN',
          type: 'tank',
          status: 'normal',
          level: 75.2,
          capacity: 1000,
          temperature: 28.3,
          quality: 98.5,
          last_maintenance: '2024-01-05',
          next_maintenance: '2024-02-05',
          location: 'water_treatment',
          critical: true
        }
      },
      
      // Nuclear Power Plant Devices
      nuclear: {
        'REACTOR_001': {
          id: 'REACTOR_001',
          type: 'reactor',
          status: 'operational',
          power_output: 85.3,
          temperature: 315.5,
          pressure: 155.2,
          neutron_flux: 1.2e15,
          last_maintenance: '2024-01-01',
          next_maintenance: '2024-03-01',
          location: 'nuclear_plant',
          critical: true
        },
        'COOLANT_A': {
          id: 'COOLANT_A',
          type: 'coolant_system',
          status: 'operational',
          flow_rate: 2100.4,
          temperature: 55.8,
          pressure: 12.5,
          efficiency: 96.8,
          last_maintenance: '2024-01-10',
          next_maintenance: '2024-02-10',
          location: 'nuclear_plant',
          critical: true
        },
        'TURBINE_001': {
          id: 'TURBINE_001',
          type: 'turbine',
          status: 'operational',
          speed: 3000,
          power_output: 850,
          temperature: 450.2,
          vibration: 0.2,
          last_maintenance: '2024-01-08',
          next_maintenance: '2024-02-08',
          location: 'nuclear_plant',
          critical: true
        }
      },
      
      // Electrical Grid Devices
      grid: {
        'TRANSFORMER_A': {
          id: 'TRANSFORMER_A',
          type: 'transformer',
          status: 'operational',
          voltage_primary: 110000,
          voltage_secondary: 11000,
          current: 450.5,
          temperature: 65.2,
          efficiency: 98.5,
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-03-15',
          location: 'electrical_grid',
          critical: true
        },
        'GENERATOR_001': {
          id: 'GENERATOR_001',
          type: 'generator',
          status: 'operational',
          power_output: 500,
          frequency: 60.0,
          voltage: 11000,
          temperature: 72.1,
          last_maintenance: '2024-01-12',
          next_maintenance: '2024-02-12',
          location: 'electrical_grid',
          critical: true
        }
      }
    };
  }

  initializeProcesses() {
    return {
      water_treatment: {
        flow_rate: 1250.5,
        pressure: 4.2,
        temperature: 28.3,
        tank_level: 75.2,
        water_quality: 98.5,
        chemical_level: 85.3,
        efficiency: 94.2
      },
      nuclear_plant: {
        power_output: 850,
        reactor_temp: 315.5,
        coolant_temp: 55.8,
        pressure: 155.2,
        neutron_flux: 1.2e15,
        efficiency: 96.8
      },
      electrical_grid: {
        voltage: 110000,
        frequency: 60.0,
        load_percentage: 78.5,
        power_factor: 0.95,
        efficiency: 98.5
      }
    };
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting ICS Simulation Engine...');
    
    // Start different simulation loops
    this.intervals.deviceUpdates = setInterval(() => {
      this.updateDeviceStates();
    }, this.updateInterval);
    
    this.intervals.processUpdates = setInterval(() => {
      this.updateProcessMetrics();
    }, this.updateInterval);
    
    this.intervals.modbusTraffic = setInterval(() => {
      this.generateModbusTraffic();
    }, 2000);
    
    this.intervals.securityEvents = setInterval(() => {
      this.generateSecurityEvents();
    }, 10000);
    
    this.intervals.anomalies = setInterval(() => {
      this.injectAnomalies();
    }, 30000);
    
    console.log('✅ Simulation Engine started successfully');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('🛑 Stopping ICS Simulation Engine...');
    
    // Clear all intervals
    Object.values(this.intervals).forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = {};
    console.log('✅ Simulation Engine stopped');
  }

  updateDeviceStates() {
    Object.keys(this.devices).forEach(facility => {
      Object.keys(this.devices[facility]).forEach(deviceId => {
        const device = this.devices[facility][deviceId];
        
        // Update device metrics with realistic variations
        if (device.type === 'pump') {
          device.speed = Math.max(0, Math.min(100, device.speed + (Math.random() - 0.5) * 5));
          device.temperature = Math.max(20, Math.min(80, device.temperature + (Math.random() - 0.5) * 2));
          device.vibration = Math.max(0, Math.min(1, device.vibration + (Math.random() - 0.5) * 0.1));
          device.efficiency = Math.max(80, Math.min(98, device.efficiency + (Math.random() - 0.5) * 1));
        } else if (device.type === 'valve') {
          device.position = Math.max(0, Math.min(100, device.position + (Math.random() - 0.5) * 3));
          device.flow_rate = device.position * 12 + (Math.random() - 0.5) * 50;
          device.pressure = Math.max(1, Math.min(8, device.pressure + (Math.random() - 0.5) * 0.5));
        } else if (device.type === 'tank') {
          device.level = Math.max(10, Math.min(95, device.level + (Math.random() - 0.5) * 2));
          device.temperature = Math.max(15, Math.min(35, device.temperature + (Math.random() - 0.5) * 1));
          device.quality = Math.max(90, Math.min(100, device.quality + (Math.random() - 0.5) * 0.5));
        } else if (device.type === 'reactor') {
          device.power_output = Math.max(70, Math.min(95, device.power_output + (Math.random() - 0.5) * 2));
          device.temperature = Math.max(300, Math.min(330, device.temperature + (Math.random() - 0.5) * 3));
          device.pressure = Math.max(150, Math.min(160, device.pressure + (Math.random() - 0.5) * 1));
        }
      });
    });
    
    // Emit device updates via WebSocket
    this.io.to('scada-updates').emit('device-update', this.devices);
  }

  updateProcessMetrics() {
    Object.keys(this.processes).forEach(process => {
      const metrics = this.processes[process];
      
      // Update process metrics with realistic variations
      if (process === 'water_treatment') {
        metrics.flow_rate = Math.max(1000, Math.min(1500, metrics.flow_rate + (Math.random() - 0.5) * 50));
        metrics.pressure = Math.max(3, Math.min(6, metrics.pressure + (Math.random() - 0.5) * 0.3));
        metrics.temperature = Math.max(25, Math.min(32, metrics.temperature + (Math.random() - 0.5) * 1));
        metrics.tank_level = Math.max(60, Math.min(90, metrics.tank_level + (Math.random() - 0.5) * 2));
        metrics.water_quality = Math.max(95, Math.min(100, metrics.water_quality + (Math.random() - 0.5) * 0.3));
      } else if (process === 'nuclear_plant') {
        metrics.power_output = Math.max(800, Math.min(900, metrics.power_output + (Math.random() - 0.5) * 10));
        metrics.reactor_temp = Math.max(310, Math.min(320, metrics.reactor_temp + (Math.random() - 0.5) * 2));
        metrics.coolant_temp = Math.max(50, Math.min(60, metrics.coolant_temp + (Math.random() - 0.5) * 1));
        metrics.pressure = Math.max(150, Math.min(160, metrics.pressure + (Math.random() - 0.5) * 1));
      } else if (process === 'electrical_grid') {
        metrics.voltage = Math.max(108000, Math.min(112000, metrics.voltage + (Math.random() - 0.5) * 500));
        metrics.frequency = Math.max(59.8, Math.min(60.2, metrics.frequency + (Math.random() - 0.5) * 0.1));
        metrics.load_percentage = Math.max(70, Math.min(85, metrics.load_percentage + (Math.random() - 0.5) * 2));
      }
    });
    
    // Emit process updates via WebSocket
    this.io.to('scada-updates').emit('process-update', this.processes);
  }

  generateModbusTraffic() {
    const now = new Date();
    const traffic = {
      timestamp: now.toISOString(),
      source_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      dest_ip: `192.168.1.${Math.floor(Math.random() * 254) + 100}`,
      protocol: 'MODBUS',
      port: 502,
      packet_size: Math.floor(Math.random() * 200) + 64,
      function_code: Math.random() > 0.5 ? 3 : 6, // Read or Write
      register_address: Math.floor(Math.random() * 100) + 40001,
      data_length: Math.floor(Math.random() * 10) + 1,
      response_time: Math.floor(Math.random() * 100) + 10,
      status: Math.random() > 0.95 ? 'error' : 'success'
    };
    
    this.modbusTraffic.push(traffic);
    
    // Keep only last 1000 entries
    if (this.modbusTraffic.length > 1000) {
      this.modbusTraffic = this.modbusTraffic.slice(-1000);
    }
    
    // Emit traffic updates via WebSocket
    this.io.to('scada-updates').emit('modbus-traffic', traffic);
  }

  generateSecurityEvents() {
    if (Math.random() > this.securityEventRate) return;
    
    const eventTypes = [
      'unauthorized_access',
      'suspicious_login',
      'data_exfiltration',
      'protocol_violation',
      'rate_limit_exceeded'
    ];
    
    const event = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      source_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
      description: `Security event detected: ${eventTypes[Math.floor(Math.random() * eventTypes.length)]}`,
      status: 'active',
      confidence: Math.random() * 0.3 + 0.7
    };
    
    this.securityEvents.push(event);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }
    
    // Emit security events via WebSocket
    this.io.to('security-alerts').emit('security-event', event);
  }

  injectAnomalies() {
    if (Math.random() > this.anomalyRate) return;
    
    // Select random device and inject anomaly
    const facilities = Object.keys(this.devices);
    const facility = facilities[Math.floor(Math.random() * facilities.length)];
    const deviceIds = Object.keys(this.devices[facility]);
    const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
    
    const device = this.devices[facility][deviceId];
    
    // Inject different types of anomalies
    const anomalyTypes = ['high_temperature', 'high_pressure', 'low_efficiency', 'high_vibration'];
    const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    
    switch (anomalyType) {
      case 'high_temperature':
        device.temperature = Math.min(device.temperature + 20, 100);
        break;
      case 'high_pressure':
        if (device.pressure) device.pressure = Math.min(device.pressure + 5, 15);
        break;
      case 'low_efficiency':
        if (device.efficiency) device.efficiency = Math.max(device.efficiency - 15, 60);
        break;
      case 'high_vibration':
        if (device.vibration) device.vibration = Math.min(device.vibration + 0.5, 1.0);
        break;
    }
    
    // Emit anomaly alert
    this.io.to('scada-updates').emit('anomaly-detected', {
      device_id: deviceId,
      type: anomalyType,
      timestamp: new Date().toISOString(),
      severity: 'medium'
    });
  }

  // Getter methods for API endpoints
  getDeviceStates() {
    return this.devices;
  }

  getProcessMetrics() {
    return this.processes;
  }

  getSecurityEvents() {
    return this.securityEvents;
  }

  getModbusTraffic() {
    return this.modbusTraffic;
  }

  getSystemStatus() {
    const totalDevices = Object.values(this.devices).reduce((sum, facility) => 
      sum + Object.keys(facility).length, 0);
    
    const operationalDevices = Object.values(this.devices).reduce((sum, facility) => 
      sum + Object.values(facility).filter(device => device.status === 'operational' || device.status === 'running').length, 0);
    
    return {
      status: operationalDevices / totalDevices > 0.9 ? 'normal' : 'warning',
      operational_devices: operationalDevices,
      total_devices: totalDevices,
      uptime: process.uptime(),
      last_update: new Date().toISOString()
    };
  }
}

module.exports = { SimulationEngine }; 