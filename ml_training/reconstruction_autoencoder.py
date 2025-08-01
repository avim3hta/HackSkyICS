#!/usr/bin/env python3
"""
Reconstruction-Based Autoencoder for Electrical Grid Anomaly Detection
Trains ONLY on normal data to learn normal patterns
Detects anomalies via reconstruction error (including zero-day attacks)
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import joblib
from datetime import datetime
import warnings
import os
warnings.filterwarnings('ignore')

class ElectricalGridReconstructionAutoencoder(nn.Module):
    """
    Autoencoder trained ONLY on normal electrical grid data
    Learns to reconstruct normal patterns perfectly
    High reconstruction error = anomaly/attack
    """
    
    def __init__(self, input_dim):
        super().__init__()
        
        # Encoder: Compress normal patterns into latent space
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.15),
            
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.1),
            
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            
            nn.Linear(64, 32)  # Latent representation
        )
        
        # Decoder: Reconstruct normal patterns from latent space
        self.decoder = nn.Sequential(
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.Dropout(0.1),
            
            nn.Linear(128, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(0.15),
            
            nn.Linear(256, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            
            nn.Linear(512, input_dim)  # Reconstruct original input
        )
    
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded
    
    def encode(self, x):
        return self.encoder(x)
    
    def decode(self, encoded):
        return self.decoder(encoded)

class GridAnomalyDetector:
    """
    Reconstruction-based anomaly detector for electrical grid
    Uses autoencoder trained only on normal data
    """
    
    def __init__(self):
        self.autoencoder = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = None
        self.reconstruction_threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"🔥 Using device: {self.device}")
        if torch.cuda.is_available():
            print(f"🚀 GPU: {torch.cuda.get_device_name(0)}")
            print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        else:
            print("⚠️ CUDA not available, using CPU (will be slower)")
    
    def prepare_features(self, df):
        """Prepare features for autoencoder training."""
        print("🔧 Preparing features for autoencoder training...")
        
        # Select numerical features for reconstruction
        numerical_features = [
            'sensor_value', 'nominal_value', 'tolerance_percent',
            'hour_of_day', 'day_of_week', 'day_of_year',
            'rolling_mean_5', 'rolling_mean_10', 'rolling_mean_30',
            'rolling_std_5', 'rolling_std_10', 'rolling_std_30',
            'lag_1', 'lag_5', 'lag_10',
            'rate_of_change', 'deviation_from_nominal', 'z_score'
        ]
        
        # Encode categorical features
        categorical_features = ['device_id', 'device_type', 'sensor_name', 'voltage_level', 'criticality']
        
        feature_df = df[numerical_features + categorical_features].copy()
        
        # Encode categorical variables
        for cat_feature in categorical_features:
            if cat_feature not in self.label_encoders:
                self.label_encoders[cat_feature] = LabelEncoder()
                feature_df[f'{cat_feature}_encoded'] = self.label_encoders[cat_feature].fit_transform(feature_df[cat_feature])
            else:
                feature_df[f'{cat_feature}_encoded'] = self.label_encoders[cat_feature].transform(feature_df[cat_feature])
        
        # Final feature set (numerical + encoded categorical)
        encoded_categorical = [f'{cat}_encoded' for cat in categorical_features]
        self.feature_columns = numerical_features + encoded_categorical
        
        X = feature_df[self.feature_columns].values
        
        # Handle any remaining NaN values
        X = np.nan_to_num(X, nan=0.0)
        
        print(f"✅ Feature preparation complete. Shape: {X.shape}")
        print(f"📊 Features: {len(self.feature_columns)}")
        
        return X
    
    def train(self, normal_data_path, epochs=50, batch_size=1024, learning_rate=0.001):
        """Train autoencoder on ONLY normal electrical grid data."""
        print("🧠 Training Reconstruction Autoencoder")
        print("=====================================")
        print("🎯 Training ONLY on normal data (0% anomalies)")
        print("🛡️ Will detect anomalies via reconstruction error")
        print("")
        
        # Load normal data
        print(f"📂 Loading normal data from: {normal_data_path}")
        df = pd.read_csv(normal_data_path)
        
        # Verify it's all normal data
        anomaly_rate = df['is_anomaly'].mean()
        print(f"✅ Anomaly rate in training data: {anomaly_rate*100:.2f}% (Should be 0%)")
        
        if anomaly_rate > 0.001:  # More than 0.1% anomalies
            print("⚠️ WARNING: Training data contains anomalies! Filtering to normal only...")
            df = df[df['is_anomaly'] == 0].copy()
            print(f"🔧 Filtered to {len(df):,} normal samples")
        
        # Prepare features
        X = self.prepare_features(df)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split into train/validation (950k train, 50k validation)
        val_size = min(50000, int(0.05 * len(X_scaled)))  # 50k or 5% if dataset is smaller
        X_train, X_val = train_test_split(X_scaled, test_size=val_size, random_state=42)
        
        print(f"🎯 Training samples: {X_train.shape[0]:,}")
        print(f"🎯 Validation samples: {X_val.shape[0]:,}")
        
        # Convert to PyTorch tensors
        X_train_tensor = torch.FloatTensor(X_train).to(self.device)
        X_val_tensor = torch.FloatTensor(X_val).to(self.device)
        
        # Create data loaders
        train_dataset = TensorDataset(X_train_tensor, X_train_tensor)  # Input = Output for autoencoder
        val_dataset = TensorDataset(X_val_tensor, X_val_tensor)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Initialize autoencoder
        input_dim = X_train.shape[1]
        self.autoencoder = ElectricalGridReconstructionAutoencoder(input_dim).to(self.device)
        
        # Loss function and optimizer
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.autoencoder.parameters(), lr=learning_rate)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
        
        # Training loop
        train_losses = []
        val_losses = []
        
        print(f"🚀 Starting training for {epochs} epochs...")
        
        for epoch in range(epochs):
            # Training phase
            self.autoencoder.train()
            train_loss = 0.0
            
            for batch_X, batch_y in train_loader:
                optimizer.zero_grad()
                reconstructed = self.autoencoder(batch_X)
                loss = criterion(reconstructed, batch_y)
                loss.backward()
                optimizer.step()
                train_loss += loss.item()
            
            # Validation phase
            self.autoencoder.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for batch_X, batch_y in val_loader:
                    reconstructed = self.autoencoder(batch_X)
                    loss = criterion(reconstructed, batch_y)
                    val_loss += loss.item()
            
            train_loss /= len(train_loader)
            val_loss /= len(val_loader)
            
            train_losses.append(train_loss)
            val_losses.append(val_loss)
            
            scheduler.step(val_loss)
            
            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch+1:3d}/{epochs}: Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
        
        # Calculate reconstruction threshold on validation data
        self.autoencoder.eval()
        reconstruction_errors = []
        
        with torch.no_grad():
            for batch_X, _ in val_loader:
                reconstructed = self.autoencoder(batch_X)
                errors = torch.mean((batch_X - reconstructed) ** 2, dim=1)
                reconstruction_errors.extend(errors.cpu().numpy())
        
        # Set threshold at 95th percentile of normal reconstruction errors
        self.reconstruction_threshold = np.percentile(reconstruction_errors, 95)
        
        print(f"\n✅ Training completed!")
        print(f"🎯 Final validation loss: {val_losses[-1]:.6f}")
        print(f"🚨 Reconstruction threshold: {self.reconstruction_threshold:.6f}")
        print(f"📊 Normal samples above threshold: {np.mean(np.array(reconstruction_errors) > self.reconstruction_threshold)*100:.1f}%")
        
        # Save model and components
        self.save_model()
        
        return train_losses, val_losses
    
    def save_model(self):
        """Save trained model and preprocessing components."""
        os.makedirs('models', exist_ok=True)
        
        # Save PyTorch model
        torch.save(self.autoencoder.state_dict(), 'models/electrical_grid_autoencoder.pth')
        
        # Save preprocessing components
        joblib.dump(self.scaler, 'models/feature_scaler.pkl')
        joblib.dump(self.label_encoders, 'models/label_encoders.pkl')
        joblib.dump(self.feature_columns, 'models/feature_columns.pkl')
        joblib.dump(self.reconstruction_threshold, 'models/reconstruction_threshold.pkl')
        
        print(f"💾 Model saved to models/ directory")
    
    def detect_anomalies(self, X):
        """Detect anomalies using reconstruction error."""
        self.autoencoder.eval()
        X_tensor = torch.FloatTensor(X).to(self.device)
        
        with torch.no_grad():
            reconstructed = self.autoencoder(X_tensor)
            reconstruction_errors = torch.mean((X_tensor - reconstructed) ** 2, dim=1)
            
        reconstruction_errors = reconstruction_errors.cpu().numpy()
        anomaly_scores = reconstruction_errors / self.reconstruction_threshold
        predictions = (reconstruction_errors > self.reconstruction_threshold).astype(int)
        
        return predictions, anomaly_scores, reconstruction_errors

def main():
    """Train reconstruction autoencoder for electrical grid anomaly detection."""
    print("🧠 Electrical Grid Reconstruction Autoencoder Training")
    print("=====================================================")
    print("🎯 Approach: Train ONLY on normal data")
    print("🛡️ Detection: High reconstruction error = anomaly")
    print("🚨 Advantage: Detects zero-day attacks never seen before")
    print("")
    
    # Initialize detector
    detector = GridAnomalyDetector()
    
    # Train on normal data
    normal_data_path = 'data/normal_electrical_grid_1m.csv'
    
    if not os.path.exists(normal_data_path):
        print(f"❌ Normal data file not found: {normal_data_path}")
        print("🔧 Please run normal_grid_fabricator.py first!")
        return
    
    # Train the autoencoder
    train_losses, val_losses = detector.train(
        normal_data_path=normal_data_path,
        epochs=20,  # Reduced for faster training
        batch_size=8192,  # Larger batch size for GPU efficiency
        learning_rate=0.001
    )
    
    print("\n🎭 Model ready for hackathon demo!")
    print("🎯 Usage:")
    print("  1. Normal electrical grid data → Low reconstruction error")
    print("  2. Attack/anomaly data → High reconstruction error → DETECTED!")
    print("  3. Works on zero-day attacks never seen during training!")

if __name__ == "__main__":
    main()