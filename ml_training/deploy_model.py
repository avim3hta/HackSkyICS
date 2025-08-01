#!/usr/bin/env python3
"""
Real-Time Electrical Grid Anomaly Detection Deployment
Deploys the trained reconstruction autoencoder for live monitoring
"""

import pandas as pd
import numpy as np
import torch
import joblib
from flask import Flask, request, jsonify
import json
from datetime import datetime
import threading
import time
from reconstruction_autoencoder import GridAnomalyDetector, ElectricalGridReconstructionAutoencoder
import warnings
warnings.filterwarnings('ignore')

class RealTimeAnomalyDetector:
    """Real-time anomaly detection system for electrical grid."""
    
    def __init__(self):
        self.detector = GridAnomalyDetector()
        self.is_loaded = False
        self.detection_stats = {
            'total_samples': 0,
            'anomalies_detected': 0,
            'last_detection_time': None,
            'current_threat_level': 'LOW'
        }
        
    def load_model(self):
        """Load the trained model for deployment."""
        print("🚀 Loading Electrical Grid Anomaly Detection System")
        print("===================================================")
        
        try:
            # Load preprocessing components
            self.detector.scaler = joblib.load('models/feature_scaler.pkl')
            self.detector.label_encoders = joblib.load('models/label_encoders.pkl')
            self.detector.feature_columns = joblib.load('models/feature_columns.pkl')
            self.detector.reconstruction_threshold = joblib.load('models/reconstruction_threshold.pkl')
            
            # Load PyTorch model
            input_dim = len(self.detector.feature_columns)
            self.detector.autoencoder = ElectricalGridReconstructionAutoencoder(input_dim).to(self.detector.device)
            self.detector.autoencoder.load_state_dict(torch.load('models/electrical_grid_autoencoder.pth'))
            self.detector.autoencoder.eval()
            
            self.is_loaded = True
            
            print(f"✅ Model loaded successfully!")
            print(f"🔥 Using device: {self.detector.device}")
            print(f"🎯 Reconstruction threshold: {self.detector.reconstruction_threshold:.6f}")
            print(f"📊 Input features: {len(self.detector.feature_columns)}")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.is_loaded = False
    
    def detect_anomaly(self, sensor_data):
        """Detect anomaly in real-time sensor data."""
        if not self.is_loaded:
            return {'error': 'Model not loaded'}
        
        try:
            # Convert sensor data to DataFrame format expected by the model
            df = pd.DataFrame([sensor_data])
            
            # Add required columns if missing
            required_cols = ['timestamp', 'facility_type', 'device_id', 'device_type', 
                           'sensor_name', 'sensor_value', 'sensor_unit', 'voltage_level',
                           'nominal_value', 'tolerance_percent', 'criticality', 'is_anomaly',
                           'anomaly_type', 'hour_of_day', 'day_of_week', 'day_of_year',
                           'operational_state']
            
            for col in required_cols:
                if col not in df.columns:
                    if col == 'timestamp':
                        df[col] = datetime.now()
                    elif col == 'facility_type':
                        df[col] = 'electrical_grid'
                    elif col == 'is_anomaly':
                        df[col] = 0  # Unknown, to be determined
                    elif col == 'anomaly_type':
                        df[col] = None
                    elif col == 'operational_state':
                        df[col] = 'unknown'
                    elif col == 'hour_of_day':
                        df[col] = datetime.now().hour
                    elif col == 'day_of_week':
                        df[col] = datetime.now().weekday()
                    elif col == 'day_of_year':
                        df[col] = datetime.now().timetuple().tm_yday
                    else:
                        df[col] = 0  # Default value
            
            # Add time-series features (simplified for real-time)
            for window in [5, 10, 30]:
                df[f'rolling_mean_{window}'] = df['sensor_value']  # Use current value as approximation
                df[f'rolling_std_{window}'] = 0  # No historical data for std
            
            for lag in [1, 5, 10]:
                df[f'lag_{lag}'] = df['sensor_value']  # Use current value as approximation
            
            df['rate_of_change'] = 0  # No previous value to compare
            df['deviation_from_nominal'] = abs(df['sensor_value'] - df['nominal_value']) / df['nominal_value']
            df['z_score'] = 0  # No rolling stats for z-score
            
            # Prepare features
            X = self.detector.prepare_features(df)
            X_scaled = self.detector.scaler.transform(X)
            
            # Get prediction
            predictions, anomaly_scores, reconstruction_errors = self.detector.detect_anomalies(X_scaled)
            
            # Update statistics
            self.detection_stats['total_samples'] += 1
            is_anomaly = bool(predictions[0])
            
            if is_anomaly:
                self.detection_stats['anomalies_detected'] += 1
                self.detection_stats['last_detection_time'] = datetime.now().isoformat()
                
                # Determine threat level based on reconstruction error
                error_ratio = reconstruction_errors[0] / self.detector.reconstruction_threshold
                if error_ratio > 10:
                    threat_level = 'CRITICAL'
                elif error_ratio > 5:
                    threat_level = 'HIGH'
                elif error_ratio > 2:
                    threat_level = 'MEDIUM'
                else:
                    threat_level = 'LOW'
                
                self.detection_stats['current_threat_level'] = threat_level
            
            result = {
                'timestamp': datetime.now().isoformat(),
                'is_anomaly': is_anomaly,
                'anomaly_score': float(anomaly_scores[0]),
                'reconstruction_error': float(reconstruction_errors[0]),
                'threshold': float(self.detector.reconstruction_threshold),
                'confidence': float(min(anomaly_scores[0], 10.0) / 10.0),  # Cap at 10x threshold
                'threat_level': self.detection_stats['current_threat_level'] if is_anomaly else 'NORMAL',
                'sensor_data': sensor_data
            }
            
            return result
            
        except Exception as e:
            return {'error': f'Detection failed: {str(e)}'}
    
    def get_stats(self):
        """Get detection statistics."""
        total = self.detection_stats['total_samples']
        anomalies = self.detection_stats['anomalies_detected']
        
        return {
            'total_samples_processed': total,
            'anomalies_detected': anomalies,
            'anomaly_rate': (anomalies / total * 100) if total > 0 else 0,
            'last_detection_time': self.detection_stats['last_detection_time'],
            'current_threat_level': self.detection_stats['current_threat_level'],
            'model_status': 'ACTIVE' if self.is_loaded else 'INACTIVE'
        }

# Global detector instance
detector = RealTimeAnomalyDetector()

# Flask API for real-time detection
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector.is_loaded,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/detect', methods=['POST'])
def detect_anomaly():
    """Real-time anomaly detection endpoint."""
    try:
        sensor_data = request.json
        
        if not sensor_data:
            return jsonify({'error': 'No sensor data provided'}), 400
        
        result = detector.detect_anomaly(sensor_data)
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get detection statistics."""
    return jsonify(detector.get_stats())

@app.route('/demo', methods=['GET'])
def demo_page():
    """Demo page showing real-time detection."""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Electrical Grid Anomaly Detection Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
            .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
            .normal { background: #d4edda; color: #155724; }
            .anomaly { background: #f8d7da; color: #721c24; }
            .critical { background: #d1ecf1; color: #0c5460; }
            button { padding: 10px 20px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
            .btn-normal { background: #28a745; color: white; }
            .btn-attack { background: #dc3545; color: white; }
            input { padding: 8px; margin: 5px; border: 1px solid #ccc; border-radius: 3px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ Electrical Grid Anomaly Detection</h1>
            <h2>Real-Time Zero-Day Attack Detection</h2>
            
            <div id="status" class="status normal">
                <strong>System Status:</strong> <span id="system-status">NORMAL</span>
            </div>
            
            <h3>Test Detection:</h3>
            <div>
                <input type="text" id="device-id" placeholder="Device ID" value="TEST_DEVICE_001">
                <input type="text" id="sensor-name" placeholder="Sensor Name" value="voltage">
                <input type="number" id="sensor-value" placeholder="Sensor Value" value="345000">
                <input type="number" id="nominal-value" placeholder="Nominal Value" value="345000">
                <br><br>
                <button class="btn-normal" onclick="testNormal()">Test Normal Data</button>
                <button class="btn-attack" onclick="testAttack()">Test Attack Data</button>
            </div>
            
            <div id="results" style="margin-top: 20px;"></div>
            
            <h3>Detection Statistics:</h3>
            <div id="stats"></div>
        </div>
        
        <script>
            function testNormal() {
                const data = {
                    device_id: document.getElementById('device-id').value,
                    sensor_name: document.getElementById('sensor-name').value,
                    sensor_value: parseFloat(document.getElementById('sensor-value').value),
                    nominal_value: parseFloat(document.getElementById('nominal-value').value),
                    device_type: 'transmission_line',
                    voltage_level: 'transmission',
                    sensor_unit: 'V',
                    tolerance_percent: 5.0,
                    criticality: 'critical'
                };
                
                sendDetectionRequest(data);
            }
            
            function testAttack() {
                const data = {
                    device_id: document.getElementById('device-id').value,
                    sensor_name: document.getElementById('sensor-name').value,
                    sensor_value: parseFloat(document.getElementById('sensor-value').value) * 0.3, // Voltage sag attack
                    nominal_value: parseFloat(document.getElementById('nominal-value').value),
                    device_type: 'transmission_line',
                    voltage_level: 'transmission',
                    sensor_unit: 'V',
                    tolerance_percent: 5.0,
                    criticality: 'critical'
                };
                
                sendDetectionRequest(data);
            }
            
            function sendDetectionRequest(data) {
                fetch('/detect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(result => {
                    displayResult(result);
                    updateStats();
                })
                .catch(error => {
                    document.getElementById('results').innerHTML = '<div class="status anomaly">Error: ' + error + '</div>';
                });
            }
            
            function displayResult(result) {
                const resultsDiv = document.getElementById('results');
                const statusDiv = document.getElementById('status');
                const systemStatus = document.getElementById('system-status');
                
                if (result.is_anomaly) {
                    resultsDiv.innerHTML = `
                        <div class="status anomaly">
                            <strong>🚨 ANOMALY DETECTED!</strong><br>
                            Threat Level: <strong>${result.threat_level}</strong><br>
                            Confidence: ${(result.confidence * 100).toFixed(1)}%<br>
                            Reconstruction Error: ${result.reconstruction_error.toFixed(6)}<br>
                            Threshold: ${result.threshold.toFixed(6)}
                        </div>
                    `;
                    statusDiv.className = 'status anomaly';
                    systemStatus.textContent = result.threat_level + ' THREAT';
                } else {
                    resultsDiv.innerHTML = `
                        <div class="status normal">
                            <strong>✅ Normal Operation</strong><br>
                            Reconstruction Error: ${result.reconstruction_error.toFixed(6)}<br>
                            Threshold: ${result.threshold.toFixed(6)}
                        </div>
                    `;
                    statusDiv.className = 'status normal';
                    systemStatus.textContent = 'NORMAL';
                }
            }
            
            function updateStats() {
                fetch('/stats')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('stats').innerHTML = `
                        <p><strong>Total Samples:</strong> ${stats.total_samples_processed}</p>
                        <p><strong>Anomalies Detected:</strong> ${stats.anomalies_detected}</p>
                        <p><strong>Detection Rate:</strong> ${stats.anomaly_rate.toFixed(2)}%</p>
                        <p><strong>Model Status:</strong> ${stats.model_status}</p>
                    `;
                });
            }
            
            // Update stats on page load
            updateStats();
        </script>
    </body>
    </html>
    '''

def main():
    """Deploy the anomaly detection system."""
    print("🚀 Deploying Electrical Grid Anomaly Detection System")
    print("=====================================================")
    
    # Load the trained model
    detector.load_model()
    
    if not detector.is_loaded:
        print("❌ Failed to load model. Cannot deploy.")
        return
    
    print("\n🌐 Starting REST API server...")
    print("📊 Available endpoints:")
    print("   GET  /health  - Health check")
    print("   POST /detect  - Real-time anomaly detection")
    print("   GET  /stats   - Detection statistics")
    print("   GET  /demo    - Interactive demo page")
    print("")
    print("🎭 Demo URL: http://localhost:5000/demo")
    print("🛡️ Ready for hackathon demonstration!")
    
    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    main()