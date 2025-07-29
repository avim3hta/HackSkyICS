const express = require('express');
const router = express.Router();

// Get simulation engine instance
let simulationEngine;

// Initialize simulation engine reference
const initializeEngine = (engine) => {
  simulationEngine = engine;
};

// Get overall system status
router.get('/status', (req, res) => {
  try {
    const status = simulationEngine ? simulationEngine.getSystemStatus() : {
      status: 'unknown',
      operational_devices: 0,
      total_devices: 0,
      uptime: 0,
      last_update: new Date().toISOString()
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Get all device states
router.get('/devices', (req, res) => {
  try {
    const devices = simulationEngine ? simulationEngine.getDeviceStates() : {};
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get device states' });
  }
});

// Get real-time process metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = simulationEngine ? simulationEngine.getProcessMetrics() : {};
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get process metrics' });
  }
});

// Get historical data
router.get('/history', (req, res) => {
  try {
    const { facility, device, hours = 24 } = req.query;
    
    // Generate historical data based on parameters
    const history = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      history.push({
        timestamp: timestamp.toISOString(),
        facility: facility || 'water_treatment',
        device: device || 'PUMP_001',
        value: Math.random() * 100,
        status: Math.random() > 0.9 ? 'warning' : 'normal'
      });
    }
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get historical data' });
  }
});

// Send control command
router.post('/control', (req, res) => {
  try {
    const { device_id, command, value } = req.body;
    
    if (!device_id || !command) {
      return res.status(400).json({ error: 'Device ID and command are required' });
    }
    
    // Simulate command execution
    const result = {
      success: true,
      device_id,
      command,
      value,
      timestamp: new Date().toISOString(),
      message: `Command ${command} executed successfully on ${device_id}`
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute control command' });
  }
});

module.exports = { router, initializeEngine }; 