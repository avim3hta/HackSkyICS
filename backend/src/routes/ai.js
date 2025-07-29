const express = require('express');
const router = express.Router();

// Natural language query processing
router.post('/query', (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Static responses based on keywords (will be replaced with LLM)
    let response = {
      response: "I don't understand that query yet. AI integration coming soon!",
      confidence: 0.5,
      source: "static_backend"
    };
    
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('pump') && lowerQuery.includes('status')) {
      response = {
        response: "PUMP_001 is running at 75% capacity with 45.2°C temperature. PUMP_002 is on standby.",
        confidence: 0.9,
        source: "static_backend"
      };
    } else if (lowerQuery.includes('tank') && lowerQuery.includes('level')) {
      response = {
        response: "Main tank is at 75.2% capacity with excellent water quality (98.5%).",
        confidence: 0.9,
        source: "static_backend"
      };
    } else if (lowerQuery.includes('temperature') || lowerQuery.includes('temp')) {
      response = {
        response: "Current system temperatures: Reactor at 315.5°C, Coolant at 55.8°C, Water treatment at 28.3°C.",
        confidence: 0.8,
        source: "static_backend"
      };
    } else if (lowerQuery.includes('security') || lowerQuery.includes('threat')) {
      response = {
        response: "Security status is normal. No active threats detected. All systems are protected.",
        confidence: 0.9,
        source: "static_backend"
      };
    } else if (lowerQuery.includes('maintenance')) {
      response = {
        response: "Next scheduled maintenance: PUMP_001 on Feb 15, VALVE_A on Feb 12, Reactor on March 1.",
        confidence: 0.8,
        source: "static_backend"
      };
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Get AI-generated insights
router.get('/insights', (req, res) => {
  try {
    const insights = [
      {
        id: 'INSIGHT_001',
        type: 'performance',
        title: 'Pump Efficiency Optimization',
        description: 'PUMP_001 efficiency has decreased by 2% over the last week. Consider maintenance check.',
        confidence: 0.85,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      },
      {
        id: 'INSIGHT_002',
        type: 'security',
        title: 'Network Traffic Pattern',
        description: 'Unusual Modbus traffic pattern detected from 192.168.1.100. Monitoring recommended.',
        confidence: 0.72,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        priority: 'high'
      },
      {
        id: 'INSIGHT_003',
        type: 'maintenance',
        title: 'Predictive Maintenance Alert',
        description: 'VALVE_B showing signs of wear. Schedule maintenance within 2 weeks.',
        confidence: 0.91,
        timestamp: new Date().toISOString(),
        priority: 'medium'
      }
    ];
    
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get AI insights' });
  }
});

// Execute AI-generated command
router.post('/command', (req, res) => {
  try {
    const { command, reason, confidence } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    // Simulate AI command execution
    const result = {
      success: true,
      command,
      reason,
      confidence: confidence || 0.8,
      timestamp: new Date().toISOString(),
      message: `AI command executed: ${command}`,
      source: "static_backend"
    };
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute AI command' });
  }
});

// Get predictive analytics
router.get('/predictions', (req, res) => {
  try {
    const predictions = [
      {
        id: 'PRED_001',
        type: 'maintenance',
        device: 'PUMP_001',
        prediction: 'Maintenance needed in 15 days',
        confidence: 0.88,
        reason: 'Efficiency trend analysis shows degradation',
        timestamp: new Date().toISOString()
      },
      {
        id: 'PRED_002',
        type: 'performance',
        device: 'REACTOR_001',
        prediction: 'Power output will decrease by 3% in 24 hours',
        confidence: 0.75,
        reason: 'Temperature trend analysis',
        timestamp: new Date().toISOString()
      },
      {
        id: 'PRED_003',
        type: 'security',
        device: 'network',
        prediction: 'Potential security incident in next 6 hours',
        confidence: 0.65,
        reason: 'Anomalous traffic pattern detection',
        timestamp: new Date().toISOString()
      }
    ];
    
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

module.exports = router; 