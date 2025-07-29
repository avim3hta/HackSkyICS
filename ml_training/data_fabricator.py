import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import random
from dataclasses import dataclass
from enum import Enum
import json


class FacilityType(Enum):
    WATER_TREATMENT = "water_treatment"
    NUCLEAR_PLANT = "nuclear_plant"
    ELECTRICAL_GRID = "electrical_grid"


class AnomalyType(Enum):
    SENSOR_DRIFT = "sensor_drift"
    SPIKE_ANOMALY = "spike_anomaly"
    SENSOR_FAILURE = "sensor_failure"
    PROCESS_ANOMALY = "process_anomaly"
    CYBER_ATTACK = "cyber_attack"


@dataclass
class SensorConfig:
    name: str
    range_min: float
    range_max: float
    unit: str
    noise_level: float = 0.02
    drift_rate: float = 0.001
    seasonal_amplitude: float = 0.1


@dataclass
class DeviceConfig:
    device_id: str
    device_type: str
    sensors: List[SensorConfig]
    facility: FacilityType
    criticality: str = "medium"


class IndustrialDataFabricator:
    """
    Fabricates realistic industrial sensor data for training anomaly detection models.
    Generates 50,000+ samples with temporal patterns, cross-sensor correlations, and anomalies.
    """
    
    def __init__(self, random_seed: int = 42):
        np.random.seed(random_seed)
        random.seed(random_seed)
        
        self.sensor_configs = self._initialize_sensor_configs()
        self.facility_configs = self._initialize_facility_configs()
        self.anomaly_generators = self._initialize_anomaly_generators()
        
    def _initialize_sensor_configs(self) -> Dict[str, SensorConfig]:
        """Initialize sensor configurations with realistic industrial parameters."""
        return {
            'temperature': SensorConfig(
                name='temperature',
                range_min=15.0,
                range_max=350.0,
                unit='°C',
                noise_level=0.5,
                seasonal_amplitude=5.0
            ),
            'pressure': SensorConfig(
                name='pressure',
                range_min=0.0,
                range_max=200.0,
                unit='bar',
                noise_level=0.1,
                seasonal_amplitude=2.0
            ),
            'flow_rate': SensorConfig(
                name='flow_rate',
                range_min=0.0,
                range_max=5000.0,
                unit='L/min',
                noise_level=10.0,
                seasonal_amplitude=100.0
            ),
            'vibration': SensorConfig(
                name='vibration',
                range_min=0.0,
                range_max=2.0,
                unit='mm/s',
                noise_level=0.05,
                seasonal_amplitude=0.1
            ),
            'power_output': SensorConfig(
                name='power_output',
                range_min=0.0,
                range_max=1000.0,
                unit='MW',
                noise_level=5.0,
                seasonal_amplitude=50.0
            ),
            'voltage': SensorConfig(
                name='voltage',
                range_min=100000.0,
                range_max=120000.0,
                unit='V',
                noise_level=500.0,
                seasonal_amplitude=2000.0
            ),
            'current': SensorConfig(
                name='current',
                range_min=0.0,
                range_max=1000.0,
                unit='A',
                noise_level=5.0,
                seasonal_amplitude=20.0
            ),
            'frequency': SensorConfig(
                name='frequency',
                range_min=59.5,
                range_max=60.5,
                unit='Hz',
                noise_level=0.01,
                seasonal_amplitude=0.05
            ),
            'level': SensorConfig(
                name='level',
                range_min=0.0,
                range_max=100.0,
                unit='%',
                noise_level=1.0,
                seasonal_amplitude=5.0
            ),
            'quality': SensorConfig(
                name='quality',
                range_min=90.0,
                range_max=100.0,
                unit='%',
                noise_level=0.5,
                seasonal_amplitude=2.0
            )
        }
    
    def _initialize_facility_configs(self) -> Dict[FacilityType, List[DeviceConfig]]:
        """Initialize facility-specific device configurations."""
        configs = {}
        
        # Water Treatment Plant
        configs[FacilityType.WATER_TREATMENT] = [
            DeviceConfig(
                device_id="PUMP_001",
                device_type="pump",
                sensors=[
                    self.sensor_configs['temperature'],
                    self.sensor_configs['pressure'],
                    self.sensor_configs['flow_rate'],
                    self.sensor_configs['vibration']
                ],
                facility=FacilityType.WATER_TREATMENT,
                criticality="high"
            ),
            DeviceConfig(
                device_id="PUMP_002",
                device_type="pump",
                sensors=[
                    self.sensor_configs['temperature'],
                    self.sensor_configs['pressure'],
                    self.sensor_configs['flow_rate'],
                    self.sensor_configs['vibration']
                ],
                facility=FacilityType.WATER_TREATMENT,
                criticality="high"
            ),
            DeviceConfig(
                device_id="VALVE_A",
                device_type="valve",
                sensors=[
                    self.sensor_configs['pressure'],
                    self.sensor_configs['flow_rate']
                ],
                facility=FacilityType.WATER_TREATMENT,
                criticality="medium"
            ),
            DeviceConfig(
                device_id="VALVE_B",
                device_type="valve",
                sensors=[
                    self.sensor_configs['pressure'],
                    self.sensor_configs['flow_rate']
                ],
                facility=FacilityType.WATER_TREATMENT,
                criticality="medium"
            ),
            DeviceConfig(
                device_id="TANK_MAIN",
                device_type="tank",
                sensors=[
                    self.sensor_configs['level'],
                    self.sensor_configs['temperature'],
                    self.sensor_configs['quality']
                ],
                facility=FacilityType.WATER_TREATMENT,
                criticality="critical"
            )
        ]
        
        # Nuclear Power Plant
        configs[FacilityType.NUCLEAR_PLANT] = [
            DeviceConfig(
                device_id="REACTOR_001",
                device_type="reactor",
                sensors=[
                    self.sensor_configs['temperature'],
                    self.sensor_configs['pressure'],
                    self.sensor_configs['power_output']
                ],
                facility=FacilityType.NUCLEAR_PLANT,
                criticality="critical"
            ),
            DeviceConfig(
                device_id="COOLANT_A",
                device_type="coolant_system",
                sensors=[
                    self.sensor_configs['temperature'],
                    self.sensor_configs['pressure'],
                    self.sensor_configs['flow_rate']
                ],
                facility=FacilityType.NUCLEAR_PLANT,
                criticality="critical"
            ),
            DeviceConfig(
                device_id="TURBINE_001",
                device_type="turbine",
                sensors=[
                    self.sensor_configs['temperature'],
                    self.sensor_configs['vibration'],
                    self.sensor_configs['power_output']
                ],
                facility=FacilityType.NUCLEAR_PLANT,
                criticality="high"
            ),
            DeviceConfig(
                device_id="GENERATOR_001",
                device_type="generator",
                sensors=[
                    self.sensor_configs['voltage'],
                    self.sensor_configs['current'],
                    self.sensor_configs['frequency'],
                    self.sensor_configs['power_output']
                ],
                facility=FacilityType.NUCLEAR_PLANT,
                criticality="high"
            )
        ]
        
        # Electrical Grid
        configs[FacilityType.ELECTRICAL_GRID] = [
            DeviceConfig(
                device_id="TRANSFORMER_A",
                device_type="transformer",
                sensors=[
                    self.sensor_configs['voltage'],
                    self.sensor_configs['current'],
                    self.sensor_configs['temperature']
                ],
                facility=FacilityType.ELECTRICAL_GRID,
                criticality="critical"
            ),
            DeviceConfig(
                device_id="GENERATOR_001",
                device_type="generator",
                sensors=[
                    self.sensor_configs['voltage'],
                    self.sensor_configs['current'],
                    self.sensor_configs['frequency'],
                    self.sensor_configs['power_output']
                ],
                facility=FacilityType.ELECTRICAL_GRID,
                criticality="high"
            ),
            DeviceConfig(
                device_id="SUBSTATION_001",
                device_type="substation",
                sensors=[
                    self.sensor_configs['voltage'],
                    self.sensor_configs['current'],
                    self.sensor_configs['frequency']
                ],
                facility=FacilityType.ELECTRICAL_GRID,
                criticality="high"
            )
        ]
        
        return configs
    
    def _initialize_anomaly_generators(self) -> Dict[AnomalyType, callable]:
        """Initialize anomaly generation functions."""
        return {
            AnomalyType.SENSOR_DRIFT: self._generate_sensor_drift,
            AnomalyType.SPIKE_ANOMALY: self._generate_spike_anomaly,
            AnomalyType.SENSOR_FAILURE: self._generate_sensor_failure,
            AnomalyType.PROCESS_ANOMALY: self._generate_process_anomaly,
            AnomalyType.CYBER_ATTACK: self._generate_cyber_attack
        }
    
    def generate_dataset(
        self,
        samples: int = 50000,
        facilities: List[str] = None,
        anomaly_rate: float = 0.05,
        start_date: datetime = None,
        sample_interval_seconds: int = 60
    ) -> pd.DataFrame:
        """
        Generate a comprehensive dataset with realistic industrial sensor data.
        
        Args:
            samples: Number of samples to generate (default: 50,000)
            facilities: List of facilities to include (default: all)
            anomaly_rate: Percentage of anomalous samples (default: 5%)
            start_date: Start date for time series (default: 30 days ago)
            sample_interval_seconds: Interval between samples in seconds
            
        Returns:
            pandas.DataFrame: Generated dataset with sensor readings and labels
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=30)
        
        if facilities is None:
            facilities = [f.value for f in FacilityType]
        
        # Convert facility names to enum types
        facility_types = [FacilityType(f) for f in facilities]
        
        print(f"🏭 Generating {samples:,} samples for {len(facility_types)} facilities...")
        print(f"📊 Anomaly rate: {anomaly_rate*100:.1f}%")
        print(f"⏰ Time range: {start_date} to {start_date + timedelta(seconds=samples*sample_interval_seconds)}")
        
        all_data = []
        anomaly_indices = set(np.random.choice(samples, int(samples * anomaly_rate), replace=False))
        
        # Generate base time series
        timestamps = [start_date + timedelta(seconds=i * sample_interval_seconds) for i in range(samples)]
        
        for facility_type in facility_types:
            devices = self.facility_configs[facility_type]
            
            for device in devices:
                print(f"  📟 Generating data for {device.device_id} ({facility_type.value})...")
                
                device_data = self._generate_device_data(
                    device=device,
                    timestamps=timestamps,
                    anomaly_indices=anomaly_indices
                )
                
                all_data.extend(device_data)
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        # Add derived features
        df = self._add_derived_features(df)
        
        print(f"✅ Generated {len(df):,} total sensor readings")
        print(f"📈 Normal samples: {len(df[df['is_anomaly'] == 0]):,}")
        print(f"🚨 Anomalous samples: {len(df[df['is_anomaly'] == 1]):,}")
        
        return df
    
    def _generate_device_data(
        self,
        device: DeviceConfig,
        timestamps: List[datetime],
        anomaly_indices: set
    ) -> List[Dict]:
        """Generate sensor data for a specific device."""
        device_data = []
        
        # Initialize sensor baselines
        sensor_baselines = {}
        for sensor in device.sensors:
            sensor_baselines[sensor.name] = np.random.uniform(
                sensor.range_min + (sensor.range_max - sensor.range_min) * 0.2,
                sensor.range_min + (sensor.range_max - sensor.range_min) * 0.8
            )
        
        for i, timestamp in enumerate(timestamps):
            # Generate normal readings
            readings = self._generate_normal_readings(
                device=device,
                timestamp=timestamp,
                baselines=sensor_baselines,
                sample_index=i
            )
            
            # Apply anomalies if this sample is marked as anomalous
            is_anomaly = i in anomaly_indices
            anomaly_type = None
            
            if is_anomaly:
                anomaly_type = np.random.choice(list(AnomalyType))
                readings = self._apply_anomaly(readings, anomaly_type, device)
            
            # Create data record
            for sensor_name, value in readings.items():
                sensor_config = next(s for s in device.sensors if s.name == sensor_name)
                
                record = {
                    'timestamp': timestamp,
                    'facility_type': device.facility.value,
                    'device_id': device.device_id,
                    'device_type': device.device_type,
                    'sensor_name': sensor_name,
                    'sensor_value': value,
                    'sensor_unit': sensor_config.unit,
                    'criticality': device.criticality,
                    'is_anomaly': 1 if is_anomaly else 0,
                    'anomaly_type': anomaly_type.value if anomaly_type else None,
                    'hour_of_day': timestamp.hour,
                    'day_of_week': timestamp.weekday(),
                    'day_of_year': timestamp.timetuple().tm_yday
                }
                
                device_data.append(record)
        
        return device_data
    
    def _generate_normal_readings(
        self,
        device: DeviceConfig,
        timestamp: datetime,
        baselines: Dict[str, float],
        sample_index: int
    ) -> Dict[str, float]:
        """Generate normal sensor readings with realistic patterns."""
        readings = {}
        
        for sensor in device.sensors:
            baseline = baselines[sensor.name]
            
            # Time-based patterns
            hour_factor = np.sin(2 * np.pi * timestamp.hour / 24)
            day_factor = np.sin(2 * np.pi * timestamp.weekday() / 7)
            seasonal_factor = np.sin(2 * np.pi * timestamp.timetuple().tm_yday / 365)
            
            # Combine patterns
            pattern_value = (
                baseline +
                sensor.seasonal_amplitude * hour_factor * 0.5 +
                sensor.seasonal_amplitude * day_factor * 0.3 +
                sensor.seasonal_amplitude * seasonal_factor * 0.2
            )
            
            # Add realistic noise
            noise = np.random.normal(0, sensor.noise_level)
            
            # Add gradual drift
            drift = sensor.drift_rate * sample_index * np.random.normal(0, 0.1)
            
            # Apply cross-sensor correlations
            correlation_factor = self._apply_cross_sensor_correlations(
                device, sensor.name, readings, baselines
            )
            
            final_value = pattern_value + noise + drift + correlation_factor
            
            # Ensure value is within sensor range
            final_value = np.clip(final_value, sensor.range_min, sensor.range_max)
            
            readings[sensor.name] = round(final_value, 3)
        
        return readings
    
    def _apply_cross_sensor_correlations(
        self,
        device: DeviceConfig,
        current_sensor: str,
        existing_readings: Dict[str, float],
        baselines: Dict[str, float]
    ) -> float:
        """Apply realistic cross-sensor correlations."""
        correlation_factor = 0.0
        
        # Define correlation rules based on industrial physics
        correlations = {
            ('temperature', 'pressure'): 0.3,
            ('temperature', 'flow_rate'): -0.2,
            ('pressure', 'flow_rate'): 0.4,
            ('vibration', 'temperature'): 0.2,
            ('power_output', 'temperature'): 0.5,
            ('voltage', 'current'): 0.6,
            ('frequency', 'voltage'): 0.3
        }
        
        for (sensor1, sensor2), correlation in correlations.items():
            if current_sensor == sensor1 and sensor2 in existing_readings:
                other_value = existing_readings[sensor2]
                other_baseline = baselines[sensor2]
                deviation = (other_value - other_baseline) / other_baseline
                correlation_factor += correlation * deviation * baselines[current_sensor] * 0.1
            elif current_sensor == sensor2 and sensor1 in existing_readings:
                other_value = existing_readings[sensor1]
                other_baseline = baselines[sensor1]
                deviation = (other_value - other_baseline) / other_baseline
                correlation_factor += correlation * deviation * baselines[current_sensor] * 0.1
        
        return correlation_factor
    
    def _apply_anomaly(
        self,
        readings: Dict[str, float],
        anomaly_type: AnomalyType,
        device: DeviceConfig
    ) -> Dict[str, float]:
        """Apply specific anomaly type to sensor readings."""
        anomaly_generator = self.anomaly_generators[anomaly_type]
        return anomaly_generator(readings, device)
    
    def _generate_sensor_drift(self, readings: Dict[str, float], device: DeviceConfig) -> Dict[str, float]:
        """Generate gradual sensor drift anomaly."""
        modified_readings = readings.copy()
        
        # Select random sensor to drift
        sensor_name = random.choice(list(readings.keys()))
        sensor_config = next(s for s in device.sensors if s.name == sensor_name)
        
        # Apply gradual drift (5-20% of range)
        drift_amount = np.random.uniform(0.05, 0.2) * (sensor_config.range_max - sensor_config.range_min)
        drift_direction = random.choice([-1, 1])
        
        modified_readings[sensor_name] += drift_direction * drift_amount
        modified_readings[sensor_name] = np.clip(
            modified_readings[sensor_name],
            sensor_config.range_min,
            sensor_config.range_max
        )
        
        return modified_readings
    
    def _generate_spike_anomaly(self, readings: Dict[str, float], device: DeviceConfig) -> Dict[str, float]:
        """Generate sudden spike anomaly."""
        modified_readings = readings.copy()
        
        # Select random sensor for spike
        sensor_name = random.choice(list(readings.keys()))
        sensor_config = next(s for s in device.sensors if s.name == sensor_name)
        
        # Generate spike (50-200% of normal value)
        spike_multiplier = np.random.uniform(1.5, 3.0)
        
        modified_readings[sensor_name] *= spike_multiplier
        modified_readings[sensor_name] = np.clip(
            modified_readings[sensor_name],
            sensor_config.range_min,
            sensor_config.range_max
        )
        
        return modified_readings
    
    def _generate_sensor_failure(self, readings: Dict[str, float], device: DeviceConfig) -> Dict[str, float]:
        """Generate sensor failure anomaly (stuck or dead sensor)."""
        modified_readings = readings.copy()
        
        # Select random sensor to fail
        sensor_name = random.choice(list(readings.keys()))
        sensor_config = next(s for s in device.sensors if s.name == sensor_name)
        
        failure_type = random.choice(['stuck', 'dead', 'out_of_range'])
        
        if failure_type == 'stuck':
            # Sensor stuck at previous value (simulate with random constant)
            modified_readings[sensor_name] = np.random.uniform(
                sensor_config.range_min,
                sensor_config.range_max
            )
        elif failure_type == 'dead':
            # Sensor reading zero or minimum
            modified_readings[sensor_name] = sensor_config.range_min
        else:  # out_of_range
            # Sensor reading beyond normal range
            if random.choice([True, False]):
                modified_readings[sensor_name] = sensor_config.range_max * 1.1
            else:
                modified_readings[sensor_name] = sensor_config.range_min * 0.9
        
        return modified_readings
    
    def _generate_process_anomaly(self, readings: Dict[str, float], device: DeviceConfig) -> Dict[str, float]:
        """Generate process-level anomaly affecting multiple sensors."""
        modified_readings = readings.copy()
        
        # Affect multiple correlated sensors
        affected_sensors = random.sample(list(readings.keys()), min(3, len(readings)))
        
        # Apply coordinated changes (simulate process upset)
        upset_factor = np.random.uniform(0.8, 1.3)
        
        for sensor_name in affected_sensors:
            sensor_config = next(s for s in device.sensors if s.name == sensor_name)
            
            modified_readings[sensor_name] *= upset_factor
            modified_readings[sensor_name] = np.clip(
                modified_readings[sensor_name],
                sensor_config.range_min,
                sensor_config.range_max
            )
        
        return modified_readings
    
    def _generate_cyber_attack(self, readings: Dict[str, float], device: DeviceConfig) -> Dict[str, float]:
        """Generate cyber attack anomaly (malicious data manipulation)."""
        modified_readings = readings.copy()
        
        attack_type = random.choice(['data_injection', 'replay_attack', 'man_in_middle'])
        
        if attack_type == 'data_injection':
            # Inject false readings
            for sensor_name in readings.keys():
                if random.random() < 0.3:  # 30% chance per sensor
                    sensor_config = next(s for s in device.sensors if s.name == sensor_name)
                    # Inject random value within range
                    modified_readings[sensor_name] = np.random.uniform(
                        sensor_config.range_min,
                        sensor_config.range_max
                    )
        
        elif attack_type == 'replay_attack':
            # Replay old values (simulate with slight variations)
            for sensor_name in readings.keys():
                if random.random() < 0.5:  # 50% chance per sensor
                    # Add small random variation to simulate replay
                    variation = np.random.normal(0, readings[sensor_name] * 0.01)
                    modified_readings[sensor_name] += variation
        
        else:  # man_in_middle
            # Subtle manipulation to hide attack
            for sensor_name in readings.keys():
                if random.random() < 0.4:  # 40% chance per sensor
                    # Small but consistent bias
                    bias = readings[sensor_name] * np.random.uniform(-0.05, 0.05)
                    modified_readings[sensor_name] += bias
        
        return modified_readings
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features for enhanced ML training."""
        print("🔧 Adding derived features...")
        
        # Sort by timestamp and device for proper time-series features
        df = df.sort_values(['facility_type', 'device_id', 'sensor_name', 'timestamp'])
        
        # Add rolling statistics (per sensor)
        for window in [5, 10, 30]:
            df[f'rolling_mean_{window}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].transform(
                lambda x: x.rolling(window=window, min_periods=1).mean()
            )
            df[f'rolling_std_{window}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].transform(
                lambda x: x.rolling(window=window, min_periods=1).std().fillna(0)
            )
        
        # Add lag features
        for lag in [1, 5, 10]:
            df[f'lag_{lag}'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].shift(lag)
        
        # Add rate of change (handle division by zero)
        df['rate_of_change'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].pct_change()
        df['rate_of_change'] = df['rate_of_change'].replace([np.inf, -np.inf], 0)
        
        # Add z-score (standardized value, handle division by zero)
        df['z_score'] = df.groupby(['device_id', 'sensor_name'])['sensor_value'].transform(
            lambda x: (x - x.mean()) / (x.std() + 1e-8)  # Add small epsilon to prevent division by zero
        )
        df['z_score'] = df['z_score'].replace([np.inf, -np.inf], 0)
        
        # Fill NaN values and handle infinite values
        df = df.fillna(method='bfill').fillna(method='ffill')
        
        # Replace infinite values with NaN and then fill
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.fillna(method='bfill').fillna(method='ffill')
        
        # If still NaN, fill with 0
        df = df.fillna(0)
        
        return df
    
    def save_dataset(self, df: pd.DataFrame, filepath: str) -> None:
        """Save the generated dataset to file."""
        df.to_csv(filepath, index=False)
        print(f"💾 Dataset saved to: {filepath}")
        print(f"📊 Dataset shape: {df.shape}")
        
        # Print summary statistics
        print("\n📈 Dataset Summary:")
        print(f"  Total samples: {len(df):,}")
        print(f"  Facilities: {df['facility_type'].nunique()}")
        print(f"  Devices: {df['device_id'].nunique()}")
        print(f"  Sensors: {df['sensor_name'].nunique()}")
        print(f"  Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        print(f"  Anomaly rate: {df['is_anomaly'].mean()*100:.2f}%")


if __name__ == "__main__":
    # Example usage
    fabricator = IndustrialDataFabricator(random_seed=42)
    
    # Generate comprehensive dataset
    dataset = fabricator.generate_dataset(
        samples=50000,
        facilities=['water_treatment', 'nuclear_plant', 'electrical_grid'],
        anomaly_rate=0.05
    )
    
    # Save dataset
    fabricator.save_dataset(dataset, 'data/industrial_sensor_data_50k.csv')
    
    print("\n🎉 Data fabrication complete!")
    print("Ready for ML training with CUDA acceleration! 🚀") 