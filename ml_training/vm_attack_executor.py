#!/usr/bin/env python3
"""
VM Attack Executor
Script to be run on external VM to execute attacks via SSH
"""

import paramiko
import time
import json
import argparse
from datetime import datetime

class VMAttackExecutor:
    def __init__(self, target_host, username, password=None, key_file=None):
        self.target_host = target_host
        self.username = username
        self.password = password
        self.key_file = key_file
        self.ssh_client = None
    
    def connect(self):
        """Establish SSH connection to target machine."""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            if self.key_file:
                self.ssh_client.connect(
                    hostname=self.target_host,
                    username=self.username,
                    key_filename=self.key_file
                )
            else:
                self.ssh_client.connect(
                    hostname=self.target_host,
                    username=self.username,
                    password=self.password
                )
            
            print(f"✅ Connected to {self.target_host} via SSH")
            return True
            
        except Exception as e:
            print(f"❌ SSH connection failed: {e}")
            return False
    
    def execute_attack(self, attack_type, target_device="TRANSMISSION_LINE_345KV_001", duration=30):
        """Execute attack on target machine."""
        if not self.ssh_client:
            print("❌ No SSH connection established")
            return False
        
        try:
            print(f"🚨 Executing {attack_type} attack on {target_device}")
            print(f"⏱️ Duration: {duration} seconds")
            
            # Create attack command
            attack_command = f"""
cd /c/Users/ahaan/HackSkyICS/ml_training
python -c "
import requests
import time
import random
from datetime import datetime

def execute_attack():
    print('🚨 Starting {attack_type} attack from VM')
    
    # Attack parameters
    attack_params = {{
        'voltage_sag_attack': {{'base_value': 345000, 'multiplier': 0.6, 'sensor': 'voltage', 'unit': 'V'}},
        'power_overload_attack': {{'base_value': 400000, 'multiplier': 2.5, 'sensor': 'active_power', 'unit': 'kW'}},
        'frequency_attack': {{'base_value': 60.0, 'multiplier': 0.97, 'sensor': 'frequency', 'unit': 'Hz'}},
        'zero_day_attack': {{'base_value': 345000, 'multiplier': 0.3, 'sensor': 'voltage', 'unit': 'V'}},
        'stuxnet_attack': {{'base_value': 60.0, 'multiplier': 1.05, 'sensor': 'frequency', 'unit': 'Hz'}}
    }}
    
    params = attack_params.get('{attack_type}', {{'base_value': 345000, 'multiplier': 1.5, 'sensor': 'voltage', 'unit': 'V'}})
    
    end_time = time.time() + {duration}
    attack_count = 0
    
    while time.time() < end_time:
        try:
            # Generate malicious sensor data
            variation = random.uniform(0.8, 1.2)
            sensor_value = params['base_value'] * params['multiplier'] * variation
            
            sensor_data = {{
                'device_id': '{target_device}',
                'sensor_name': params['sensor'],
                'sensor_value': sensor_value,
                'nominal_value': params['base_value'],
                'device_type': 'transmission_line',
                'voltage_level': 'transmission',
                'sensor_unit': params['unit'],
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
                attack_count += 1
                status = '🚨 DETECTED' if result['isAnomaly'] else '✅ Undetected'
                print(f'Attack {{attack_count}}: {{status}} (Score: {{result[\"anomalyScore\"]:.3f}})')
            else:
                print(f'Failed to send attack data: {{response.status_code}}')
            
            time.sleep(2)  # Attack every 2 seconds
            
        except Exception as e:
            print(f'Attack error: {{e}}')
            time.sleep(1)
    
    print(f'🏁 Attack completed. Total attacks sent: {{attack_count}}')

execute_attack()
"
"""
            
            # Execute the attack command
            stdin, stdout, stderr = self.ssh_client.exec_command(attack_command)
            
            # Monitor the output in real-time
            print("📡 Attack execution output:")
            print("-" * 40)
            
            # Read output line by line
            while True:
                line = stdout.readline()
                if not line:
                    break
                print(f"[REMOTE] {line.strip()}")
            
            # Check for errors
            error_output = stderr.read().decode()
            if error_output:
                print(f"❌ Errors: {error_output}")
            
            print("-" * 40)
            print("✅ Attack execution completed")
            return True
            
        except Exception as e:
            print(f"❌ Attack execution failed: {e}")
            return False
    
    def execute_stealth_attack(self, duration=60):
        """Execute a sophisticated stealth attack that gradually increases anomaly levels."""
        if not self.ssh_client:
            print("❌ No SSH connection established")
            return False
        
        try:
            print("🥷 Executing stealth attack - gradual anomaly escalation")
            
            stealth_command = f"""
cd /c/Users/ahaan/HackSkyICS/ml_training
python -c "
import requests
import time
import random
import math
from datetime import datetime

def stealth_attack():
    print('🥷 Starting stealth attack from VM')
    
    end_time = time.time() + {duration}
    start_time = time.time()
    attack_count = 0
    
    while time.time() < end_time:
        try:
            # Calculate attack progression (0 to 1)
            progress = (time.time() - start_time) / {duration}
            
            # Gradually increase anomaly level
            anomaly_factor = 1.0 - (progress * 0.7)  # Start normal, become 30% of normal
            
            # Add some randomness to avoid detection patterns
            noise = random.uniform(0.95, 1.05)
            sensor_value = 345000 * anomaly_factor * noise
            
            sensor_data = {{
                'device_id': 'TRANSMISSION_LINE_345KV_001',
                'sensor_name': 'voltage',
                'sensor_value': sensor_value,
                'nominal_value': 345000,
                'device_type': 'transmission_line',
                'voltage_level': 'transmission',
                'sensor_unit': 'V',
                'tolerance_percent': 5.0,
                'criticality': 'critical'
            }}
            
            response = requests.post(
                'http://localhost:8000/detect',
                json=sensor_data,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                attack_count += 1
                
                status = '🚨 DETECTED' if result['isAnomaly'] else '🥷 Stealth'
                print(f'Stealth {{attack_count}}: {{status}} | Progress: {{progress*100:.1f}}% | Value: {{sensor_value:.0f}}V | Score: {{result[\"anomalyScore\"]:.3f}}')
            
            time.sleep(3)  # Slower attack rate for stealth
            
        except Exception as e:
            print(f'Stealth attack error: {{e}}')
            time.sleep(1)
    
    print(f'🏁 Stealth attack completed. Total attacks: {{attack_count}}')

stealth_attack()
"
"""
            
            stdin, stdout, stderr = self.ssh_client.exec_command(stealth_command)
            
            print("📡 Stealth attack output:")
            print("-" * 40)
            
            while True:
                line = stdout.readline()
                if not line:
                    break
                print(f"[STEALTH] {line.strip()}")
            
            error_output = stderr.read().decode()
            if error_output:
                print(f"❌ Errors: {error_output}")
            
            print("-" * 40)
            print("✅ Stealth attack completed")
            return True
            
        except Exception as e:
            print(f"❌ Stealth attack failed: {e}")
            return False
    
    def disconnect(self):
        """Close SSH connection."""
        if self.ssh_client:
            self.ssh_client.close()
            print("🔌 SSH connection closed")

def main():
    parser = argparse.ArgumentParser(description='VM Attack Executor for AI Detection Demo')
    parser.add_argument('--host', required=True, help='Target host IP address')
    parser.add_argument('--username', required=True, help='SSH username')
    parser.add_argument('--password', help='SSH password')
    parser.add_argument('--key-file', help='SSH private key file path')
    parser.add_argument('--attack-type', 
                       choices=['voltage_sag_attack', 'power_overload_attack', 'frequency_attack', 'zero_day_attack', 'stuxnet_attack', 'stealth'],
                       default='voltage_sag_attack',
                       help='Type of attack to execute')
    parser.add_argument('--duration', type=int, default=30, help='Attack duration in seconds')
    parser.add_argument('--target-device', default='TRANSMISSION_LINE_345KV_001', help='Target device ID')
    
    args = parser.parse_args()
    
    if not args.password and not args.key_file:
        print("❌ Either --password or --key-file must be provided")
        return
    
    print("🎭 VM Attack Executor for AI Detection Demo")
    print("=" * 50)
    print(f"🎯 Target: {args.host}")
    print(f"👤 Username: {args.username}")
    print(f"⚔️ Attack Type: {args.attack_type}")
    print(f"⏱️ Duration: {args.duration} seconds")
    print(f"🎯 Target Device: {args.target_device}")
    print("")
    
    # Create executor and connect
    executor = VMAttackExecutor(args.host, args.username, args.password, args.key_file)
    
    if executor.connect():
        try:
            if args.attack_type == 'stealth':
                executor.execute_stealth_attack(args.duration)
            else:
                executor.execute_attack(args.attack_type, args.target_device, args.duration)
        finally:
            executor.disconnect()
    else:
        print("❌ Failed to establish connection")

if __name__ == "__main__":
    main()