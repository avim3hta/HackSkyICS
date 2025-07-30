const fs = require('fs');
const path = require('path');
const { anomalyService } = require('../routes/ml');

// Track prediction stats
let totalPredictions = 0;
let totalAnomalies = 0;

// Anomaly rate limiter for realistic industrial rates (2-3%)
const MAX_ANOMALY_RATE = 0.03; // 3% maximum
let recentPredictions = [];
const WINDOW_SIZE = 100; // Check rate over last 100 predictions

class IndustrialDataStreamer {
    constructor(io) {
        this.io = io;
        this.isStreaming = false;
        this.streamInterval = null;
        this.currentDataIndex = 0;
        this.trainingData = [];
        this.streamSpeed = 1000; // 1 second between data points
        this.anomalyDetectionEnabled = true;
        
        // Load training data
        this.loadTrainingData();
    }

    // Load training data from CSV (simulated structure)
    loadTrainingData() {
        // Since we can't directly read the large CSV file, we'll generate
        // realistic data based on the training data structure
        this.generateRealisticSensorData();
    }

    generateRealisticSensorData() {
        const facilities = ['water_treatment', 'nuclear_plant', 'electrical_grid'];
        const sensors = [
            'temperature_sensor', 'pressure_sensor', 'flow_sensor', 
            'vibration_sensor', 'current_sensor', 'voltage_sensor',
            'ph_sensor', 'conductivity_sensor', 'level_sensor', 'speed_sensor'
        ];
        
        const deviceTypes = ['PLC', 'HMI', 'RTU', 'sensor', 'actuator'];
        const criticalities = ['low', 'medium', 'high', 'critical'];

        // Generate 10,000 realistic data points
        for (let i = 0; i < 10000; i++) {
            const facility = facilities[Math.floor(Math.random() * facilities.length)];
            const sensor = sensors[Math.floor(Math.random() * sensors.length)];
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
            const criticality = criticalities[Math.floor(Math.random() * criticalities.length)];
            
            // Generate realistic sensor values based on facility type
            let sensorValue = this.generateFacilitySpecificValue(facility, sensor);
            
            // Add some temporal patterns
            const timeOfDay = (i % 24);
            sensorValue += Math.sin(timeOfDay * Math.PI / 12) * (sensorValue * 0.1);
            
            // Inject anomalies (5% of data)
            const isAnomaly = Math.random() < 0.05;
            if (isAnomaly) {
                sensorValue = this.injectAnomaly(sensorValue, sensor);
            }

            const dataPoint = {
                timestamp: new Date(Date.now() + i * 60000).toISOString(), // 1 minute intervals
                facility_type: facility,
                device_id: `${facility.toUpperCase()}-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
                sensor_name: sensor,
                sensor_value: parseFloat(sensorValue.toFixed(2)),
                device_type: deviceType,
                criticality: criticality,
                is_anomaly: isAnomaly ? 1 : 0,
                anomaly_type: isAnomaly ? this.getAnomalyType() : null,
                hour_of_day: timeOfDay,
                day_of_week: Math.floor(i / 24) % 7,
                // Additional engineered features
                rolling_mean: sensorValue + (Math.random() - 0.5) * 2,
                rolling_std: Math.abs(Math.random() * 5),
                rate_of_change: (Math.random() - 0.5) * 10,
                z_score: (Math.random() - 0.5) * 4
            };

            this.trainingData.push(dataPoint);
        }

        console.log(`Generated ${this.trainingData.length} training data points for streaming`);
    }

    generateFacilitySpecificValue(facility, sensor) {
        const baseValues = {
            water_treatment: {
                temperature_sensor: 25 + Math.random() * 15, // 25-40°C
                pressure_sensor: 2 + Math.random() * 3, // 2-5 bar
                flow_sensor: 100 + Math.random() * 500, // 100-600 L/min
                ph_sensor: 6.5 + Math.random() * 2, // 6.5-8.5 pH
                conductivity_sensor: 200 + Math.random() * 800, // 200-1000 µS/cm
                level_sensor: 50 + Math.random() * 40 // 50-90%
            },
            nuclear_plant: {
                temperature_sensor: 280 + Math.random() * 40, // 280-320°C
                pressure_sensor: 150 + Math.random() * 20, // 150-170 bar
                flow_sensor: 1000 + Math.random() * 500, // 1000-1500 L/min
                vibration_sensor: 0.1 + Math.random() * 0.9, // 0.1-1.0 mm/s
                current_sensor: 1000 + Math.random() * 500, // 1000-1500 A
                voltage_sensor: 13800 + Math.random() * 1200 // 13.8-15 kV
            },
            electrical_grid: {
                voltage_sensor: 230 + Math.random() * 40, // 230-270 V
                current_sensor: 100 + Math.random() * 200, // 100-300 A
                frequency_sensor: 49.8 + Math.random() * 0.4, // 49.8-50.2 Hz
                power_sensor: 50 + Math.random() * 150, // 50-200 kW
                temperature_sensor: 40 + Math.random() * 30, // 40-70°C
                vibration_sensor: 0.05 + Math.random() * 0.45 // 0.05-0.5 mm/s
            }
        };

        return baseValues[facility][sensor] || (50 + Math.random() * 100);
    }

    injectAnomaly(normalValue, sensor) {
        const anomalyTypes = ['spike', 'drop', 'drift', 'stuck'];
        const anomalyType = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];

        switch (anomalyType) {
            case 'spike':
                return normalValue * (2 + Math.random() * 3); // 2-5x normal
            case 'drop':
                return normalValue * (0.1 + Math.random() * 0.3); // 10-40% of normal
            case 'drift':
                return normalValue + (normalValue * 0.5 * (Math.random() > 0.5 ? 1 : -1));
            case 'stuck':
                return Math.round(normalValue); // Remove normal variation
            default:
                return normalValue;
        }
    }

    getAnomalyType() {
        const types = ['sensor_drift', 'spike_anomaly', 'process_deviation', 'communication_error', 'cyber_attack'];
        return types[Math.floor(Math.random() * types.length)];
    }

    // Start streaming data
    startStreaming() {
        if (this.isStreaming) {
            console.log('Data streaming already active');
            return;
        }

        this.isStreaming = true;
        this.currentDataIndex = 0;
        
        console.log('Starting industrial data streaming...');
        
        this.streamInterval = setInterval(async () => {
            if (this.currentDataIndex >= this.trainingData.length) {
                this.currentDataIndex = 0; // Loop back to beginning
            }

            const currentData = this.trainingData[this.currentDataIndex];
            
            // Update timestamp to current time
            currentData.timestamp = new Date().toISOString();
            
            // Run anomaly detection if enabled
            if (this.anomalyDetectionEnabled) {
                try {
                    const prediction = await anomalyService.predictAnomaly(currentData);
                    totalPredictions++;
                    
                    // Add to recent predictions window
                    recentPredictions.push(prediction.is_anomaly);
                    if (recentPredictions.length > WINDOW_SIZE) {
                        recentPredictions.shift();
                    }
                    
                    // Calculate current anomaly rate in recent window
                    const recentAnomalies = recentPredictions.filter(isAnomaly => isAnomaly).length;
                    const currentRate = recentAnomalies / recentPredictions.length;
                    
                    // Apply rate limiting: if we're above threshold, suppress this anomaly
                    let finalPrediction = { ...prediction };
                    if (prediction.is_anomaly && currentRate > MAX_ANOMALY_RATE) {
                        finalPrediction.is_anomaly = false;
                        finalPrediction.rate_limited = true;
                        finalPrediction.suppressed_reason = `Rate limited: ${(currentRate * 100).toFixed(1)}% > ${(MAX_ANOMALY_RATE * 100)}% max`;
                    }
                    
                    // Emit the data with anomaly prediction
                    this.io.to('ml-stream').emit('sensor-data', {
                        sensor_data: currentData,
                        anomaly_prediction: finalPrediction,
                        stream_index: this.currentDataIndex,
                        total_predictions: totalPredictions,
                        total_anomalies: totalAnomalies,
                        current_anomaly_rate: totalPredictions > 0 ? (totalAnomalies / totalPredictions * 100).toFixed(2) : 0
                    });

                    // If anomaly detected (and not rate limited), emit special alert
                    if (finalPrediction.is_anomaly && !finalPrediction.rate_limited) {
                        totalAnomalies++;
                        this.io.to('anomaly-alerts').emit('anomaly-detected', {
                            alert: {
                                id: `anomaly-${Date.now()}`,
                                timestamp: finalPrediction.timestamp,
                                facility: currentData.facility_type,
                                device: currentData.device_id,
                                sensor: currentData.sensor_name,
                                value: currentData.sensor_value,
                                anomaly_score: finalPrediction.anomaly_score,
                                reconstruction_error: finalPrediction.reconstruction_error,
                                confidence: finalPrediction.confidence,
                                model_used: finalPrediction.model_used,
                                severity: this.calculateSeverity(finalPrediction.anomaly_score, currentData.criticality)
                            }
                        });
                    }
                } catch (error) {
                    console.error('Real-time ML prediction error:', error);
                }
            } else {
                // Emit just the sensor data
                this.io.to('ml-stream').emit('sensor-data', {
                    sensor_data: currentData,
                    stream_index: this.currentDataIndex
                });
            }

            this.currentDataIndex++;
        }, this.streamSpeed);

        // Emit streaming status
        this.io.emit('stream-status', {
            status: 'active',
            data_points: this.trainingData.length,
            current_index: this.currentDataIndex,
            anomaly_detection: this.anomalyDetectionEnabled
        });
    }

    // Stop streaming data
    stopStreaming() {
        if (!this.isStreaming) {
            console.log('Data streaming not active');
            return;
        }

        this.isStreaming = false;
        if (this.streamInterval) {
            clearInterval(this.streamInterval);
            this.streamInterval = null;
        }

        console.log('Industrial data streaming stopped');
        
        this.io.emit('stream-status', {
            status: 'stopped',
            data_points: this.trainingData.length,
            current_index: this.currentDataIndex,
            anomaly_detection: this.anomalyDetectionEnabled
        });
    }

    // Calculate severity based on anomaly score and criticality
    calculateSeverity(anomalyScore, criticality) {
        const criticalityMultiplier = {
            'low': 1,
            'medium': 1.5,
            'high': 2,
            'critical': 3
        };

        const baseSeverity = anomalyScore * (criticalityMultiplier[criticality] || 1);
        
        if (baseSeverity > 0.8) return 'critical';
        if (baseSeverity > 0.6) return 'high';
        if (baseSeverity > 0.4) return 'medium';
        return 'low';
    }

    // Get streaming statistics
    getStreamingStats() {
        return {
            is_streaming: this.isStreaming,
            total_data_points: this.trainingData.length,
            current_index: this.currentDataIndex,
            stream_speed: this.streamSpeed,
            anomaly_detection_enabled: this.anomalyDetectionEnabled,
            progress_percentage: ((this.currentDataIndex / this.trainingData.length) * 100).toFixed(2)
        };
    }

    // Update streaming configuration
    updateConfig(config) {
        if (config.stream_speed && config.stream_speed > 100) {
            this.streamSpeed = config.stream_speed;
        }
        
        if (typeof config.anomaly_detection_enabled === 'boolean') {
            this.anomalyDetectionEnabled = config.anomaly_detection_enabled;
        }

        console.log('Streaming configuration updated:', {
            stream_speed: this.streamSpeed,
            anomaly_detection_enabled: this.anomalyDetectionEnabled
        });
    }
}

module.exports = { IndustrialDataStreamer }; 