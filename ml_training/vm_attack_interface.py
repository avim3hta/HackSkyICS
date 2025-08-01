#!/usr/bin/env python3
"""
VM Attack Interface for ICS Hackathon Demo
Run this script from your external VM to attack the main machine
Target: ahaan@10.12.10.111
"""

import requests
import time
import random
import sys
from datetime import datetime

# Target configuration
TARGET_IP = "10.12.10.111"
TARGET_PORT = 8000
API_URL = f"http://{TARGET_IP}:{TARGET_PORT}/api/detect"

class ICSAttacker:
    def __init__(self):
        self.target_url = API_URL
        self.attack_count = 0
        
    def print_banner(self):
        print("=" * 60)
        print("🚨 ICS ELECTRICAL GRID ATTACK SIMULATOR 🚨")
        print("=" * 60)
        print(f"🎯 Target: {TARGET_IP}:{TARGET_PORT}")
        print(f"🔗 API: {self.target_url}")
        print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
        print("=" * 60)
        
    def test_connection(self):
        """Test if the target is reachable."""
        try:
            health_url = f"http://{TARGET_IP}:{TARGET_PORT}/api/health"
            response = requests.get(health_url, timeout=5)
            if response.status_code == 200:
                print("✅ Target is reachable!")
                print(f"📊 Server Status: {response.json()}")
                return True
            else:
                print(f"❌ Target responded with status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot reach target: {e}")
            return False
    
    def execute_attack(self, attack_data, attack_name):
        """Execute a single attack."""
        try:
            print(f"\n🚀 Launching {attack_name}...")
            print(f"📡 Payload: {attack_data['sensor_name']} = {attack_data['sensor_value']}")
            
            response = requests.post(self.target_url, json=attack_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                self.attack_count += 1
                
                status = "🚨 DETECTED" if result['isAnomaly'] else "✅ UNDETECTED"
                print(f"📈 Result: {status}")
                print(f"🔢 Anomaly Score: {result['anomalyScore']:.3f}")
                print(f"🎯 Reconstruction Error: {result['reconstructionError']:.6f}")
                print(f"⚠️  Threat Level: {result['threatLevel']}")
                print(f"🏆 Attack #{self.attack_count} - SUCCESS")
                
                return result['isAnomaly']
            else:
                print(f"❌ Attack failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"💥 Attack error: {e}")
            return False
    
    def voltage_sag_attack(self):
        """Simulate voltage sag attack (40% voltage drop)."""
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "voltage",
            "sensor_value": 345000 * 0.6,  # 40% voltage drop
            "nominal_value": 345000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "critical"
        }
        return self.execute_attack(attack_data, "VOLTAGE SAG ATTACK")
    
    def power_overload_attack(self):
        """Simulate power overload attack (250% power surge)."""
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "active_power",
            "sensor_value": 400000 * 2.5,  # 250% power overload
            "nominal_value": 400000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "kW",
            "tolerance_percent": 30.0,
            "criticality": "critical"
        }
        return self.execute_attack(attack_data, "POWER OVERLOAD ATTACK")
    
    def frequency_attack(self):
        """Simulate frequency deviation attack."""
        attack_data = {
            "device_id": "GENERATOR_UNIT_001",
            "sensor_name": "frequency",
            "sensor_value": 60.0 + random.uniform(-2.0, 2.0),  # ±2Hz deviation
            "nominal_value": 60.0,
            "device_type": "generator",
            "voltage_level": "generation",
            "sensor_unit": "Hz",
            "tolerance_percent": 2.0,
            "criticality": "critical"
        }
        return self.execute_attack(attack_data, "FREQUENCY DEVIATION ATTACK")
    
    def zero_day_attack(self):
        """Simulate unknown zero-day attack pattern."""
        attack_data = {
            "device_id": "TRANSMISSION_LINE_345KV_001",
            "sensor_name": "voltage",
            "sensor_value": 345000 * 0.3,  # Severe voltage drop
            "nominal_value": 345000,
            "device_type": "transmission_line",
            "voltage_level": "transmission",
            "sensor_unit": "V",
            "tolerance_percent": 5.0,
            "criticality": "critical"
        }
        return self.execute_attack(attack_data, "ZERO-DAY ATTACK")
    
    def coordinated_attack(self):
        """Execute multiple coordinated attacks."""
        print("\n🎭 LAUNCHING COORDINATED ATTACK SEQUENCE...")
        attacks = [
            ("Voltage Sag", self.voltage_sag_attack),
            ("Power Overload", self.power_overload_attack),
            ("Frequency Attack", self.frequency_attack)
        ]
        
        detected_count = 0
        for name, attack_func in attacks:
            print(f"\n⚡ Phase: {name}")
            if attack_func():
                detected_count += 1
            time.sleep(2)  # Wait between attacks
        
        print(f"\n📊 COORDINATED ATTACK COMPLETE")
        print(f"🎯 Detection Rate: {detected_count}/{len(attacks)} ({detected_count/len(attacks)*100:.1f}%)")
    
    def continuous_attack(self, duration=30):
        """Launch continuous attacks for specified duration."""
        print(f"\n🔄 LAUNCHING CONTINUOUS ATTACK FOR {duration} SECONDS...")
        start_time = time.time()
        attacks_launched = 0
        attacks_detected = 0
        
        attack_types = [
            self.voltage_sag_attack,
            self.power_overload_attack,
            self.frequency_attack,
            self.zero_day_attack
        ]
        
        while time.time() - start_time < duration:
            attack = random.choice(attack_types)
            if attack():
                attacks_detected += 1
            attacks_launched += 1
            time.sleep(random.uniform(1, 3))  # Random intervals
        
        print(f"\n📊 CONTINUOUS ATTACK COMPLETE")
        print(f"🚀 Total Attacks: {attacks_launched}")
        print(f"🚨 Detected: {attacks_detected}")
        print(f"📈 Detection Rate: {attacks_detected/attacks_launched*100:.1f}%")

def show_menu():
    print("\n" + "="*50)
    print("🎯 SELECT ATTACK TYPE:")
    print("="*50)
    print("1. 🔻 Voltage Sag Attack")
    print("2. ⚡ Power Overload Attack") 
    print("3. 📊 Frequency Deviation Attack")
    print("4. 🎭 Zero-Day Attack")
    print("5. 🎪 Coordinated Attack Sequence")
    print("6. 🔄 Continuous Attack (30s)")
    print("7. 🧪 Test Connection")
    print("0. 🚪 Exit")
    print("="*50)

def main():
    attacker = ICSAttacker()
    attacker.print_banner()
    
    # Test connection first
    if not attacker.test_connection():
        print("\n❌ Cannot connect to target. Check:")
        print("1. Target IP is correct (10.12.10.111)")
        print("2. Backend server is running on port 8000")
        print("3. Network connectivity")
        return
    
    while True:
        show_menu()
        try:
            choice = input("\n🎯 Enter your choice (0-7): ").strip()
            
            if choice == "0":
                print("\n👋 Exiting attack interface...")
                break
            elif choice == "1":
                attacker.voltage_sag_attack()
            elif choice == "2":
                attacker.power_overload_attack()
            elif choice == "3":
                attacker.frequency_attack()
            elif choice == "4":
                attacker.zero_day_attack()
            elif choice == "5":
                attacker.coordinated_attack()
            elif choice == "6":
                attacker.continuous_attack(30)
            elif choice == "7":
                attacker.test_connection()
            else:
                print("❌ Invalid choice. Please select 0-7.")
                
        except KeyboardInterrupt:
            print("\n\n⚠️  Attack interrupted by user!")
            break
        except Exception as e:
            print(f"\n💥 Unexpected error: {e}")

if __name__ == "__main__":
    main()