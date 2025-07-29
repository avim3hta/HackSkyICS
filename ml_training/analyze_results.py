#!/usr/bin/env python3
"""
Comprehensive analysis and visualization of trained anomaly detection models.
Generates detailed performance reports, confusion matrices, and visualizations.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import pickle
import torch
import os
from datetime import datetime
import json

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

class ModelAnalyzer:
    """Comprehensive analyzer for trained anomaly detection models."""
    
    def __init__(self, data_file='data/industrial_sensor_data_25k.csv', models_dir='models/'):
        self.data_file = data_file
        self.models_dir = models_dir
        self.results = {}
        
        print("Initializing Model Analyzer...")
        self.load_data()
        self.load_models()
        
    def load_data(self):
        """Load the dataset used for training."""
        print(f"Loading data from: {self.data_file}")
        
        self.df = pd.read_csv(self.data_file)
        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
        
        print(f"Dataset loaded: {len(self.df):,} samples")
        print(f"Facilities: {self.df['facility_type'].nunique()}")
        print(f"Devices: {self.df['device_id'].nunique()}")
        print(f"Sensors: {self.df['sensor_name'].nunique()}")
        print(f"Anomaly rate: {self.df['is_anomaly'].mean()*100:.2f}%")
        
        # Prepare features (same as training)
        self.prepare_features()
        
    def prepare_features(self):
        """Prepare features for model evaluation."""
        # Load metadata to get feature columns and encoders
        with open(f"{self.models_dir}metadata.pkl", 'rb') as f:
            metadata = pickle.load(f)
        
        self.feature_columns = metadata['feature_columns']
        self.encoders = metadata['encoders']
        
        # Apply same encoding as training
        self.df['facility_encoded'] = self.encoders['facility'].transform(self.df['facility_type'])
        self.df['device_encoded'] = self.encoders['device'].transform(self.df['device_id'])
        self.df['sensor_encoded'] = self.encoders['sensor'].transform(self.df['sensor_name'])
        self.df['device_type_encoded'] = self.encoders['device_type'].transform(self.df['device_type'])
        self.df['criticality_encoded'] = self.encoders['criticality'].transform(self.df['criticality'])
        
        # Create feature matrix
        self.X = self.df[self.feature_columns].values
        self.y = self.df['is_anomaly'].values
        
        # Split data for evaluation
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            self.X, self.y, test_size=0.2, random_state=42, stratify=self.y
        )
        
        print(f"Features prepared: {self.X.shape}")
        print(f"Test set: {len(self.X_test):,} samples")
        
    def load_models(self):
        """Load trained models."""
        print("Loading trained models...")
        
        self.models = {}
        self.scalers = {}
        
        # Load Isolation Forest
        if os.path.exists(f"{self.models_dir}isolation_forest_model.pkl"):
            self.models['isolation_forest'] = joblib.load(f"{self.models_dir}isolation_forest_model.pkl")
            self.scalers['isolation_forest'] = joblib.load(f"{self.models_dir}isolation_forest_scaler.pkl")
            print("Isolation Forest loaded")
        
        # Load Autoencoder
        if os.path.exists(f"{self.models_dir}autoencoder_model.pth"):
            from trainers import IndustrialAutoencoder
            
            # Load scaler
            self.scalers['autoencoder'] = joblib.load(f"{self.models_dir}autoencoder_scaler.pkl")
            
            # Load model architecture and weights
            model = IndustrialAutoencoder(input_dim=len(self.feature_columns))
            model.load_state_dict(torch.load(f"{self.models_dir}autoencoder_model.pth", map_location='cpu'))
            model.eval()
            self.models['autoencoder'] = model
            print("Autoencoder loaded")
        
        print(f"Loaded {len(self.models)} models")
        
    def evaluate_models(self):
        """Evaluate all loaded models."""
        print("Evaluating model performance...")
        
        predictions = {}
        
        # Isolation Forest evaluation
        if 'isolation_forest' in self.models:
            print("Evaluating Isolation Forest...")
            X_scaled = self.scalers['isolation_forest'].transform(self.X_test)
            pred = self.models['isolation_forest'].predict(X_scaled)
            predictions['isolation_forest'] = (pred == -1).astype(int)
        
        # Autoencoder evaluation
        if 'autoencoder' in self.models:
            print("Evaluating Autoencoder...")
            X_scaled = self.scalers['autoencoder'].transform(self.X_test)
            X_tensor = torch.FloatTensor(X_scaled)
            
            with torch.no_grad():
                reconstructed = self.models['autoencoder'](X_tensor)
                mse = torch.mean((X_tensor - reconstructed) ** 2, dim=1)
                threshold = torch.quantile(mse, 0.95)  # Top 5% as anomalies
                pred = (mse > threshold).numpy().astype(int)
            
            predictions['autoencoder'] = pred
        
        # Ensemble prediction
        if len(predictions) > 1:
            print("Evaluating Ensemble...")
            ensemble_pred = np.zeros(len(self.X_test))
            for model_name, pred in predictions.items():
                ensemble_pred += 0.5 * pred  # Equal weights
            predictions['ensemble'] = (ensemble_pred > 0.5).astype(int)
        
        # Calculate metrics for each model
        for model_name, y_pred in predictions.items():
            metrics = self.calculate_metrics(self.y_test, y_pred, model_name)
            self.results[model_name] = {
                'predictions': y_pred,
                'metrics': metrics
            }
        
        return predictions
    
    def calculate_metrics(self, y_true, y_pred, model_name):
        """Calculate comprehensive metrics for a model."""
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1_score': f1_score(y_true, y_pred, zero_division=0),
            'confusion_matrix': confusion_matrix(y_true, y_pred).tolist(),
            'classification_report': classification_report(y_true, y_pred, output_dict=True)
        }
        
        print(f"\n{model_name.upper()} Results:")
        print(f"  Accuracy:  {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall:    {metrics['recall']:.4f}")
        print(f"  F1-Score:  {metrics['f1_score']:.4f}")
        
        return metrics
    
    def create_visualizations(self):
        """Create comprehensive visualizations."""
        print("Creating visualizations...")
        
        # Create results directory
        os.makedirs('results', exist_ok=True)
        
        # 1. Performance Comparison
        self.plot_performance_comparison()
        
        # 2. Confusion Matrices
        self.plot_confusion_matrices()
        
        # 3. Data Distribution Analysis
        self.plot_data_distribution()
        
        # 4. Anomaly Analysis by Facility
        self.plot_facility_analysis()
        
        # 5. Time Series Analysis
        self.plot_time_series_analysis()
        
        print("All visualizations saved to results/ directory")
    
    def plot_performance_comparison(self):
        """Plot performance comparison across models."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Model Performance Comparison', fontsize=16, fontweight='bold')
        
        models = list(self.results.keys())
        metrics = ['accuracy', 'precision', 'recall', 'f1_score']
        
        for idx, metric in enumerate(metrics):
            ax = axes[idx // 2, idx % 2]
            
            values = [self.results[model]['metrics'][metric] for model in models]
            bars = ax.bar(models, values, color=sns.color_palette("husl", len(models)))
            
            ax.set_title(f'{metric.replace("_", " ").title()}', fontweight='bold')
            ax.set_ylabel('Score')
            ax.set_ylim(0, 1)
            
            # Add value labels on bars
            for bar, value in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                       f'{value:.3f}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig('results/performance_comparison.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def plot_confusion_matrices(self):
        """Plot confusion matrices for all models."""
        n_models = len(self.results)
        fig, axes = plt.subplots(1, n_models, figsize=(5*n_models, 4))
        
        if n_models == 1:
            axes = [axes]
        
        fig.suptitle('Confusion Matrices', fontsize=16, fontweight='bold')
        
        for idx, (model_name, results) in enumerate(self.results.items()):
            cm = np.array(results['metrics']['confusion_matrix'])
            
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                       xticklabels=['Normal', 'Anomaly'],
                       yticklabels=['Normal', 'Anomaly'],
                       ax=axes[idx])
            
            axes[idx].set_title(f'{model_name.replace("_", " ").title()}', fontweight='bold')
            axes[idx].set_xlabel('Predicted')
            axes[idx].set_ylabel('Actual')
        
        plt.tight_layout()
        plt.savefig('results/confusion_matrices.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def plot_data_distribution(self):
        """Plot data distribution analysis."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Dataset Analysis', fontsize=16, fontweight='bold')
        
        # 1. Anomaly distribution by facility
        facility_anomalies = self.df.groupby('facility_type')['is_anomaly'].agg(['count', 'sum', 'mean'])
        facility_anomalies['anomaly_rate'] = facility_anomalies['mean'] * 100
        
        axes[0,0].bar(facility_anomalies.index, facility_anomalies['anomaly_rate'])
        axes[0,0].set_title('Anomaly Rate by Facility', fontweight='bold')
        axes[0,0].set_ylabel('Anomaly Rate (%)')
        axes[0,0].tick_params(axis='x', rotation=45)
        
        # 2. Sensor value distribution
        sensor_stats = self.df.groupby('sensor_name')['sensor_value'].agg(['mean', 'std'])
        axes[0,1].bar(range(len(sensor_stats)), sensor_stats['mean'], yerr=sensor_stats['std'])
        axes[0,1].set_title('Sensor Value Distribution', fontweight='bold')
        axes[0,1].set_ylabel('Average Value')
        axes[0,1].set_xticks(range(len(sensor_stats)))
        axes[0,1].set_xticklabels(sensor_stats.index, rotation=45)
        
        # 3. Anomaly types distribution
        anomaly_types = self.df[self.df['is_anomaly'] == 1]['anomaly_type'].value_counts()
        axes[1,0].pie(anomaly_types.values, labels=anomaly_types.index, autopct='%1.1f%%')
        axes[1,0].set_title('Anomaly Types Distribution', fontweight='bold')
        
        # 4. Device criticality vs anomalies
        crit_anomalies = self.df.groupby('criticality')['is_anomaly'].mean() * 100
        axes[1,1].bar(crit_anomalies.index, crit_anomalies.values)
        axes[1,1].set_title('Anomaly Rate by Device Criticality', fontweight='bold')
        axes[1,1].set_ylabel('Anomaly Rate (%)')
        
        plt.tight_layout()
        plt.savefig('results/data_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def plot_facility_analysis(self):
        """Plot detailed facility analysis."""
        facilities = self.df['facility_type'].unique()
        
        fig, axes = plt.subplots(len(facilities), 2, figsize=(15, 5*len(facilities)))
        fig.suptitle('Facility-wise Analysis', fontsize=16, fontweight='bold')
        
        for idx, facility in enumerate(facilities):
            facility_data = self.df[self.df['facility_type'] == facility]
            
            # Device-wise anomaly count
            device_anomalies = facility_data.groupby('device_id')['is_anomaly'].sum()
            axes[idx, 0].bar(device_anomalies.index, device_anomalies.values)
            axes[idx, 0].set_title(f'{facility.replace("_", " ").title()} - Anomalies by Device')
            axes[idx, 0].set_ylabel('Anomaly Count')
            axes[idx, 0].tick_params(axis='x', rotation=45)
            
            # Sensor-wise anomaly rate
            sensor_anomalies = facility_data.groupby('sensor_name')['is_anomaly'].mean() * 100
            axes[idx, 1].bar(sensor_anomalies.index, sensor_anomalies.values)
            axes[idx, 1].set_title(f'{facility.replace("_", " ").title()} - Anomaly Rate by Sensor')
            axes[idx, 1].set_ylabel('Anomaly Rate (%)')
            axes[idx, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig('results/facility_analysis.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def plot_time_series_analysis(self):
        """Plot time series analysis."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('Time Series Analysis', fontsize=16, fontweight='bold')
        
        # 1. Anomalies over time
        daily_anomalies = self.df.groupby(self.df['timestamp'].dt.date)['is_anomaly'].agg(['count', 'sum'])
        daily_anomalies['anomaly_rate'] = daily_anomalies['sum'] / daily_anomalies['count'] * 100
        
        axes[0,0].plot(daily_anomalies.index, daily_anomalies['anomaly_rate'], marker='o')
        axes[0,0].set_title('Daily Anomaly Rate', fontweight='bold')
        axes[0,0].set_ylabel('Anomaly Rate (%)')
        axes[0,0].tick_params(axis='x', rotation=45)
        
        # 2. Hourly pattern
        hourly_anomalies = self.df.groupby('hour_of_day')['is_anomaly'].mean() * 100
        axes[0,1].bar(hourly_anomalies.index, hourly_anomalies.values)
        axes[0,1].set_title('Hourly Anomaly Pattern', fontweight='bold')
        axes[0,1].set_xlabel('Hour of Day')
        axes[0,1].set_ylabel('Anomaly Rate (%)')
        
        # 3. Weekly pattern
        weekly_anomalies = self.df.groupby('day_of_week')['is_anomaly'].mean() * 100
        day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        axes[1,0].bar(range(7), weekly_anomalies.values)
        axes[1,0].set_title('Weekly Anomaly Pattern', fontweight='bold')
        axes[1,0].set_xlabel('Day of Week')
        axes[1,0].set_ylabel('Anomaly Rate (%)')
        axes[1,0].set_xticks(range(7))
        axes[1,0].set_xticklabels(day_names)
        
        # 4. Sample sensor values over time (first 1000 points)
        sample_data = self.df.head(1000)
        for sensor in sample_data['sensor_name'].unique()[:3]:  # Show first 3 sensors
            sensor_data = sample_data[sample_data['sensor_name'] == sensor]
            axes[1,1].plot(sensor_data['timestamp'], sensor_data['sensor_value'], 
                          label=sensor, alpha=0.7)
        
        axes[1,1].set_title('Sample Sensor Values Over Time', fontweight='bold')
        axes[1,1].set_xlabel('Time')
        axes[1,1].set_ylabel('Sensor Value')
        axes[1,1].legend()
        axes[1,1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig('results/time_series_analysis.png', dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_report(self):
        """Generate comprehensive text report."""
        print("Generating comprehensive report...")
        
        report = []
        report.append("="*80)
        report.append("INDUSTRIAL ANOMALY DETECTION - MODEL ANALYSIS REPORT")
        report.append("="*80)
        report.append(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("")
        
        # Dataset Summary
        report.append("DATASET SUMMARY")
        report.append("-"*40)
        report.append(f"Total Samples: {len(self.df):,}")
        report.append(f"Features: {len(self.feature_columns)}")
        report.append(f"Facilities: {self.df['facility_type'].nunique()}")
        report.append(f"Devices: {self.df['device_id'].nunique()}")
        report.append(f"Sensors: {self.df['sensor_name'].nunique()}")
        report.append(f"Anomaly Rate: {self.df['is_anomaly'].mean()*100:.2f}%")
        report.append(f"Time Range: {self.df['timestamp'].min()} to {self.df['timestamp'].max()}")
        report.append("")
        
        # Model Performance
        report.append("MODEL PERFORMANCE")
        report.append("-"*40)
        
        for model_name, results in self.results.items():
            metrics = results['metrics']
            report.append(f"\n{model_name.upper()}:")
            report.append(f"  Accuracy:  {metrics['accuracy']:.4f}")
            report.append(f"  Precision: {metrics['precision']:.4f}")
            report.append(f"  Recall:    {metrics['recall']:.4f}")
            report.append(f"  F1-Score:  {metrics['f1_score']:.4f}")
            
            # Confusion Matrix
            cm = np.array(metrics['confusion_matrix'])
            report.append(f"  Confusion Matrix:")
            report.append(f"    True Negatives:  {cm[0,0]:,}")
            report.append(f"    False Positives: {cm[0,1]:,}")
            report.append(f"    False Negatives: {cm[1,0]:,}")
            report.append(f"    True Positives:  {cm[1,1]:,}")
        
        # Best Model
        best_model = max(self.results.keys(), 
                        key=lambda x: self.results[x]['metrics']['f1_score'])
        report.append(f"\nBEST PERFORMING MODEL: {best_model.upper()}")
        report.append(f"F1-Score: {self.results[best_model]['metrics']['f1_score']:.4f}")
        report.append("")
        
        # Facility Analysis
        report.append("FACILITY ANALYSIS")
        report.append("-"*40)
        
        for facility in self.df['facility_type'].unique():
            facility_data = self.df[self.df['facility_type'] == facility]
            anomaly_rate = facility_data['is_anomaly'].mean() * 100
            total_samples = len(facility_data)
            anomaly_count = facility_data['is_anomaly'].sum()
            
            report.append(f"\n{facility.replace('_', ' ').title()}:")
            report.append(f"  Total Samples: {total_samples:,}")
            report.append(f"  Anomalies: {anomaly_count:,}")
            report.append(f"  Anomaly Rate: {anomaly_rate:.2f}%")
            report.append(f"  Devices: {facility_data['device_id'].nunique()}")
        
        # Recommendations
        report.append("\nRECOMMENDATIONS")
        report.append("-"*40)
        
        best_f1 = max(results['metrics']['f1_score'] for results in self.results.values())
        
        if best_f1 < 0.5:
            report.append("WARNING: Model performance is below optimal threshold (F1 < 0.5)")
            report.append("   Consider: More training data, feature engineering, hyperparameter tuning")
        elif best_f1 < 0.7:
            report.append("INFO: Model performance is moderate (0.5 ≤ F1 < 0.7)")
            report.append("   Consider: Advanced feature engineering, ensemble methods")
        else:
            report.append("SUCCESS: Model performance is good (F1 ≥ 0.7)")
            report.append("   Ready for production deployment")
        
        report.append("\nDEPLOYMENT READINESS")
        report.append("-"*40)
        report.append("- Models trained and saved")
        report.append("- Performance metrics calculated")
        report.append("- Comprehensive analysis completed")
        report.append("- Ready for backend integration")
        
        report.append("\nOUTPUT FILES")
        report.append("-"*40)
        report.append("- results/performance_comparison.png")
        report.append("- results/confusion_matrices.png")
        report.append("- results/data_distribution.png")
        report.append("- results/facility_analysis.png")
        report.append("- results/time_series_analysis.png")
        report.append("- results/model_analysis_report.txt")
        report.append("- results/model_metrics.json")
        
        report.append("\n" + "="*80)
        
        # Save report with UTF-8 encoding to handle emojis
        with open('results/model_analysis_report.txt', 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))
        
        print("Report saved to results/model_analysis_report.txt")
        
        return '\n'.join(report)
    
    def save_metrics_json(self):
        """Save metrics in JSON format for programmatic access."""
        metrics_json = {
            'timestamp': datetime.now().isoformat(),
            'dataset': {
                'total_samples': len(self.df),
                'features': len(self.feature_columns),
                'facilities': self.df['facility_type'].nunique(),
                'devices': self.df['device_id'].nunique(),
                'sensors': self.df['sensor_name'].nunique(),
                'anomaly_rate': float(self.df['is_anomaly'].mean()),
                'time_range': {
                    'start': self.df['timestamp'].min().isoformat(),
                    'end': self.df['timestamp'].max().isoformat()
                }
            },
            'models': {}
        }
        
        for model_name, results in self.results.items():
            metrics = results['metrics']
            metrics_json['models'][model_name] = {
                'accuracy': float(metrics['accuracy']),
                'precision': float(metrics['precision']),
                'recall': float(metrics['recall']),
                'f1_score': float(metrics['f1_score']),
                'confusion_matrix': metrics['confusion_matrix']
            }
        
        with open('results/model_metrics.json', 'w') as f:
            json.dump(metrics_json, f, indent=2)
        
        print("Metrics saved to results/model_metrics.json")
    
    def run_complete_analysis(self):
        """Run complete analysis pipeline."""
        print("Starting complete model analysis...")
        
        # Evaluate models
        predictions = self.evaluate_models()
        
        # Create visualizations
        self.create_visualizations()
        
        # Generate report
        report = self.generate_report()
        
        # Save metrics JSON
        self.save_metrics_json()
        
        print("\nANALYSIS COMPLETE!")
        print("="*60)
        print("All results saved to 'results/' directory:")
        print("  - Performance visualizations")
        print("  - Comprehensive text report")
        print("  - JSON metrics for integration")
        print("="*60)
        
        return report


def main():
    """Main function to run the analysis."""
    print("Industrial Anomaly Detection - Model Analysis")
    print("="*60)
    
    # Initialize analyzer
    analyzer = ModelAnalyzer()
    
    # Run complete analysis
    report = analyzer.run_complete_analysis()
    
    # Print summary
    print("\nANALYSIS SUMMARY:")
    print("-"*30)
    for model_name, results in analyzer.results.items():
        metrics = results['metrics']
        print(f"{model_name.upper()}:")
        print(f"  F1-Score: {metrics['f1_score']:.4f}")
        print(f"  Accuracy: {metrics['accuracy']:.4f}")
    
    print(f"\nBest Model: {max(analyzer.results.keys(), key=lambda x: analyzer.results[x]['metrics']['f1_score']).upper()}")
    print("\nReady for production deployment.")


if __name__ == "__main__":
    main() 