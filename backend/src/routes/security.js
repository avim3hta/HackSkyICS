const express = require('express');
const router = express.Router();

// Get simulation engine instance
let simulationEngine;

// Initialize simulation engine reference
const initializeEngine = (engine) => {
  simulationEngine = engine;
};

// Get active security alerts
router.get('/alerts', (req, res) => {
  try {
    const alerts = simulationEngine ? simulationEngine.getSecurityEvents() : [];
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get security alerts' });
  }
});

// Get network traffic analysis
router.get('/traffic', (req, res) => {
  try {
    const traffic = simulationEngine ? simulationEngine.getModbusTraffic() : [];
    
    // Analyze traffic patterns
    const analysis = {
      total_packets: traffic.length,
      protocols: {
        MODBUS: traffic.filter(t => t.protocol === 'MODBUS').length,
        DNP3: traffic.filter(t => t.protocol === 'DNP3').length,
        HTTP: traffic.filter(t => t.protocol === 'HTTP').length
      },
      suspicious_activity: traffic.filter(t => t.status === 'error').length,
      top_sources: getTopSources(traffic),
      top_destinations: getTopDestinations(traffic)
    };
    
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get traffic analysis' });
  }
});

// Get threat intelligence
router.get('/threats', (req, res) => {
  try {
    const threats = [
      {
        id: 'THREAT_001',
        type: 'malware',
        severity: 'high',
        description: 'Suspicious Modbus command pattern detected',
        source: '192.168.1.100',
        timestamp: new Date().toISOString(),
        status: 'active'
      },
      {
        id: 'THREAT_002',
        type: 'unauthorized_access',
        severity: 'medium',
        description: 'Multiple failed login attempts detected',
        source: '192.168.1.150',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'resolved'
      }
    ];
    
    res.json(threats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get threat intelligence' });
  }
});

// Execute security response
router.post('/response', (req, res) => {
  try {
    const { action, target, reason } = req.body;
    
    if (!action || !target) {
      return res.status(400).json({ error: 'Action and target are required' });
    }
    
    // Simulate security response
    const response = {
      success: true,
      action,
      target,
      reason,
      timestamp: new Date().toISOString(),
      message: `Security response ${action} executed on ${target}`
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute security response' });
  }
});

// Helper functions
function getTopSources(traffic) {
  const sources = {};
  traffic.forEach(t => {
    sources[t.source_ip] = (sources[t.source_ip] || 0) + 1;
  });
  return Object.entries(sources)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));
}

function getTopDestinations(traffic) {
  const destinations = {};
  traffic.forEach(t => {
    destinations[t.dest_ip] = (destinations[t.dest_ip] || 0) + 1;
  });
  return Object.entries(destinations)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));
}

module.exports = { router, initializeEngine }; 