#!/usr/bin/env python3
"""
Send pure normal data to test the system
This will send data that should definitely be classified as NORMAL
"""

import requests
import time
import random

def send_normal_data():
    """Send normal electrical grid data."""
    url = "http://localhost:8000/api/detect"
    
    # Very normal electrical grid readings
    normal_samples = [
        {
            "device_id": "GENERATOR_UNIT_001",
            "sensor_name": "voltage",
            "sensor_value": 22000.0,  # Exactly nominal
            "nominal_value": 22000.0,
            "device_type": "generator",
            "voltage_level": "generation",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "normal"
        },
        {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "voltage",
            "sensor_value": 345000.0,  # Exactly nominal
            "nominal_value": 345000.0,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "normal"
        },
        {
            "device_id": "GENERATOR_UNIT_001",
            "sensor_name": "current",
            "sensor_value": 900.0,  # Normal current
            "nominal_value": 900.0,
            "device_type": "generator",
            "voltage_level": "generation",
            "sensor_unit": "A",
            "tolerance_percent": 10.0,
            "criticality": "normal"
        }
    ]
    
    print("🟢 Sending normal data samples...")
    
    for i in range(10):  # Send 10 normal samples
        sample = random.choice(normal_samples)
        # Add tiny variation (±0.1%) to make it realistic
        sample["sensor_value"] = sample["nominal_value"] * (1 + random.uniform(-0.001, 0.001))
        
        try:
            response = requests.post(url, json=sample)
            if response.status_code == 200:
                result = response.json()
                status = "🟢 NORMAL" if result['threatLevel'] == 'NORMAL' else f"🔴 {result['threatLevel']}"
                print(f"Sample {i+1}: {status} - Error: {result['reconstructionError']:.6f}")
            else:
                print(f"Sample {i+1}: ❌ HTTP {response.status_code}")
        except Exception as e:
            print(f"Sample {i+1}: ❌ Error: {e}")
        
        time.sleep(1)

if __name__ == "__main__":
    send_normal_data()