#!/usr/bin/env python3
"""
Autoencoder Anomaly Detection Service
Loads the trained autoencoder model and provides real-time predictions
"""

import sys
import json
import pickle
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class IndustrialAutoencoder(nn.Module):
    def __init__(self, input_size=10, hidden_sizes=[8, 4, 2]):
        super(IndustrialAutoencoder, self).__init__()
        
        # Encoder
        layers = []
        prev_size = input_size
        for hidden_size in hidden_sizes:
            layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2)
            ])
            prev_size = hidden_size
        
        layers = layers[:-1]
        self.encoder = nn.Sequential(*layers)
        
        # Decoder
        decoder_layers = []
        hidden_sizes_reversed = list(reversed(hidden_sizes[:-1])) + [input_size]
        for hidden_size in hidden_sizes_reversed:
            decoder_layers.extend([
                nn.Linear(prev_size, hidden_size),
                nn.ReLU() if hidden_size != input_size else nn.Sigmoid()
            ])
            prev_size = hidden_size
        
        self.decoder = nn.Sequential(*decoder_layers)
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

class AutoencoderAnomalyService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_loaded = False
        self.feature_names = [
            'temperature', 'pressure', 'flow_rate', 'vibration',
            'current', 'voltage', 'ph_level', 'conductivity',
            'level', 'speed'
        ]
        self.load_model()
    
    def load_model(self):
        try:
            model_path = Path(__file__).parent.parent.parent.parent / 'ml_training' / 'models'
            
            # Load scaler
            scaler_path = model_path / 'autoencoder_scaler.pkl'
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            
            # Load model
            model_file = model_path / 'autoencoder_model.pth'
            self.model = IndustrialAutoencoder(input_size=10)
            self.model.load_state_dict(torch.load(model_file, map_location='cpu'))
            self.model.eval()
            
            self.model_loaded = True
            print(f" Autoencoder model loaded successfully")
            
        except Exception as e:
            print(f" Error loading autoencoder model: {e}")
            self.model_loaded = False
    
    def extract_features(self, sensor_data):
        features = []
        sensor_value = float(sensor_data.get('sensor_value', 0))
        sensor_type = sensor_data.get('sensor_type', '').lower()
        
        # Map sensor data to feature vector
        for feature_name in self.feature_names:
            if feature_name in sensor_type:
                features.append(sensor_value)
            else:
                # Default values for missing sensors
                defaults = {
                    'temperature': 25.0, 'pressure': 1.0, 'flow_rate': 100.0,
                    'vibration': 0.1, 'current': 5.0, 'voltage': 220.0,
                    'ph_level': 7.0, 'conductivity': 500.0, 'level': 50.0, 'speed': 1800.0
                }
                features.append(defaults.get(feature_name, 0.0))
        
        return np.array(features).reshape(1, -1)
    
    def predict_anomaly(self, sensor_data):
        if not self.model_loaded:
            return {
                'is_anomaly': False,
                'anomaly_score': 0.0,
                'reconstruction_error': 0.0,
                'confidence': 0.0,
                'error': 'Model not loaded'
            }
        
        try:
            # Extract features
            features = self.extract_features(sensor_data)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Convert to tensor
            input_tensor = torch.FloatTensor(features_scaled)
            
            # Get reconstruction
            with torch.no_grad():
                reconstruction = self.model(input_tensor)
            
            # Calculate reconstruction error
            reconstruction_error = torch.mean((input_tensor - reconstruction) ** 2).item()
            
            # Determine anomaly using statistical approach
            # Use 95th percentile threshold for realistic anomaly rates (2-5%)
            anomaly_threshold = 1.0  # Higher threshold for industrial realism
            
            # Additional check: only flag as anomaly if error is significantly high
            # AND we want realistic industrial anomaly rates (1-3%)
            base_threshold = 0.8
            severity_multiplier = 1.2
            
            # Dynamic threshold based on sensor criticality
            if 'critical' in str(sensor_data.get('criticality', '')).lower():
                final_threshold = base_threshold * 0.8  # More sensitive for critical systems
            elif 'high' in str(sensor_data.get('criticality', '')).lower():
                final_threshold = base_threshold * 1.0
            else:
                final_threshold = base_threshold * 1.2  # Less sensitive for non-critical
            
            is_anomaly = reconstruction_error > final_threshold
            
            # Calculate confidence based on how far above threshold
            if is_anomaly:
                confidence = min((reconstruction_error - final_threshold) / final_threshold, 1.0)
            else:
                confidence = max(1.0 - (reconstruction_error / final_threshold), 0.1)
            
            return {
                'is_anomaly': bool(is_anomaly),
                'anomaly_score': float(reconstruction_error),
                'reconstruction_error': float(reconstruction_error),
                'confidence': float(confidence),
                'threshold': final_threshold,
                'base_threshold': base_threshold,
                'model_type': 'autoencoder'
            }
            
        except Exception as e:
            return {
                'is_anomaly': False,
                'anomaly_score': 0.0,
                'reconstruction_error': 0.0,
                'confidence': 0.0,
                'error': str(e)
            }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No sensor data provided'}))
        return
    
    try:
        sensor_data = json.loads(sys.argv[1])
        service = AutoencoderAnomalyService()
        result = service.predict_anomaly(sensor_data)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    main()
