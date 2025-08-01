#!/usr/bin/env python3
"""
API Server for Real-Time AI Anomaly Detection
Bridges the ML model with the frontend dashboard and handles attack simulations
"""

import asyncio
import json
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import threading
import time
import random

from reconstruction_autoencoder import GridAnomalyDetector, ElectricalGridReconstructionAutoencoder

class SensorData(BaseModel):
    device_id: str
    sensor_name: str
    sensor_value: float
    nominal_value: float
    device_type: str
    voltage_level: str
    sensor_unit: str
    tolerance_percent: float
    criticality: str

class AttackSimulation(BaseModel):
    attackType: str
    targetDevice: str
    duration: int = 30

class DetectionResult(BaseModel):
    timestamp: str
    isAnomaly: bool
    anomalyScore: float
    reconstructionError: float
    threshold: float
    confidence: float
    threatLevel: str
    sensorData: Dict

class RealTimeDetectionServer:
    def __init__(self):
        self.app = FastAPI(title="AI Anomaly Detection Server")
        self.detector = GridAnomalyDetector()
        self.model_loaded = False
        self.active_connections: List[WebSocket] = []
        self.data_stream_active = False
        self.attack_simulation_active = False
        self.attack_data_queue = []
        
        # Statistics
        self.stats = {
            'total_samples': 0,
            'anomalies_detected': 0,
            'last_detection_time': None,
            'current_threat_level': 'NORMAL'
        }
        
        self.setup_cors()
        self.setup_routes()
        self.load_model()
        
    def setup_cors(self):
        """Setup CORS middleware for frontend integration."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, specify your frontend URL
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def load_model(self):
        """Load the trained ML model."""
        try:
            print("🔄 Loading trained AI anomaly detection model...")
            
            # Load the trained model components
            import joblib
            import torch
            
            self.detector.scaler = joblib.load('models/feature_scaler.pkl')
            self.detector.label_encoders = joblib.load('models/label_encoders.pkl')
            self.detector.feature_columns = joblib.load('models/feature_columns.pkl')
            self.detector.reconstruction_threshold = joblib.load('models/reconstruction_threshold.pkl')
            
            # Load PyTorch model
            input_dim = len(self.detector.feature_columns)
            self.detector.autoencoder = ElectricalGridReconstructionAutoencoder(input_dim).to(self.detector.device)
            self.detector.autoencoder.load_state_dict(torch.load('models/electrical_grid_autoencoder.pth'))
            self.detector.autoencoder.eval()
            
            self.model_loaded = True
            print("✅ AI model loaded successfully!")
            print(f"🎯 Reconstruction threshold: {self.detector.reconstruction_threshold:.6f}")
            
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            self.model_loaded = False
    
    def setup_routes(self):
        """Setup API routes."""
        
        @self.app.get("/health")
        async def health_check():
            return {
                "status": "healthy",
                "model_loaded": self.model_loaded,
                "timestamp": datetime.now().isoformat()
            }
        
        @self.app.get("/stats")
        async def get_stats():
            return {
                "total_samples_processed": self.stats['total_samples'],
                "anomalies_detected": self.stats['anomalies_detected'],
                "anomaly_rate": (self.stats['anomalies_detected'] / max(self.stats['total_samples'], 1)) * 100,
                "last_detection_time": self.stats['last_detection_time'],
                "current_threat_level": self.stats['current_threat_level'],
                "model_status": "ACTIVE" if self.model_loaded else "INACTIVE"
            }
        
        @self.app.post("/detect")
        async def detect_anomaly(sensor_data: SensorData):
            if not self.model_loaded:
                raise HTTPException(status_code=503, detail="Model not loaded")
            
            try:
                result = await self.process_detection(sensor_data.dict())
                return result
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/simulate-attack")
        async def simulate_attack(attack: AttackSimulation):
            """Start attack simulation that will be executed by external VM."""
            try:
                print(f"🚨 Starting attack simulation: {attack.attackType}")
                
                self.attack_simulation_active = True
                
                # Create attack script that VM can execute
                attack_script = self.generate_attack_script(attack)
                
                # Save attack script to a location accessible by VM
                with open('attack_simulation.py', 'w') as f:
                    f.write(attack_script)
                
                # Schedule attack to stop after duration
                threading.Timer(attack.duration, self.stop_attack_simulation).start()
                
                return {
                    "status": "started",
                    "attackType": attack.attackType,
                    "targetDevice": attack.targetDevice,
                    "duration": attack.duration,
                    "script_path": "attack_simulation.py"
                }
                
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.websocket("/ws/ai-detection")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            self.active_connections.append(websocket)
            
            try:
                while True:
                    # Keep connection alive and send periodic updates
                    await asyncio.sleep(1)
                    
            except WebSocketDisconnect:
                self.active_connections.remove(websocket)
    
    async def process_detection(self, sensor_data: Dict) -> DetectionResult:
        """Process sensor data through the AI model."""
        try:
            # Convert sensor data to DataFrame format expected by the model
            df = pd.DataFrame([{
                'timestamp': datetime.now(),
                'facility_type': 'electrical_grid',
                'device_id': sensor_data['device_id'],
                'device_type': sensor_data['device_type'],
                'sensor_name': sensor_data['sensor_name'],
                'sensor_value': sensor_data['sensor_value'],
                'sensor_unit': sensor_data['sensor_unit'],
                'voltage_level': sensor_data['voltage_level'],
                'nominal_value': sensor_data['nominal_value'],
                'tolerance_percent': sensor_data['tolerance_percent'],
                'criticality': sensor_data['criticality'],
                'is_anomaly': 0,
                'anomaly_type': None,
                'hour_of_day': datetime.now().hour,
                'day_of_week': datetime.now().weekday(),
                'day_of_year': datetime.now().timetuple().tm_yday,
                'operational_state': 'unknown'
            }])
            
            # Add time-series features (simplified for real-time)
            for window in [5, 10, 30]:
                df[f'rolling_mean_{window}'] = df['sensor_value']
                df[f'rolling_std_{window}'] = 0
            
            for lag in [1, 5, 10]:
                df[f'lag_{lag}'] = df['sensor_value']
            
            df['rate_of_change'] = 0
            df['deviation_from_nominal'] = abs(df['sensor_value'] - df['nominal_value']) / df['nominal_value']
            df['z_score'] = 0
            
            # Prepare features and get prediction
            X = self.detector.prepare_features(df)
            X_scaled = self.detector.scaler.transform(X)
            
            predictions, anomaly_scores, reconstruction_errors = self.detector.detect_anomalies(X_scaled)
            
            # Determine threat level
            is_anomaly = bool(predictions[0])
            anomaly_score = float(anomaly_scores[0])
            reconstruction_error = float(reconstruction_errors[0])
            
            if is_anomaly:
                error_ratio = reconstruction_error / self.detector.reconstruction_threshold
                if error_ratio > 10:
                    threat_level = 'CRITICAL'
                elif error_ratio > 5:
                    threat_level = 'HIGH'
                elif error_ratio > 2:
                    threat_level = 'MEDIUM'
                else:
                    threat_level = 'LOW'
            else:
                threat_level = 'NORMAL'
            
            # Update statistics
            self.stats['total_samples'] += 1
            if is_anomaly:
                self.stats['anomalies_detected'] += 1
                self.stats['last_detection_time'] = datetime.now().isoformat()
            self.stats['current_threat_level'] = threat_level
            
            result = DetectionResult(
                timestamp=datetime.now().isoformat(),
                isAnomaly=is_anomaly,
                anomalyScore=anomaly_score,
                reconstructionError=reconstruction_error,
                threshold=float(self.detector.reconstruction_threshold),
                confidence=min(anomaly_score, 10.0) / 10.0,
                threatLevel=threat_level,
                sensorData=sensor_data
            )
            
            # Broadcast to all connected WebSocket clients
            await self.broadcast_detection(result)
            
            return result
            
        except Exception as e:
            print(f"Detection error: {e}")
            raise
    
    async def broadcast_detection(self, result: DetectionResult):
        """Broadcast detection result to all connected WebSocket clients."""
        if self.active_connections:
            message = result.json()
            disconnected = []
            
            for connection in self.active_connections:
                try:
                    await connection.send_text(message)
                except:
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for connection in disconnected:
                self.active_connections.remove(connection)
    
    def generate_attack_script(self, attack: AttackSimulation) -> str:
        """Generate attack script that can be executed by external VM."""
        script = f'''#!/usr/bin/env python3
"""
Attack Simulation Script - {attack.attackType}
Generated for execution on external VM
"""

import requests
import time
import random
from datetime import datetime

def execute_attack():
    print("🚨 Starting {attack.attackType} on {attack.targetDevice}")
    
    # Attack parameters based on type
    attack_params = {{
        'voltage_sag_attack': {{'multiplier': 0.6, 'variation': 0.1}},
        'power_overload_attack': {{'multiplier': 2.5, 'variation': 0.3}},
        'frequency_attack': {{'base_freq': 58.5, 'variation': 1.0}},
        'zero_day_attack': {{'multiplier': 0.3, 'variation': 0.5}}
    }}
    
    params = attack_params.get('{attack.attackType}', {{'multiplier': 1.5, 'variation': 0.2}})
    
    # Simulate attack for {attack.duration} seconds
    end_time = time.time() + {attack.duration}
    
    while time.time() < end_time:
        try:
            # Generate malicious sensor data
            if '{attack.attackType}' == 'voltage_sag_attack':
                sensor_data = {{
                    'device_id': '{attack.targetDevice}',
                    'sensor_name': 'voltage',
                    'sensor_value': 345000 * params['multiplier'] * (1 + random.uniform(-params['variation'], params['variation'])),
                    'nominal_value': 345000,
                    'device_type': 'transmission_line',
                    'voltage_level': 'transmission',
                    'sensor_unit': 'V',
                    'tolerance_percent': 5.0,
                    'criticality': 'critical'
                }}
            elif '{attack.attackType}' == 'power_overload_attack':
                sensor_data = {{
                    'device_id': '{attack.targetDevice}',
                    'sensor_name': 'active_power',
                    'sensor_value': 400000 * params['multiplier'] * (1 + random.uniform(-params['variation'], params['variation'])),
                    'nominal_value': 400000,
                    'device_type': 'transmission_line',
                    'voltage_level': 'transmission',
                    'sensor_unit': 'kW',
                    'tolerance_percent': 30.0,
                    'criticality': 'critical'
                }}
            elif '{attack.attackType}' == 'frequency_attack':
                sensor_data = {{
                    'device_id': '{attack.targetDevice}',
                    'sensor_name': 'frequency',
                    'sensor_value': params['base_freq'] + random.uniform(-params['variation'], params['variation']),
                    'nominal_value': 60.0,
                    'device_type': 'transmission_line',
                    'voltage_level': 'transmission',
                    'sensor_unit': 'Hz',
                    'tolerance_percent': 0.1,
                    'criticality': 'critical'
                }}
            else:  # zero_day_attack
                sensor_data = {{
                    'device_id': '{attack.targetDevice}',
                    'sensor_name': 'voltage',
                    'sensor_value': 345000 * params['multiplier'] * (1 + random.uniform(-params['variation'], params['variation'])),
                    'nominal_value': 345000,
                    'device_type': 'transmission_line',
                    'voltage_level': 'transmission',
                    'sensor_unit': 'V',
                    'tolerance_percent': 5.0,
                    'criticality': 'critical'
                }}
            
            # Send attack data to detection API
            response = requests.post(
                'http://localhost:8000/detect',
                json=sensor_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"Attack data sent - Anomaly detected: {{result['isAnomaly']}}")
            else:
                print(f"Failed to send attack data: {{response.status_code}}")
            
            time.sleep(2)  # Send attack data every 2 seconds
            
        except Exception as e:
            print(f"Attack execution error: {{e}}")
            time.sleep(1)
    
    print("🏁 Attack simulation completed")

if __name__ == "__main__":
    execute_attack()
'''
        return script
    
    def stop_attack_simulation(self):
        """Stop the current attack simulation."""
        self.attack_simulation_active = False
        print("🛑 Attack simulation stopped")
    
    def start_data_stream(self):
        """Start streaming validation data through the model."""
        def stream_data():
            try:
                # Load validation data
                df = pd.read_csv('data/normal_electrical_grid_1m.csv')
                
                # Sample data for streaming
                sample_data = df.sample(n=min(1000, len(df))).reset_index(drop=True)
                
                self.data_stream_active = True
                
                for _, row in sample_data.iterrows():
                    if not self.data_stream_active:
                        break
                    
                    sensor_data = {
                        'device_id': row['device_id'],
                        'sensor_name': row['sensor_name'],
                        'sensor_value': row['sensor_value'],
                        'nominal_value': row['nominal_value'],
                        'device_type': row['device_type'],
                        'voltage_level': row['voltage_level'],
                        'sensor_unit': row['sensor_unit'],
                        'tolerance_percent': row['tolerance_percent'],
                        'criticality': row['criticality']
                    }
                    
                    # Process through model
                    asyncio.run(self.process_detection(sensor_data))
                    
                    time.sleep(1)  # 1 second between samples
                    
            except Exception as e:
                print(f"Data streaming error: {e}")
        
        # Start streaming in background thread
        threading.Thread(target=stream_data, daemon=True).start()
    
    def run(self, host="0.0.0.0", port=8000):
        """Run the API server."""
        print("🚀 Starting AI Anomaly Detection API Server")
        print("=" * 50)
        print(f"🌐 Server URL: http://{host}:{port}")
        print(f"🔗 Health Check: http://{host}:{port}/health")
        print(f"📊 Statistics: http://{host}:{port}/stats")
        print(f"🔌 WebSocket: ws://{host}:{port}/ws/ai-detection")
        print("")
        print("📡 Ready for frontend integration!")
        print("🎭 Ready for VM attack simulations!")
        
        # Start data streaming
        self.start_data_stream()
        
        uvicorn.run(self.app, host=host, port=port)

def main():
    server = RealTimeDetectionServer()
    server.run()

if __name__ == "__main__":
    main()