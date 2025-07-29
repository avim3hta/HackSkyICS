const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const { router: scadaRoutes, initializeEngine: initScadaEngine } = require('./routes/scada');
const { router: securityRoutes, initializeEngine: initSecurityEngine } = require('./routes/security');
const aiRoutes = require('./routes/ai');
const { router: mlRoutes, anomalyService } = require('./routes/ml');

// Import middleware
const { loggerMiddleware } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Import simulation engine
const { SimulationEngine } = require('./simulation/engine');
const { IndustrialDataStreamer } = require('./services/dataStreamer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "https://sudowinics.netlify.app",
      "https://*.netlify.app",
      process.env.CORS_ORIGIN,
      "https://hackskyics.onrender.com"
    ].filter(Boolean),
    methods: ["GET", "POST"]
  }
});

// Initialize simulation engine
const simulationEngine = new SimulationEngine(io);

// Initialize data streamer for ML integration
const dataStreamer = new IndustrialDataStreamer(io);
app.locals.dataStreamer = dataStreamer;

// Initialize route engines
initScadaEngine(simulationEngine);
initSecurityEngine(simulationEngine);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://sudowinics.netlify.app",
    "https://*.netlify.app",
    process.env.CORS_ORIGIN,
    "https://hackskyics.onrender.com"
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(loggerMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/scada', scadaRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ml', mlRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join specific rooms for different data streams
  socket.on('join-scada', () => {
    socket.join('scada-updates');
  });
  
  socket.on('join-security', () => {
    socket.join('security-alerts');
  });
  
  socket.on('join-ml-stream', () => {
    socket.join('ml-stream');
  });
  
  socket.on('join-anomaly-alerts', () => {
    socket.join('anomaly-alerts');
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start simulation engine
simulationEngine.start();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 ICS Static Backend running on port ${PORT}`);
  console.log(`📊 SCADA API: http://localhost:${PORT}/api/scada`);
  console.log(`🛡️ Security API: http://localhost:${PORT}/api/security`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  simulationEngine.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  simulationEngine.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io }; 