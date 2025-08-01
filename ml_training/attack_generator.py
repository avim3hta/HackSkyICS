#!/usr/bin/env python3
"""
Attack Generator for Testing Reconstruction Autoencoder
Generates various electrical grid attacks to test zero-day detection capability
"""

import numpy as np
import pandas as pd
from datetime import datetime
import random
from typing import Dict, List
import json

class ElectricalGridAttackGenerator:
    """
    Generates various types of electrical grid attacks
    Tests reconstruction autoencoder's ability to detect novel threats
    """
    
    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)
        random.seed(random_seed)
        
    def generate_voltage_attacks(self, normal_sample: Dict) -> List[Dict]:
        """Generate voltage-based attacks."""
        attacks = []
        
        if normal_sample['sensor_name'] == 'voltage':
            normal_voltage = normal_sample['sensor_value']
            
            # Voltage Sag Attack (sudden drop)
            sag_attack = normal_sample.copy()
            sag_attack['sensor_value'] = normal_voltage * 0.6  # 40% voltage drop
            sag_attack['attack_type'] = 'voltage_sag_attack'
            sag_attack['is_anomaly'] = 1
            attacks.append(sag_attack)
            
            # Voltage Swell Attack (sudden rise)
            swell_attack = normal_sample.copy()
            swell_attack['sensor_value'] = normal_voltage * 1.4  # 40% voltage rise
            swell_attack['attack_type'] = 'voltage_swell_attack'
            swell_attack['is_anomaly'] = 1
            attacks.append(swell_attack)
            
            # Voltage Instability Attack (rapid fluctuations)
            unstable_attack = normal_sample.copy()
            unstable_attack['sensor_value'] = normal_voltage * (1 + 0.3 * np.sin(np.random.random() * 10))
            unstable_attack['attack_type'] = 'voltage_instability_attack'
            unstable_attack['is_anomaly'] = 1
            attacks.append(unstable_attack)
        
        return attacks
    
    def generate_frequency_attacks(self, normal_sample: Dict) -> List[Dict]:
        """Generate frequency-based attacks."""
        attacks = []
        
        if normal_sample['sensor_name'] == 'frequency':
            normal_freq = normal_sample['sensor_value']
            
            # Under-frequency Attack (grid instability)
            under_freq_attack = normal_sample.copy()
            under_freq_attack['sensor_value'] = 58.5  # Dangerous under-frequency
            under_freq_attack['attack_type'] = 'under_frequency_attack'
            under_freq_attack['is_anomaly'] = 1
            attacks.append(under_freq_attack)
            
            # Over-frequency Attack
            over_freq_attack = normal_sample.copy()
            over_freq_attack['sensor_value'] = 61.5  # Dangerous over-frequency
            over_freq_attack['attack_type'] = 'over_frequency_attack'
            over_freq_attack['is_anomaly'] = 1
            attacks.append(over_freq_attack)
            
            # Frequency Oscillation Attack
            oscillation_attack = normal_sample.copy()
            oscillation_attack['sensor_value'] = 60.0 + 0.5 * np.sin(np.random.random() * 20)
            oscillation_attack['attack_type'] = 'frequency_oscillation_attack'
            oscillation_attack['is_anomaly'] = 1
            attacks.append(oscillation_attack)
        
        return attacks
    
    def generate_power_attacks(self, normal_sample: Dict) -> List[Dict]:
        """Generate power-related attacks."""
        attacks = []
        
        if normal_sample['sensor_name'] in ['active_power', 'apparent_power']:
            normal_power = normal_sample['sensor_value']
            
            # Power Overload Attack
            overload_attack = normal_sample.copy()
            overload_attack['sensor_value'] = normal_power * 2.5  # 250% overload
            overload_attack['attack_type'] = 'power_overload_attack'
            overload_attack['is_anomaly'] = 1
            attacks.append(overload_attack)
            
            # Power Drop Attack (simulate load shedding attack)
            drop_attack = normal_sample.copy()
            drop_attack['sensor_value'] = normal_power * 0.2  # 80% power drop
            drop_attack['attack_type'] = 'power_drop_attack'
            drop_attack['is_anomaly'] = 1
            attacks.append(drop_attack)
            
            # Power Spike Attack
            spike_attack = normal_sample.copy()
            spike_attack['sensor_value'] = normal_power * 3.0  # 300% spike
            spike_attack['attack_type'] = 'power_spike_attack'
            spike_attack['is_anomaly'] = 1
            attacks.append(spike_attack)
        
        return attacks
    
    def generate_harmonic_attacks(self, normal_sample: Dict) -> List[Dict]:
        """Generate harmonic distortion attacks."""
        attacks = []
        
        if normal_sample['sensor_name'] == 'thd':
            # High Harmonic Distortion Attack
            harmonic_attack = normal_sample.copy()
            harmonic_attack['sensor_value'] = 15.0  # 15% THD (very high)
            harmonic_attack['attack_type'] = 'harmonic_distortion_attack'
            harmonic_attack['is_anomaly'] = 1
            attacks.append(harmonic_attack)
        
        return attacks
    
    def generate_temperature_attacks(self, normal_sample: Dict) -> List[Dict]:
        """Generate temperature-based attacks."""
        attacks = []
        
        if normal_sample['sensor_name'] == 'temperature':
            # Overheating Attack (simulated equipment damage)
            overheat_attack = normal_sample.copy()
            overheat_attack['sensor_value'] = 120.0  # Dangerous overheating
            overheat_attack['attack_type'] = 'overheating_attack'
            overheat_attack['is_anomaly'] = 1
            attacks.append(overheat_attack)
            
            # Thermal Shock Attack (rapid temperature change)
            thermal_shock_attack = normal_sample.copy()
            thermal_shock_attack['sensor_value'] = -20.0  # Sudden cooling
            thermal_shock_attack['attack_type'] = 'thermal_shock_attack'
            thermal_shock_attack['is_anomaly'] = 1
            attacks.append(thermal_shock_attack)
        
        return attacks
    
    def generate_stuxnet_style_attack(self, normal_sample: Dict) -> Dict:
        """Generate Stuxnet-style subtle attack."""
        stuxnet_attack = normal_sample.copy()
        
        if normal_sample['sensor_name'] == 'frequency':
            # Subtle frequency manipulation (harder to detect)
            stuxnet_attack['sensor_value'] = 60.0 + 0.15 * np.sin(np.random.random() * 100)
        elif normal_sample['sensor_name'] == 'voltage':
            # Gradual voltage drift
            stuxnet_attack['sensor_value'] *= (1 + 0.08 * np.sin(np.random.random() * 50))
        elif normal_sample['sensor_name'] == 'current':
            # Current manipulation
            stuxnet_attack['sensor_value'] *= (1 + 0.12 * np.random.random())
        
        stuxnet_attack['attack_type'] = 'stuxnet_style_attack'
        stuxnet_attack['is_anomaly'] = 1
        
        return stuxnet_attack
    
    def generate_zero_day_attack(self, normal_sample: Dict) -> Dict:
        """Generate novel zero-day style attack."""
        zero_day_attack = normal_sample.copy()
        
        # Novel attack: Coordinated multi-parameter manipulation
        if normal_sample['sensor_name'] == 'voltage':
            # Voltage manipulation with phase shift
            zero_day_attack['sensor_value'] *= (1 + 0.2 * np.cos(np.random.random() * 30))
        elif normal_sample['sensor_name'] == 'power_factor':
            # Power factor manipulation (unusual attack vector)
            zero_day_attack['sensor_value'] = max(0.5, normal_sample['sensor_value'] - 0.3)
        elif normal_sample['sensor_name'] == 'thd':
            # Selective harmonic injection
            zero_day_attack['sensor_value'] += 3.0 + 2.0 * np.random.random()
        
        zero_day_attack['attack_type'] = 'zero_day_attack'
        zero_day_attack['is_anomaly'] = 1
        
        return zero_day_attack
    
    def generate_attack_dataset(self, normal_samples: pd.DataFrame, num_attacks: int = 10000) -> pd.DataFrame:
        """Generate comprehensive attack dataset from normal samples."""
        print(f"🎯 Generating {num_attacks} attack samples for testing...")
        
        attacks = []
        normal_sample_list = normal_samples.to_dict('records')
        
        for i in range(num_attacks):
            # Select random normal sample as base
            base_sample = random.choice(normal_sample_list)
            
            # Generate different types of attacks
            attack_types = [
                self.generate_voltage_attacks,
                self.generate_frequency_attacks,
                self.generate_power_attacks,
                self.generate_harmonic_attacks,
                self.generate_temperature_attacks
            ]
            
            # Choose random attack type
            attack_generator = random.choice(attack_types)
            generated_attacks = attack_generator(base_sample)
            
            if generated_attacks:
                attacks.extend(generated_attacks)
            
            # Occasionally generate sophisticated attacks
            if np.random.random() < 0.1:  # 10% chance
                stuxnet_attack = self.generate_stuxnet_style_attack(base_sample)
                attacks.append(stuxnet_attack)
            
            if np.random.random() < 0.05:  # 5% chance
                zero_day_attack = self.generate_zero_day_attack(base_sample)
                attacks.append(zero_day_attack)
        
        # Convert to DataFrame
        attack_df = pd.DataFrame(attacks[:num_attacks])  # Limit to requested number
        
        print(f"✅ Generated {len(attack_df)} attack samples")
        print(f"🚨 Attack types: {attack_df['attack_type'].value_counts().to_dict()}")
        
        return attack_df

def main():
    """Generate attack dataset for testing reconstruction autoencoder."""
    print("⚔️ Electrical Grid Attack Generation")
    print("===================================")
    print("🎯 Purpose: Test reconstruction autoencoder against various attacks")
    print("🛡️ Including: Zero-day and novel attack patterns")
    print("")
    
    # Load normal samples
    print("📊 Loading normal electrical grid data...")
    normal_df = pd.read_csv('data/normal_electrical_grid_900k.csv', parse_dates=['timestamp'])
    
    # Sample subset for attack generation
    normal_subset = normal_df.sample(n=50000, random_state=42)  # Use 50k samples as base
    
    # Initialize attack generator
    attack_generator = ElectricalGridAttackGenerator(random_seed=42)
    
    # Generate attacks
    attack_df = attack_generator.generate_attack_dataset(normal_subset, num_attacks=25000)
    
    # Save attack dataset
    output_file = 'data/electrical_grid_attacks.csv'
    attack_df.to_csv(output_file, index=False)
    print(f"💾 Attack dataset saved to: {output_file}")
    
    print("\n📊 Attack Dataset Summary:")
    print(f"Total attack samples: {len(attack_df):,}")
    print(f"Attack types: {len(attack_df['attack_type'].unique())}")
    print("\n🚨 Attack Distribution:")
    for attack_type, count in attack_df['attack_type'].value_counts().items():
        print(f"  {attack_type:>25}: {count:>6}")
    
    print("\n✅ Attack generation completed!")
    print("🎯 Ready to test reconstruction autoencoder against novel threats!")

if __name__ == "__main__":
    main()
