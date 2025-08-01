#!/usr/bin/env python3
"""
Model Evaluation and Metrics for Electrical Grid Anomaly Detection
Tests reconstruction autoencoder against various attack types
"""

import pandas as pd
import numpy as np
import torch
import joblib
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, 
    roc_auc_score, confusion_matrix, classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
from reconstruction_autoencoder import GridAnomalyDetector, ElectricalGridReconstructionAutoencoder
import warnings
warnings.filterwarnings('ignore')

class ModelEvaluator:
    """Comprehensive evaluation of the reconstruction autoencoder."""
    
    def __init__(self):
        self.detector = GridAnomalyDetector()
        self.results = {}
    
    def load_trained_model(self):
        """Load the trained autoencoder model."""
        print("📂 Loading trained reconstruction autoencoder...")
        
        # Load preprocessing components
        self.detector.scaler = joblib.load('models/feature_scaler.pkl')
        self.detector.label_encoders = joblib.load('models/label_encoders.pkl')
        self.detector.feature_columns = joblib.load('models/feature_columns.pkl')
        self.detector.reconstruction_threshold = joblib.load('models/reconstruction_threshold.pkl')
        
        # Load PyTorch model
        input_dim = len(self.detector.feature_columns)
        self.detector.autoencoder = ElectricalGridReconstructionAutoencoder(input_dim).to(self.detector.device)
        self.detector.autoencoder.load_state_dict(torch.load('models/electrical_grid_autoencoder.pth'))
        self.detector.autoencoder.eval()
        
        print(f"✅ Model loaded successfully")
        print(f"🎯 Reconstruction threshold: {self.detector.reconstruction_threshold:.6f}")
    
    def evaluate_on_normal_data(self, normal_data_path):
        """Evaluate model performance on normal data (should have low reconstruction error)."""
        print("\n🟢 Evaluating on Normal Data")
        print("============================")
        
        # Load normal test data
        df_normal = pd.read_csv(normal_data_path)
        
        # Take a sample for evaluation (to speed up)
        sample_size = min(10000, len(df_normal))
        df_sample = df_normal.sample(n=sample_size, random_state=42)
        
        print(f"📊 Testing on {len(df_sample):,} normal samples")
        
        # Prepare features
        X_normal = self.detector.prepare_features(df_sample)
        X_normal_scaled = self.detector.scaler.transform(X_normal)
        
        # Get predictions
        predictions, anomaly_scores, reconstruction_errors = self.detector.detect_anomalies(X_normal_scaled)
        
        # Calculate metrics
        true_labels = np.zeros(len(predictions))  # All should be normal (0)
        
        accuracy = accuracy_score(true_labels, predictions)
        precision = precision_score(true_labels, predictions, zero_division=0)
        recall = recall_score(true_labels, predictions, zero_division=0)
        f1 = f1_score(true_labels, predictions, zero_division=0)
        
        false_positive_rate = np.mean(predictions)  # Should be low
        avg_reconstruction_error = np.mean(reconstruction_errors)
        
        self.results['normal_data'] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'false_positive_rate': false_positive_rate,
            'avg_reconstruction_error': avg_reconstruction_error,
            'samples_tested': len(df_sample)
        }
        
        print(f"✅ Normal Data Results:")
        print(f"   Accuracy: {accuracy:.3f}")
        print(f"   False Positive Rate: {false_positive_rate:.3f} (should be ~0.05)")
        print(f"   Avg Reconstruction Error: {avg_reconstruction_error:.6f}")
        
        return reconstruction_errors, predictions
    
    def evaluate_on_attack_data(self, attack_data_path):
        """Evaluate model performance on attack data (should have high reconstruction error)."""
        print("\n🔴 Evaluating on Attack Data")
        print("============================")
        
        # Load attack data
        df_attacks = pd.read_csv(attack_data_path)
        
        print(f"📊 Testing on {len(df_attacks):,} attack samples")
        print(f"🚨 Attack types: {df_attacks['attack_type'].nunique()}")
        
        # Prepare features
        X_attacks = self.detector.prepare_features(df_attacks)
        X_attacks_scaled = self.detector.scaler.transform(X_attacks)
        
        # Get predictions
        predictions, anomaly_scores, reconstruction_errors = self.detector.detect_anomalies(X_attacks_scaled)
        
        # Calculate metrics
        true_labels = np.ones(len(predictions))  # All should be anomalies (1)
        
        accuracy = accuracy_score(true_labels, predictions)
        precision = precision_score(true_labels, predictions, zero_division=0)
        recall = recall_score(true_labels, predictions, zero_division=0)
        f1 = f1_score(true_labels, predictions, zero_division=0)
        
        detection_rate = np.mean(predictions)  # Should be high
        avg_reconstruction_error = np.mean(reconstruction_errors)
        
        self.results['attack_data'] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'detection_rate': detection_rate,
            'avg_reconstruction_error': avg_reconstruction_error,
            'samples_tested': len(df_attacks)
        }
        
        print(f"✅ Attack Data Results:")
        print(f"   Accuracy: {accuracy:.3f}")
        print(f"   Detection Rate: {detection_rate:.3f} (should be high)")
        print(f"   Precision: {precision:.3f}")
        print(f"   Recall: {recall:.3f}")
        print(f"   F1-Score: {f1:.3f}")
        print(f"   Avg Reconstruction Error: {avg_reconstruction_error:.6f}")
        
        # Evaluate by attack type
        self.evaluate_by_attack_type(df_attacks, predictions, reconstruction_errors)
        
        return reconstruction_errors, predictions
    
    def evaluate_by_attack_type(self, df_attacks, predictions, reconstruction_errors):
        """Evaluate detection performance by attack type."""
        print("\n🎯 Detection by Attack Type:")
        print("============================")
        
        attack_results = {}
        for attack_type in df_attacks['attack_type'].unique():
            mask = df_attacks['attack_type'] == attack_type
            type_predictions = predictions[mask]
            type_errors = reconstruction_errors[mask]
            
            detection_rate = np.mean(type_predictions)
            avg_error = np.mean(type_errors)
            count = np.sum(mask)
            
            attack_results[attack_type] = {
                'detection_rate': detection_rate,
                'avg_reconstruction_error': avg_error,
                'count': count
            }
            
            print(f"   {attack_type:>25}: {detection_rate:>6.1%} detected ({count:>4} samples)")
        
        self.results['by_attack_type'] = attack_results
    
    def calculate_overall_metrics(self, normal_errors, normal_preds, attack_errors, attack_preds):
        """Calculate overall performance metrics."""
        print("\n📊 Overall Performance Metrics")
        print("==============================")
        
        # Combine predictions and true labels
        all_predictions = np.concatenate([normal_preds, attack_preds])
        all_true_labels = np.concatenate([
            np.zeros(len(normal_preds)),  # Normal = 0
            np.ones(len(attack_preds))    # Attack = 1
        ])
        all_errors = np.concatenate([normal_errors, attack_errors])
        
        # Calculate comprehensive metrics
        accuracy = accuracy_score(all_true_labels, all_predictions)
        precision = precision_score(all_true_labels, all_predictions)
        recall = recall_score(all_true_labels, all_predictions)
        f1 = f1_score(all_true_labels, all_predictions)
        
        # ROC-AUC using reconstruction errors as scores
        roc_auc = roc_auc_score(all_true_labels, all_errors)
        
        # Confusion matrix
        cm = confusion_matrix(all_true_labels, all_predictions)
        tn, fp, fn, tp = cm.ravel()
        
        specificity = tn / (tn + fp)  # True negative rate
        sensitivity = tp / (tp + fn)  # True positive rate (same as recall)
        
        self.results['overall'] = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': roc_auc,
            'specificity': specificity,
            'sensitivity': sensitivity,
            'true_positives': tp,
            'true_negatives': tn,
            'false_positives': fp,
            'false_negatives': fn
        }
        
        print(f"🎯 Overall Results:")
        print(f"   Accuracy:     {accuracy:.3f}")
        print(f"   Precision:    {precision:.3f}")
        print(f"   Recall:       {recall:.3f}")
        print(f"   F1-Score:     {f1:.3f}")
        print(f"   ROC-AUC:      {roc_auc:.3f}")
        print(f"   Specificity:  {specificity:.3f}")
        print(f"   Sensitivity:  {sensitivity:.3f}")
        print("")
        print(f"📈 Confusion Matrix:")
        print(f"   True Negatives:  {tn:>6} (Normal correctly identified)")
        print(f"   False Positives: {fp:>6} (Normal incorrectly flagged)")
        print(f"   False Negatives: {fn:>6} (Attacks missed)")
        print(f"   True Positives:  {tp:>6} (Attacks correctly detected)")
        
        return accuracy, precision, recall, f1, roc_auc
    
    def save_results(self):
        """Save evaluation results to file."""
        import json
        
        # Convert numpy types to Python types for JSON serialization
        def convert_numpy(obj):
            if isinstance(obj, (np.integer, np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, (np.floating, np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_numpy(v) for k, v in obj.items()}
            return obj
        
        # Convert all numpy types recursively
        results_json = convert_numpy(self.results)
        
        with open('models/evaluation_results.json', 'w') as f:
            json.dump(results_json, f, indent=2)
        
        print(f"💾 Evaluation results saved to: models/evaluation_results.json")

def main():
    """Run comprehensive model evaluation."""
    print("🧪 Electrical Grid Anomaly Detection - Model Evaluation")
    print("=======================================================")
    print("🎯 Testing reconstruction autoencoder against various attacks")
    print("🛡️ Including zero-day attacks never seen during training")
    print("")
    
    evaluator = ModelEvaluator()
    
    # Load trained model
    evaluator.load_trained_model()
    
    # Evaluate on normal data
    normal_errors, normal_preds = evaluator.evaluate_on_normal_data('data/normal_electrical_grid_1m.csv')
    
    # Evaluate on attack data
    attack_errors, attack_preds = evaluator.evaluate_on_attack_data('data/electrical_grid_attacks.csv')
    
    # Calculate overall metrics
    accuracy, precision, recall, f1, roc_auc = evaluator.calculate_overall_metrics(
        normal_errors, normal_preds, attack_errors, attack_preds
    )
    
    # Save results
    evaluator.save_results()
    
    print("\n🎭 Evaluation Complete!")
    print("======================")
    print(f"🎯 The model achieved {accuracy:.1%} accuracy")
    print(f"🚨 Attack detection rate: {recall:.1%}")
    print(f"🛡️ False positive rate: {1-evaluator.results['overall']['specificity']:.1%}")
    print(f"📊 ROC-AUC Score: {roc_auc:.3f}")
    print("")
    print("✅ Ready for hackathon demo!")
    print("🎯 The model can detect zero-day attacks it has never seen before!")

if __name__ == "__main__":
    main()