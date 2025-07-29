const express = require('express');
const router = express.Router();

// Mock ML model integration - will be replaced with actual model loading
class AnomalyDetectionService {
    constructor() {
        this.isModelLoaded = false;
        this.modelMetrics = {
            accuracy: 0.9242,
            precision: 0.2423,
            recall: 0.2423,
            f1_score: 0.2423,
            last_updated: new Date().toISOString()
        };
        this.anomalyThreshold = 0.5;
        this.detectionHistory = [];
    }

    // Simulate model prediction
    predictAnomaly(sensorData) {
        // Simulate anomaly detection logic
        const anomalyScore = Math.random();
        const isAnomaly = anomalyScore > this.anomalyThreshold;
        
        const prediction = {
            timestamp: new Date().toISOString(),
            sensor_data: sensorData,
            anomaly_score: anomalyScore,
            is_anomaly: isAnomaly,
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            model_used: 'autoencoder_ensemble',
            facility_type: sensorData.facility_type || 'unknown',
            device_id: sensorData.device_id || 'unknown'
        };

        // Store in history (keep last 1000 predictions)
        this.detectionHistory.push(prediction);
        if (this.detectionHistory.length > 1000) {
            this.detectionHistory.shift();
        }

        return prediction;
    }

    // Get recent anomalies
    getRecentAnomalies(limit = 50) {
        return this.detectionHistory
            .filter(pred => pred.is_anomaly)
            .slice(-limit)
            .reverse();
    }

    // Get model statistics
    getModelStats() {
        const totalPredictions = this.detectionHistory.length;
        const anomalies = this.detectionHistory.filter(pred => pred.is_anomaly).length;
        const anomalyRate = totalPredictions > 0 ? (anomalies / totalPredictions) * 100 : 0;

        return {
            ...this.modelMetrics,
            total_predictions: totalPredictions,
            detected_anomalies: anomalies,
            current_anomaly_rate: anomalyRate.toFixed(2),
            model_status: this.isModelLoaded ? 'active' : 'loading',
            last_prediction: this.detectionHistory.length > 0 ? 
                this.detectionHistory[this.detectionHistory.length - 1].timestamp : null
        };
    }

    // Batch process sensor data
    batchPredict(sensorDataArray) {
        return sensorDataArray.map(data => this.predictAnomaly(data));
    }
}

// Initialize the anomaly detection service
const anomalyService = new AnomalyDetectionService();

// Routes

// POST /api/ml/predict - Single prediction
router.post('/predict', (req, res) => {
    try {
        const sensorData = req.body;
        
        if (!sensorData || typeof sensorData !== 'object') {
            return res.status(400).json({
                error: 'Invalid sensor data',
                message: 'Sensor data must be a valid object'
            });
        }

        const prediction = anomalyService.predictAnomaly(sensorData);
        
        res.json({
            success: true,
            prediction,
            message: 'Anomaly detection completed'
        });
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            error: 'Prediction failed',
            message: error.message
        });
    }
});

// POST /api/ml/batch-predict - Batch predictions
router.post('/batch-predict', (req, res) => {
    try {
        const { sensor_data } = req.body;
        
        if (!Array.isArray(sensor_data)) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'sensor_data must be an array'
            });
        }

        const predictions = anomalyService.batchPredict(sensor_data);
        
        res.json({
            success: true,
            predictions,
            count: predictions.length,
            anomalies_detected: predictions.filter(p => p.is_anomaly).length
        });
    } catch (error) {
        console.error('Batch prediction error:', error);
        res.status(500).json({
            error: 'Batch prediction failed',
            message: error.message
        });
    }
});

// GET /api/ml/anomalies - Get recent anomalies
router.get('/anomalies', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const facility = req.query.facility;
        
        let anomalies = anomalyService.getRecentAnomalies(limit);
        
        // Filter by facility if specified
        if (facility) {
            anomalies = anomalies.filter(a => a.facility_type === facility);
        }
        
        res.json({
            success: true,
            anomalies,
            count: anomalies.length,
            filters: { facility, limit }
        });
    } catch (error) {
        console.error('Get anomalies error:', error);
        res.status(500).json({
            error: 'Failed to retrieve anomalies',
            message: error.message
        });
    }
});

// GET /api/ml/stats - Get model statistics
router.get('/stats', (req, res) => {
    try {
        const stats = anomalyService.getModelStats();
        
        res.json({
            success: true,
            model_stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve model statistics',
            message: error.message
        });
    }
});

// GET /api/ml/health - Model health check
router.get('/health', (req, res) => {
    try {
        const health = {
            status: 'healthy',
            model_loaded: anomalyService.isModelLoaded,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            last_prediction: anomalyService.detectionHistory.length > 0 ? 
                anomalyService.detectionHistory[anomalyService.detectionHistory.length - 1].timestamp : null,
            total_predictions: anomalyService.detectionHistory.length
        };
        
        res.json({
            success: true,
            health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            error: 'Health check failed',
            message: error.message
        });
    }
});

// PUT /api/ml/threshold - Update anomaly threshold
router.put('/threshold', (req, res) => {
    try {
        const { threshold } = req.body;
        
        if (typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
            return res.status(400).json({
                error: 'Invalid threshold',
                message: 'Threshold must be a number between 0 and 1'
            });
        }
        
        const oldThreshold = anomalyService.anomalyThreshold;
        anomalyService.anomalyThreshold = threshold;
        
        res.json({
            success: true,
            message: 'Anomaly threshold updated',
            old_threshold: oldThreshold,
            new_threshold: threshold
        });
    } catch (error) {
        console.error('Update threshold error:', error);
        res.status(500).json({
            error: 'Failed to update threshold',
            message: error.message
        });
    }
});

// POST /api/ml/stream/start - Start data streaming
router.post('/stream/start', (req, res) => {
    try {
        const { dataStreamer } = req.app.locals;
        
        if (!dataStreamer) {
            return res.status(500).json({
                error: 'Data streamer not initialized',
                message: 'Data streaming service is not available'
            });
        }

        dataStreamer.startStreaming();
        
        res.json({
            success: true,
            message: 'Data streaming started',
            stats: dataStreamer.getStreamingStats()
        });
    } catch (error) {
        console.error('Start streaming error:', error);
        res.status(500).json({
            error: 'Failed to start streaming',
            message: error.message
        });
    }
});

// POST /api/ml/stream/stop - Stop data streaming
router.post('/stream/stop', (req, res) => {
    try {
        const { dataStreamer } = req.app.locals;
        
        if (!dataStreamer) {
            return res.status(500).json({
                error: 'Data streamer not initialized',
                message: 'Data streaming service is not available'
            });
        }

        dataStreamer.stopStreaming();
        
        res.json({
            success: true,
            message: 'Data streaming stopped',
            stats: dataStreamer.getStreamingStats()
        });
    } catch (error) {
        console.error('Stop streaming error:', error);
        res.status(500).json({
            error: 'Failed to stop streaming',
            message: error.message
        });
    }
});

// GET /api/ml/stream/status - Get streaming status
router.get('/stream/status', (req, res) => {
    try {
        const { dataStreamer } = req.app.locals;
        
        if (!dataStreamer) {
            return res.status(500).json({
                error: 'Data streamer not initialized',
                message: 'Data streaming service is not available'
            });
        }

        const stats = dataStreamer.getStreamingStats();
        
        res.json({
            success: true,
            streaming_status: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get streaming status error:', error);
        res.status(500).json({
            error: 'Failed to get streaming status',
            message: error.message
        });
    }
});

// PUT /api/ml/stream/config - Update streaming configuration
router.put('/stream/config', (req, res) => {
    try {
        const { dataStreamer } = req.app.locals;
        
        if (!dataStreamer) {
            return res.status(500).json({
                error: 'Data streamer not initialized',
                message: 'Data streaming service is not available'
            });
        }

        const config = req.body;
        dataStreamer.updateConfig(config);
        
        res.json({
            success: true,
            message: 'Streaming configuration updated',
            current_config: dataStreamer.getStreamingStats()
        });
    } catch (error) {
        console.error('Update streaming config error:', error);
        res.status(500).json({
            error: 'Failed to update streaming configuration',
            message: error.message
        });
    }
});

// Export the service for use in other modules
module.exports = { router, anomalyService }; 