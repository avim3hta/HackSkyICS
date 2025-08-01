#!/usr/bin/env python3
"""
Simple VM Attack Script
Run this from your external VM to attack the main machine
"""

import requests
import sys
import time
import random

def voltage_sag_attack(target_ip):
    """Execute voltage sag attack."""
    print("🚨 Executing Voltage Sag Attack...")
    
    for i in range(10):  # Send 10 attack samples
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "voltage",
            "sensor_value": 345000 * 0.6 * random.uniform(0.9, 1.1),  # 40% voltage drop
            "nominal_value": 345000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "critical"
        }
        
        try:
            response = requests.post(
                f'http://{target_ip}:8000/api/detect',
                json=attack_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                status = "🚨 DETECTED" if result['isAnomaly'] else "✅ Undetected"
                print(f"Attack {i+1}: {status} (Score: {result['anomalyScore']:.3f})")
            else:
                print(f"Attack {i+1}: Failed - {response.status_code}")
                
        except Exception as e:
            print(f"Attack {i+1}: Error - {e}")
        
        time.sleep(2)
    
    print("🏁 Voltage Sag Attack completed")

def power_overload_attack(target_ip):
    """Execute power overload attack."""
    print("⚡ Executing Power Overload Attack...")
    
    for i in range(10):
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "active_power",
            "sensor_value": 400000 * 2.5 * random.uniform(0.9, 1.1),  # 250% power overload
            "nominal_value": 400000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "kW",
            "tolerance_percent": 30.0,
            "criticality": "critical"
        }
        
        try:
            response = requests.post(
                f'http://{target_ip}:8000/api/detect',
                json=attack_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                status = "🚨 DETECTED" if result['isAnomaly'] else "✅ Undetected"
                print(f"Attack {i+1}: {status} (Score: {result['anomalyScore']:.3f})")
            else:
                print(f"Attack {i+1}: Failed - {response.status_code}")
                
        except Exception as e:
            print(f"Attack {i+1}: Error - {e}")
        
        time.sleep(2)
    
    print("🏁 Power Overload Attack completed")

def zero_day_attack(target_ip):
    """Execute zero-day attack."""
    print("🎭 Executing Zero-Day Attack...")
    
    for i in range(10):
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "voltage",
            "sensor_value": 345000 * 0.3 * random.uniform(0.8, 1.2),  # Severe voltage drop
            "nominal_value": 345000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "critical"
        }
        
        try:
            response = requests.post(
                f'http://{target_ip}:8000/api/detect',
                json=attack_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                status = "🚨 DETECTED" if result['isAnomaly'] else "✅ Undetected"
                print(f"Attack {i+1}: {status} (Score: {result['anomalyScore']:.3f})")
            else:
                print(f"Attack {i+1}: Failed - {response.status_code}")
                
        except Exception as e:
            print(f"Attack {i+1}: Error - {e}")
        
        time.sleep(2)
    
    print("🏁 Zero-Day Attack completed")

def main():
    if len(sys.argv) < 3:
        print("Usage: python attack_vm.py <attack_type> <target_ip>")
        print("Attack types: voltage_sag, power_overload, zero_day")
        print("Example: python attack_vm.py voltage_sag 192.168.1.100")
        return
    
    attack_type = sys.argv[1]
    target_ip = sys.argv[2]
    
    print(f"🎯 Target: {target_ip}:8000")
    print(f"⚔️ Attack: {attack_type}")
    print("-" * 40)
    
    if attack_type == "voltage_sag":
        voltage_sag_attack(target_ip)
    elif attack_type == "power_overload":
        power_overload_attack(target_ip)
    elif attack_type == "zero_day":
        zero_day_attack(target_ip)
    else:
        print(f"❌ Unknown attack type: {attack_type}")
        print("Available: voltage_sag, power_overload, zero_day")

if __name__ == "__main__":
    main()