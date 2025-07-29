#!/usr/bin/env python3
"""
Script to generate fabricated industrial sensor data for ML training.
Usage: python generate_sensor_data.py --samples 50000 --facilities all
"""

import argparse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_fabricator import IndustrialDataFabricator


def main():
    parser = argparse.ArgumentParser(description='Generate fabricated industrial sensor data')
    
    parser.add_argument('--samples', type=int, default=50000,
                       help='Number of samples to generate (default: 50000)')
    
    parser.add_argument('--facilities', type=str, default='all',
                       help='Facilities to include: all, water_treatment, nuclear_plant, electrical_grid')
    
    parser.add_argument('--anomaly-rate', type=float, default=0.05,
                       help='Anomaly rate (default: 0.05 = 5%)')
    
    parser.add_argument('--output', type=str, default='data/industrial_sensor_data.csv',
                       help='Output file path')
    
    parser.add_argument('--seed', type=int, default=42,
                       help='Random seed for reproducibility')
    
    args = parser.parse_args()
    
    # Parse facilities
    if args.facilities == 'all':
        facilities = ['water_treatment', 'nuclear_plant', 'electrical_grid']
    else:
        facilities = [f.strip() for f in args.facilities.split(',')]
    
    # Validate facilities
    valid_facilities = ['water_treatment', 'nuclear_plant', 'electrical_grid']
    for facility in facilities:
        if facility not in valid_facilities:
            print(f"❌ Invalid facility: {facility}")
            print(f"Valid options: {valid_facilities}")
            sys.exit(1)
    
    print("🏭 Industrial Sensor Data Fabrication")
    print("="*50)
    print(f"📊 Samples: {args.samples:,}")
    print(f"🏗️ Facilities: {facilities}")
    print(f"🚨 Anomaly rate: {args.anomaly_rate*100:.1f}%")
    print(f"💾 Output: {args.output}")
    print(f"🎲 Seed: {args.seed}")
    print("="*50)
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    
    # Initialize fabricator
    fabricator = IndustrialDataFabricator(random_seed=args.seed)
    
    # Generate dataset
    dataset = fabricator.generate_dataset(
        samples=args.samples,
        facilities=facilities,
        anomaly_rate=args.anomaly_rate
    )
    
    # Save dataset
    fabricator.save_dataset(dataset, args.output)
    
    print(f"\n🎉 Data generation complete!")
    print(f"📁 Dataset saved to: {args.output}")
    print(f"📊 Ready for ML training!")


if __name__ == "__main__":
    main() 