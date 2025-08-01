#!/usr/bin/env python3
"""
Normal Electrical Grid Data Fabricator
Generates ONLY normal electrical grid operations for autoencoder training
Used for reconstruction-based anomaly detection (trains only on normal data)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import random
from dataclasses import dataclass
from enum import Enum
import json

class GridVoltageLevel(Enum):
    TRANSMISSION = "transmission"  # 110-765kV
    DISTRIBUTION = "distribution"  # 11-33kV

@dataclass
class NormalGridSensorConfig:
    name: str
    nominal_value: float      # Target operating point
    tolerance_percent: float  # ±% normal variation
    unit: str
    min_value: float         # Absolute minimum for normal operation
    max_value: float         # Absolute maximum for normal operation
    noise_level: float = 0.01
    seasonal_amplitude: float = 0.05
    daily_variation: float = 0.1  # Daily load cycle variation

@dataclass
class NormalGridDeviceConfig:
    device_id: str
    device_type: str
    voltage_level: GridVoltageLevel
    sensors: List[NormalGridSensorConfig]
    criticality: str = "high"
    operational_patterns: Dict = None  # Define normal operational patterns

class NormalElectricalGridFabricator:
    """
    Fabricates ONLY normal electrical grid operational data
    No anomalies - pure normal patterns for autoencoder training
    """
    
    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)
        random.seed(random_seed)
        
        self.normal_sensor_configs = self._initialize_normal_sensor_configs()
        self.normal_device_configs = self._initialize_normal_device_configs()
        
    def _initialize_normal_sensor_configs(self) -> Dict[str, NormalGridSensorConfig]:
        """Initialize normal operational ranges for electrical grid sensors."""
        return {
            # Transmission Voltage (345kV nominal, ±5% normal variation)
            'transmission_voltage': NormalGridSensorConfig(
                name='voltage',
                nominal_value=345000.0,    # 345kV transmission line
                tolerance_percent=4.0,     # ±4% normal variation (±13.8kV)
                unit='V',
                min_value=330000.0,        # 96% of nominal (still normal)
                max_value=360000.0,        # 104% of nominal (still normal)
                noise_level=200.0,         # Small measurement noise
                seasonal_amplitude=3000.0, # Seasonal load variations
                daily_variation=8000.0     # Daily load cycle
            ),
            
            # Distribution Voltage (22kV nominal, ±3% normal variation)
            'distribution_voltage': NormalGridSensorConfig(
                name='voltage',
                nominal_value=22000.0,     # 22kV distribution
                tolerance_percent=3.0,     # ±3% normal variation
                unit='V',
                min_value=21300.0,         # 97% of nominal
                max_value=22700.0,         # 103% of nominal
                noise_level=50.0,
                seasonal_amplitude=400.0,
                daily_variation=600.0
            ),
            
            # Current (normal load patterns)
            'current': NormalGridSensorConfig(
                name='current',
                nominal_value=800.0,       # Normal load current
                tolerance_percent=25.0,    # ±25% normal load variation
                unit='A',
                min_value=400.0,           # Minimum normal load
                max_value=1200.0,          # Maximum normal load (not overload)
                noise_level=5.0,
                seasonal_amplitude=80.0,
                daily_variation=200.0      # Load varies throughout day
            ),
            
            # Active Power (normal generation/consumption)
            'active_power': NormalGridSensorConfig(
                name='active_power',
                nominal_value=400000.0,    # 400 MW nominal
                tolerance_percent=30.0,    # ±30% normal load variation
                unit='kW',
                min_value=200000.0,        # Light load
                max_value=600000.0,        # Peak load (still normal)
                noise_level=1000.0,
                seasonal_amplitude=40000.0,
                daily_variation=100000.0   # Significant daily variation
            ),
            
            # Apparent Power (slightly higher than active due to power factor)
            'apparent_power': NormalGridSensorConfig(
                name='apparent_power',
                nominal_value=420000.0,    # ~420 MVA (0.95 power factor)
                tolerance_percent=30.0,
                unit='kVA',
                min_value=210000.0,
                max_value=630000.0,
                noise_level=1100.0,
                seasonal_amplitude=42000.0,
                daily_variation=105000.0
            ),
            
            # Frequency (very stable in normal operation)
            'frequency': NormalGridSensorConfig(
                name='frequency',
                nominal_value=60.0,        # 60 Hz nominal
                tolerance_percent=0.1,     # ±0.1% = ±0.06 Hz (very tight)
                unit='Hz',
                min_value=59.95,           # 59.95 Hz minimum normal
                max_value=60.05,           # 60.05 Hz maximum normal
                noise_level=0.005,         # Very small noise
                seasonal_amplitude=0.01,   # Minimal seasonal variation
                daily_variation=0.02       # Small daily variation
            ),
            
            # Total Harmonic Distortion (low in normal operation)
            'thd': NormalGridSensorConfig(
                name='thd',
                nominal_value=2.0,         # 2% THD target
                tolerance_percent=50.0,    # Can vary ±1% (1-3% normal)
                unit='%',
                min_value=0.5,             # Very clean power
                max_value=4.5,             # Still acceptable (<5% IEEE limit)
                noise_level=0.1,
                seasonal_amplitude=0.3,
                daily_variation=0.5
            ),
            
            # Power Factor (good in normal operation)
            'power_factor': NormalGridSensorConfig(
                name='power_factor',
                nominal_value=0.95,        # Good power factor
                tolerance_percent=5.0,     # ±5% variation (0.90-1.0)
                unit='pu',
                min_value=0.90,            # Acceptable minimum
                max_value=1.0,             # Unity power factor maximum
                noise_level=0.005,
                seasonal_amplitude=0.02,
                daily_variation=0.03
            ),
            
            # Temperature (normal equipment operating temperature)
            'temperature': NormalGridSensorConfig(
                name='temperature',
                nominal_value=45.0,        # Normal operating temperature
                tolerance_percent=40.0,    # ±40% variation (27-63°C normal)
                unit='°C',
                min_value=20.0,            # Cool conditions
                max_value=70.0,            # Warm but normal operation
                noise_level=0.5,
                seasonal_amplitude=8.0,    # Seasonal ambient changes
                daily_variation=5.0        # Day/night temperature cycle
            )
        }
    
    def _initialize_normal_device_configs(self) -> List[NormalGridDeviceConfig]:
        """Initialize normal electrical grid device configurations."""
        configs = []
        
        # Transmission System - Normal Operation
        configs.extend([
            NormalGridDeviceConfig(
                device_id="TRANSMISSION_LINE_345KV_001",
                device_type="transmission_line",
                voltage_level=GridVoltageLevel.TRANSMISSION,
                sensors=[
                    self.normal_sensor_configs['transmission_voltage'],
                    self.normal_sensor_configs['current'],
                    self.normal_sensor_configs['active_power'],
                    self.normal_sensor_configs['apparent_power'],
                    self.normal_sensor_configs['frequency'],
                    self.normal_sensor_configs['power_factor']
                ],
                criticality="critical",
                operational_patterns={
                    "peak_hours": [8, 9, 10, 11, 18, 19, 20, 21],  # High load hours
                    "off_peak_hours": [1, 2, 3, 4, 5, 6],         # Low load hours
                    "load_factor": 0.75  # Average load as fraction of peak
                }
            ),
            
            NormalGridDeviceConfig(
                device_id="POWER_TRANSFORMER_345_138KV_001",
                device_type="power_transformer",
                voltage_level=GridVoltageLevel.TRANSMISSION,
                sensors=[
                    self.normal_sensor_configs['transmission_voltage'],
                    self.normal_sensor_configs['current'],
                    self.normal_sensor_configs['active_power'],
                    self.normal_sensor_configs['temperature'],
                    self.normal_sensor_configs['thd']
                ],
                criticality="critical",
                operational_patterns={
                    "thermal_time_constant": 4,  # Hours to heat up/cool down
                    "efficiency": 0.99  # 99% efficiency normal
                }
            ),
            
            NormalGridDeviceConfig(
                device_id="GENERATOR_STEP_UP_001",
                device_type="generator_step_up",
                voltage_level=GridVoltageLevel.TRANSMISSION,
                sensors=[
                    self.normal_sensor_configs['transmission_voltage'],
                    self.normal_sensor_configs['current'],
                    self.normal_sensor_configs['active_power'],
                    self.normal_sensor_configs['apparent_power'],
                    self.normal_sensor_configs['frequency'],
                    self.normal_sensor_configs['power_factor'],
                    self.normal_sensor_configs['temperature']
                ],
                criticality="critical",
                operational_patterns={
                    "ramp_rate": 50.0,  # MW per minute maximum ramp
                    "base_load": 0.4    # Minimum load as fraction of capacity
                }
            )
        ])
        
        # Distribution System - Normal Operation
        configs.extend([
            NormalGridDeviceConfig(
                device_id="DISTRIBUTION_FEEDER_22KV_001",
                device_type="distribution_feeder",
                voltage_level=GridVoltageLevel.DISTRIBUTION,
                sensors=[
                    self.normal_sensor_configs['distribution_voltage'],
                    self.normal_sensor_configs['current'],
                    self.normal_sensor_configs['active_power'],
                    self.normal_sensor_configs['power_factor'],
                    self.normal_sensor_configs['thd']
                ],
                criticality="high",
                operational_patterns={
                    "residential_peak": [18, 19, 20, 21],  # Residential evening peak
                    "commercial_peak": [9, 10, 11, 14, 15, 16],  # Commercial daytime
                    "diversity_factor": 0.7  # Not all loads peak simultaneously
                }
            ),
            
            NormalGridDeviceConfig(
                device_id="DISTRIBUTION_TRANSFORMER_22_0.4KV_001",
                device_type="distribution_transformer",
                voltage_level=GridVoltageLevel.DISTRIBUTION,
                sensors=[
                    self.normal_sensor_configs['distribution_voltage'],
                    self.normal_sensor_configs['current'],
                    self.normal_sensor_configs['active_power'],
                    self.normal_sensor_configs['temperature'],
                    self.normal_sensor_configs['thd']
                ],
                criticality="high",
                operational_patterns={
                    "load_growth": 0.02,  # 2% annual load growth
                    "seasonal_factor": 1.2  # Winter/summer peak ratio
                }
            )
        ])
        
        return configs
    
    def generate_normal_grid_dataset(
        self,
        samples: int = 900000,
        start_date: datetime = None,
        sample_interval_seconds: int = 5
    ) -> pd.DataFrame:
        """Generate ONLY normal electrical grid operational data."""
        
        if start_date is None:
            start_date = datetime.now() - timedelta(days=60)  # 60 days of normal historical data
        
        print(f"⚡ Generating NORMAL Electrical Grid Dataset")
        print(f"📊 Samples: {samples:,}")
        print(f"✅ Anomaly rate: 0.0% (PURE NORMAL DATA)")
        print(f"⏰ Time range: {start_date} to {start_date + timedelta(seconds=samples*sample_interval_seconds)}")
        
        all_data = []
        
        # Generate base time series
        timestamps = [start_date + timedelta(seconds=i * sample_interval_seconds) for i in range(samples)]
        
        for device in self.normal_device_configs:
            print(f"  ⚡ Generating normal data for {device.device_id} ({device.voltage_level.value})...")
            
            device_data = self._generate_normal_device_data(
                device=device,
                timestamps=timestamps
            )
            
            all_data.extend(device_data)
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        # Add time-series features
        df = self._add_time_series_features(df)
        
        print(f"✅ Generated {len(df):,} normal electrical grid readings")
        print(f"📈 All samples are NORMAL (0% anomalies)")
        print(f"🎯 Ready for autoencoder training!")
        
        return df
    
    def _generate_normal_device_data(
        self,
        device: NormalGridDeviceConfig,
        timestamps: List[datetime]
    ) -> List[Dict]:
        """Generate normal sensor data for a specific electrical grid device."""
        device_data = []
        
        # Initialize baselines at nominal values with small random variation
        sensor_baselines = {}
        for sensor in device.sensors:
            # Start near nominal with small variation
            variation = sensor.nominal_value * 0.02  # ±2% initial variation
            sensor_baselines[sensor.name] = sensor.nominal_value + np.random.uniform(-variation, variation)
        
        for i, timestamp in enumerate(timestamps):
            # Generate normal readings with realistic operational patterns
            readings = self._generate_realistic_normal_readings(
                device=device,
                timestamp=timestamp,
                baselines=sensor_baselines,
                sample_index=i
            )
            
            # Create data records (ALL NORMAL - no anomalies)
            for sensor_name, value in readings.items():
                sensor_config = next((s for s in device.sensors if s.name == sensor_name), None)
                if sensor_config:
                    record = {
                        'timestamp': timestamp,
                        'facility_type': 'electrical_grid',
                        'device_id': device.device_id,
                        'device_type': device.device_type,
                        'sensor_name': sensor_name,
                        'sensor_value': value,
                        'sensor_unit': sensor_config.unit,
                        'voltage_level': device.voltage_level.value,
                        'nominal_value': sensor_config.nominal_value,
                        'tolerance_percent': sensor_config.tolerance_percent,
                        'criticality': device.criticality,
                        'is_anomaly': 0,  # ALL NORMAL DATA
                        'anomaly_type': None,  # NO ANOMALIES
                        'hour_of_day': timestamp.hour,
                        'day_of_week': timestamp.weekday(),
                        'day_of_year': timestamp.timetuple().tm_yday,
                        'operational_state': 'normal'  # Always normal
                    }
                    
                    device_data.append(record)
        
        return device_data
    
    def _generate_realistic_normal_readings(
        self,
        device: NormalGridDeviceConfig,
        timestamp: datetime,
        baselines: Dict[str, float],
        sample_index: int
    ) -> Dict[str, float]:
        """Generate realistic normal readings with proper electrical correlations."""
        readings = {}
        
        # Time-based factors for realistic operational patterns
        hour = timestamp.hour
        day_of_year = timestamp.timetuple().tm_yday
        day_of_week = timestamp.weekday()  # 0=Monday, 6=Sunday
        
        # Daily load cycle (higher during day, lower at night)
        daily_factor = 0.8 + 0.4 * np.sin(2 * np.pi * (hour - 6) / 24)  # Peak around 2 PM
        
        # Weekly cycle (lower on weekends)
        weekly_factor = 0.9 if day_of_week >= 5 else 1.0  # Weekend reduction
        
        # Seasonal cycle (higher in summer/winter for A/C and heating)
        seasonal_factor = 1.0 + 0.2 * np.sin(2 * np.pi * (day_of_year - 80) / 365)
        
        # Apply operational patterns from device config
        patterns = device.operational_patterns or {}
        
        # Load factor adjustments based on device type
        if device.device_type in ["transmission_line", "generator_step_up"]:
            load_factor = daily_factor * weekly_factor * seasonal_factor
        elif device.device_type in ["distribution_feeder", "distribution_transformer"]:
            # Distribution has different patterns (residential vs commercial)
            if hour in patterns.get("residential_peak", [18, 19, 20]):
                load_factor = 1.2 * weekly_factor * seasonal_factor
            elif hour in patterns.get("commercial_peak", [10, 11, 14, 15]):
                load_factor = 1.1 * weekly_factor * seasonal_factor
            else:
                load_factor = 0.7 * weekly_factor * seasonal_factor
        else:
            load_factor = daily_factor * weekly_factor * seasonal_factor
        
        # Generate correlated sensor readings
        for sensor in device.sensors:
            baseline = baselines[sensor.name]
            
            # Apply load-dependent variations
            if sensor.name in ['current', 'active_power', 'apparent_power']:
                # Power-related sensors follow load patterns
                load_variation = (load_factor - 1.0) * sensor.daily_variation
            elif sensor.name == 'temperature':
                # Temperature follows load and ambient patterns
                load_variation = (load_factor - 1.0) * sensor.daily_variation * 0.5
                ambient_variation = sensor.seasonal_amplitude * np.sin(2 * np.pi * day_of_year / 365)
                load_variation += ambient_variation
            else:
                # Voltage, frequency, etc. have minimal load dependency
                load_variation = (load_factor - 1.0) * sensor.daily_variation * 0.1
            
            # Add seasonal variation
            seasonal_variation = sensor.seasonal_amplitude * np.sin(2 * np.pi * day_of_year / 365)
            
            # Add measurement noise
            noise = np.random.normal(0, sensor.noise_level)
            
            # Calculate final value
            value = baseline + load_variation + seasonal_variation + noise
            
            # Ensure within normal operating bounds
            value = np.clip(value, sensor.min_value, sensor.max_value)
            
            readings[sensor.name] = value
        
        # Apply electrical correlations (Power = Voltage × Current, etc.)
        readings = self._apply_electrical_correlations(readings, device)
        
        return readings
    
    def _apply_electrical_correlations(self, readings: Dict[str, float], device: NormalGridDeviceConfig) -> Dict[str, float]:
        """Apply realistic electrical correlations between parameters."""
        
        # Power relationships: P = V × I × cos(φ), S = V × I
        if 'voltage' in readings and 'current' in readings:
            voltage = readings['voltage']
            current = readings['current']
            power_factor = readings.get('power_factor', 0.95)
            
            if 'active_power' in readings:
                # Ensure P = V × I × cos(φ) (approximately)
                calculated_power = voltage * current * power_factor / 1000  # Convert to kW
                # Blend calculated with generated value (90% calculated, 10% random variation)
                readings['active_power'] = 0.9 * calculated_power + 0.1 * readings['active_power']
            
            if 'apparent_power' in readings:
                # Ensure S = V × I
                calculated_apparent = voltage * current / 1000  # Convert to kVA
                readings['apparent_power'] = 0.9 * calculated_apparent + 0.1 * readings['apparent_power']
        
        # Power factor relationship: cos(φ) = P/S
        if 'active_power' in readings and 'apparent_power' in readings and readings['apparent_power'] > 0:
            calculated_pf = min(1.0, readings['active_power'] / readings['apparent_power'])
            if 'power_factor' in readings:
                readings['power_factor'] = 0.8 * calculated_pf + 0.2 * readings['power_factor']
        
        # Temperature correlation with load
        if 'active_power' in readings and 'temperature' in readings:
            # Higher power → higher temperature (thermal correlation)
            power_normalized = readings['active_power'] / 500000.0  # Normalize to ~500MW
            thermal_increase = power_normalized * 15.0  # Up to 15°C increase at full load
            readings['temperature'] += thermal_increase * 0.3  # 30% correlation
        
        return readings
    
    def _add_time_series_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add time-series features for autoencoder training."""
        print("🔧 Adding time-series features for normal data...")
        
        # Sort by timestamp for time-series features
        df = df.sort_values(['device_id', 'sensor_name', 'timestamp']).reset_index(drop=True)
        
        # Add rolling statistics (grouped by device and sensor)
        for window in [5, 10, 30]:
            df[f'rolling_mean_{window}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
            df[f'rolling_std_{window}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].transform(
                lambda x: x.rolling(window=window, min_periods=1).std().fillna(0)
            )
        
        # Add lag features
        for lag in [1, 5, 10]:
            df[f'lag_{lag}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].shift(lag).fillna(method='bfill')
        
        # Rate of change
        df['rate_of_change'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].pct_change().fillna(0)
        
        # Deviation from nominal (should be small for normal data)
        df['deviation_from_nominal'] = np.where(
            df['nominal_value'].notna(),
            np.abs(df['sensor_value'] - df['nominal_value']) / df['nominal_value'],
            0
        )
        
        # Z-score (should be low for normal data)
        df['z_score'] = (df['sensor_value'] - df['rolling_mean_30']) / (df['rolling_std_30'] + 1e-6)
        
        print(f"✅ Added time-series features. Final shape: {df.shape}")
        return df

def main():
    """Generate normal electrical grid dataset for autoencoder training."""
    print("⚡ Normal Electrical Grid Data Generation")
    print("=========================================")
    print("🎯 Purpose: Train autoencoder on ONLY normal data")
    print("🛡️ Approach: Reconstruction-based anomaly detection")
    print("🚨 Benefit: Detect zero-day attacks via reconstruction error")
    print("")
    
    # Initialize fabricator
    fabricator = NormalElectricalGridFabricator(random_seed=42)
    
    # Generate 36,000 normal samples (will create ~1M total records with 5 devices)
    df = fabricator.generate_normal_grid_dataset(
        samples=36000,
        sample_interval_seconds=5  # 5-second intervals
    )
    
    # Save to file
    output_file = 'data/normal_electrical_grid_1m.csv'
    df.to_csv(output_file, index=False)
    print(f"💾 Normal dataset saved to: {output_file}")
    print(f"📁 File size: {df.memory_usage(deep=True).sum() / 1024**2:.1f} MB")
    
    # Print summary statistics
    print("\n📊 Normal Dataset Summary:")
    print(f"Total samples: {len(df):,}")
    print(f"Devices: {df['device_id'].nunique()}")
    print(f"Sensors: {df['sensor_name'].nunique()}")
    print(f"Anomaly rate: {df['is_anomaly'].mean()*100:.2f}% (Should be 0%)")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    print("\n⚡ Voltage Level Distribution:")
    print(df['voltage_level'].value_counts())
    
    print("\n📈 Sensor Value Statistics (Normal Range Check):")
    for sensor in df['sensor_name'].unique():
        sensor_data = df[df['sensor_name'] == sensor]['sensor_value']
        print(f"{sensor:>20}: {sensor_data.min():>8.2f} - {sensor_data.max():>8.2f} (mean: {sensor_data.mean():>8.2f})")
    
    print("\n✅ Normal electrical grid dataset generation completed!")
    print("🎯 Ready for reconstruction-based autoencoder training!")

if __name__ == "__main__":
    main()