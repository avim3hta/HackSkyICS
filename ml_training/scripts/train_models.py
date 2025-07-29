#!/usr/bin/env python3
"""
Script to train CUDA-accelerated anomaly detection models.
Usage: python train_models.py --use-cuda --batch-size 1024
"""

import argparse
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from trainers import EnsembleAnomalyTrainer
import torch


def main():
    parser = argparse.ArgumentParser(description='Train CUDA-accelerated anomaly detection models')
    
    parser.add_argument('--data', type=str, default='data/industrial_sensor_data.csv',
                       help='Path to training data CSV file')
    
    parser.add_argument('--use-cuda', action='store_true',
                       help='Use CUDA acceleration if available')
    
    parser.add_argument('--batch-size', type=int, default=1024,
                       help='Batch size for training (default: 1024)')
    
    parser.add_argument('--epochs', type=int, default=100,
                       help='Number of epochs for deep learning models (default: 100)')
    
    parser.add_argument('--learning-rate', type=float, default=0.001,
                       help='Learning rate for deep learning models (default: 0.001)')
    
    parser.add_argument('--output-dir', type=str, default='models/',
                       help='Directory to save trained models (default: models/)')
    
    parser.add_argument('--seed', type=int, default=42,
                       help='Random seed for reproducibility')
    
    parser.add_argument('--isolation-forest-trees', type=int, default=200,
                       help='Number of trees for Isolation Forest (default: 200)')
    
    parser.add_argument('--contamination', type=float, default=0.05,
                       help='Contamination rate for Isolation Forest (default: 0.05)')
    
    parser.add_argument('--autoencoder-hidden', type=str, default='128,64,32',
                       help='Hidden layer dimensions for autoencoder (default: 128,64,32)')
    
    parser.add_argument('--lstm-hidden', type=int, default=64,
                       help='LSTM hidden size (default: 64)')
    
    parser.add_argument('--lstm-layers', type=int, default=2,
                       help='Number of LSTM layers (default: 2)')
    
    parser.add_argument('--sequence-length', type=int, default=10,
                       help='Sequence length for LSTM (default: 10)')
    
    args = parser.parse_args()
    
    # Check if data file exists
    if not os.path.exists(args.data):
        print(f"❌ Data file not found: {args.data}")
        print("💡 Run generate_sensor_data.py first to create training data")
        sys.exit(1)
    
    # Check CUDA availability
    cuda_available = torch.cuda.is_available()
    if args.use_cuda and not cuda_available:
        print("⚠️ CUDA requested but not available, falling back to CPU")
        args.use_cuda = False
    
    print("🤖 Industrial Anomaly Detection Training")
    print("="*60)
    print(f"📂 Data: {args.data}")
    print(f"🎮 Device: {'CUDA' if args.use_cuda else 'CPU'}")
    if args.use_cuda:
        print(f"🔥 GPU: {torch.cuda.get_device_name()}")
        print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"📊 Batch Size: {args.batch_size}")
    print(f"🔄 Epochs: {args.epochs}")
    print(f"📈 Learning Rate: {args.learning_rate}")
    print(f"💾 Output: {args.output_dir}")
    print("="*60)
    
    # Parse autoencoder hidden dimensions
    hidden_dims = [int(x.strip()) for x in args.autoencoder_hidden.split(',')]
    
    # Initialize trainer
    trainer = EnsembleAnomalyTrainer(use_cuda=args.use_cuda, random_seed=args.seed)
    
    # Load data
    trainer.load_data(args.data)
    
    print("\n🚀 Starting model training...")
    
    # Train Isolation Forest
    print("\n" + "="*40)
    trainer.train_isolation_forest(
        contamination=args.contamination,
        n_estimators=args.isolation_forest_trees
    )
    
    # Train Autoencoder
    print("\n" + "="*40)
    trainer.train_autoencoder(
        hidden_dims=hidden_dims,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate
    )
    
    # Train LSTM
    print("\n" + "="*40)
    trainer.train_lstm_detector(
        sequence_length=args.sequence_length,
        hidden_size=args.lstm_hidden,
        num_layers=args.lstm_layers,
        epochs=args.epochs // 2,  # Fewer epochs for LSTM
        batch_size=args.batch_size // 2,  # Smaller batch for sequences
        learning_rate=args.learning_rate
    )
    
    # Create ensemble
    trainer._create_ensemble()
    
    print("\n" + "="*40)
    print("📊 Evaluating models...")
    
    # Evaluate models
    evaluation_results = trainer.evaluate_models()
    
    print("\n" + "="*40)
    print("💾 Saving models...")
    
    # Save models
    trainer.save_models(args.output_dir)
    
    print("\n🎉 Training Complete!")
    print("="*60)
    
    # Print final summary
    print("📈 Final Performance Summary:")
    for model_name, results in evaluation_results.items():
        print(f"\n{model_name.upper()}:")
        print(f"  Accuracy:  {results['accuracy']:.4f}")
        print(f"  Precision: {results['precision']:.4f}")
        print(f"  Recall:    {results['recall']:.4f}")
        print(f"  F1-Score:  {results['f1_score']:.4f}")
    
    print(f"\n💾 Models saved to: {args.output_dir}")
    print("🚀 Ready for deployment and real-time inference!")
    
    # Print next steps
    print("\n📋 Next Steps:")
    print("1. Integrate models with backend API")
    print("2. Test real-time inference performance")
    print("3. Deploy to production environment")
    print("4. Monitor model performance over time")


if __name__ == "__main__":
    main() 