# 🏗️ Static Backend for ICS AI Integration

## Overview
This backend provides a static API layer that simulates real industrial control system data and operations. It's designed to be easily replaced with AI-powered endpoints once the LLM is trained.

## Architecture

```
Static Backend (Node.js/Express)
├── API Endpoints
│   ├── /api/scada/status - System status
│   ├── /api/scada/controls - Device controls
│   ├── /api/scada/metrics - Real-time metrics
│   ├── /api/security/alerts - Security monitoring
│   └── /api/ai/query - AI integration (future)
├── Data Simulation
│   ├── Modbus traffic generation
│   ├── Industrial process simulation
│   ├── Security event simulation
│   └── Anomaly injection
├── State Management
│   ├── Device states
│   ├── Process variables
│   ├── Security status
│   └── Historical data
└── AI Integration Points
    ├── Query processing
    ├── Command validation
    ├── Anomaly detection
    └── Predictive analytics
```

## API Endpoints

### SCADA Operations
- `GET /api/scada/status` - Overall system status
- `GET /api/scada/devices` - All device states
- `GET /api/scada/metrics` - Real-time process metrics
- `POST /api/scada/control` - Send control commands
- `GET /api/scada/history` - Historical data

### Security Monitoring
- `GET /api/security/alerts` - Active security alerts
- `GET /api/security/traffic` - Network traffic analysis
- `GET /api/security/threats` - Threat intelligence
- `POST /api/security/response` - Security responses

### AI Integration (Future)
- `POST /api/ai/query` - Natural language queries
- `GET /api/ai/insights` - AI-generated insights
- `POST /api/ai/command` - AI-generated commands
- `GET /api/ai/predictions` - Predictive analytics

## Data Models

### Device State
```json
{
  "device_id": "PUMP_001",
  "type": "pump",
  "status": "running",
  "speed": 75,
  "temperature": 45.2,
  "vibration": 0.3,
  "last_maintenance": "2024-01-15",
  "next_maintenance": "2024-02-15"
}
```

### Process Metrics
```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "flow_rate": 1250.5,
  "pressure": 4.2,
  "temperature": 28.3,
  "tank_level": 75.2,
  "water_quality": 98.5
}
```

### Security Alert
```json
{
  "alert_id": "SEC_001",
  "timestamp": "2024-01-20T10:30:00Z",
  "severity": "high",
  "type": "unauthorized_access",
  "source_ip": "192.168.1.100",
  "description": "Unauthorized Modbus command detected",
  "status": "active"
}
```

## Installation & Setup

### Prerequisites
```bash
# Node.js 18+ and npm
node --version
npm --version

# Install dependencies
npm install
```

### Configuration
```bash
# Environment variables
cp .env.example .env

# Edit configuration
nano .env
```

### Start Development Server
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access API
curl http://localhost:3001/api/scada/status
```

## AI Integration Points

### 1. Query Processing
**Current**: Static responses
**Future**: LLM-powered natural language understanding

```javascript
// Current static response
app.post('/api/ai/query', (req, res) => {
  const query = req.body.query;
  // Static response based on keywords
  res.json({
    response: "Pump 1 is running at 75% capacity",
    confidence: 0.9
  });
});

// Future AI integration
app.post('/api/ai/query', async (req, res) => {
  const query = req.body.query;
  const response = await llm.processQuery(query);
  res.json(response);
});
```

### 2. Command Validation
**Current**: Basic validation rules
**Future**: AI-powered command analysis

```javascript
// Current validation
app.post('/api/scada/control', (req, res) => {
  const command = req.body;
  if (isValidCommand(command)) {
    executeCommand(command);
    res.json({ success: true });
  } else {
    res.json({ error: "Invalid command" });
  }
});

// Future AI validation
app.post('/api/scada/control', async (req, res) => {
  const command = req.body;
  const validation = await ai.validateCommand(command);
  if (validation.safe) {
    executeCommand(command);
    res.json({ success: true });
  } else {
    res.json({ error: validation.reason });
  }
});
```

### 3. Anomaly Detection
**Current**: Rule-based detection
**Future**: ML-powered behavioral analysis

```javascript
// Current rule-based detection
function detectAnomaly(data) {
  if (data.temperature > 100) return "high_temperature";
  if (data.pressure > 10) return "high_pressure";
  return null;
}

// Future ML detection
async function detectAnomaly(data) {
  const anomaly = await mlModel.predict(data);
  return anomaly;
}
```

### 4. Predictive Analytics
**Current**: Static maintenance schedules
**Future**: AI-powered predictive maintenance

```javascript
// Current static maintenance
function getMaintenanceSchedule() {
  return {
    "PUMP_001": "2024-02-15",
    "PUMP_002": "2024-02-20"
  };
}

// Future AI predictions
async function getMaintenancePredictions() {
  const predictions = await ai.predictMaintenance();
  return predictions;
}
```

## Data Simulation

### Modbus Traffic Generation
- Realistic register read/write patterns
- Protocol-specific timing and formatting
- Error injection for testing
- Security event simulation

### Industrial Process Simulation
- Water treatment plant dynamics
- Nuclear power plant operations
- Electrical grid management
- Real-time sensor data generation

### Security Event Simulation
- Attack pattern injection
- Anomaly generation
- Threat intelligence feeds
- Response action simulation

## State Management

### Device States
- Real-time device status tracking
- Historical state changes
- Maintenance schedules
- Performance metrics

### Process Variables
- Continuous process monitoring
- Setpoint management
- Alarm conditions
- Control loop status

### Security Status
- Threat level assessment
- Active alerts tracking
- Response actions
- Forensic data collection

## Testing & Validation

### API Testing
```bash
# Test all endpoints
npm run test

# Load testing
npm run load-test

# Integration testing
npm run integration-test
```

### Data Validation
- Verify realistic industrial data
- Test anomaly injection
- Validate security events
- Check response times

## Deployment

### Development
```bash
npm run dev
# Server runs on http://localhost:3001
```

### Production
```bash
npm run build
npm start
# Server runs on configured port
```

### Docker
```bash
docker build -t ics-backend .
docker run -p 3001:3001 ics-backend
```

## Future AI Integration

### Phase 1: Query Processing
- Replace static responses with LLM
- Implement natural language understanding
- Add context-aware responses

### Phase 2: Command Validation
- AI-powered command analysis
- Safety validation
- Risk assessment

### Phase 3: Predictive Analytics
- Maintenance predictions
- Performance optimization
- Anomaly forecasting

### Phase 4: Autonomous Control
- AI-driven decision making
- Automated responses
- Self-optimizing systems

## Configuration Files

### Environment Variables
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ics_backend

# AI Integration (Future)
AI_MODEL_URL=http://localhost:8000
AI_API_KEY=your_api_key

# Security Configuration
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

### API Configuration
```json
{
  "rate_limit": {
    "window_ms": 900000,
    "max_requests": 100
  },
  "cors": {
    "origin": ["http://localhost:3000"],
    "credentials": true
  },
  "security": {
    "jwt_expiry": "24h",
    "bcrypt_rounds": 12
  }
}
```

This static backend provides a solid foundation for your AI integration while maintaining realistic industrial control system behavior! 🚀 