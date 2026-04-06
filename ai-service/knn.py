"""
Steganography Detection Model using Machine Learning

This script builds a machine learning pipeline to detect steganographic images
vs. cover images using KNN and other ML algorithms.
"""

import os
import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score, roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import pickle
from datetime import datetime

# Configuration
DATA_DIR = Path("data")
TRAIN_DIR = DATA_DIR / "train"
TEST_DIR = DATA_DIR / "test"
VAL_DIR = DATA_DIR / "val"
MODELS_DIR = Path("models")
RESULTS_DIR = Path("results")

# Create directories
MODELS_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)


class FeatureExtractor:
    """Extract features from images for machine learning"""
    
    @staticmethod
    def extract_statistics(image):
        """Extract statistical features from image"""
        features = []
        
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Basic statistics
        features.append(np.mean(gray))
        features.append(np.std(gray))
        features.append(np.min(gray))
        features.append(np.max(gray))
        features.append(np.var(gray))
        
        # Histogram features
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        hist = hist.flatten() / hist.sum()
        features.extend(hist[:8])  # First 8 bins
        
        return np.array(features)
    
    @staticmethod
    def extract_edge_features(image):
        """Extract edge-based features"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Canny edge detection
        edges = cv2.Canny(gray, 100, 200)
        
        # Count edges
        edge_count = np.count_nonzero(edges)
        edge_ratio = edge_count / edges.size
        
        # Sobel features
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        
        features = [
            edge_ratio,
            np.mean(np.abs(sobelx)),
            np.mean(np.abs(sobely)),
            np.std(sobelx),
            np.std(sobely)
        ]
        
        return np.array(features)
    
    @staticmethod
    def extract_texture_features(image):
        """Extract LBP (Local Binary Pattern) features"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Simplified texture features using variance and entropy
        features = []
        
        # Block-based variance
        block_size = 8
        for i in range(0, gray.shape[0] - block_size, block_size):
            for j in range(0, gray.shape[1] - block_size, block_size):
                block = gray[i:i+block_size, j:j+block_size]
                features.append(np.var(block))
        
        # Take mean and std of block variances
        features = np.array(features)
        if len(features) > 0:
            return np.array([np.mean(features), np.std(features)])
        else:
            return np.array([0, 0])
    
    @staticmethod
    def extract_all_features(image_path):
        """Extract all features from an image"""
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                return None
            
            # Resize to consistent size
            image = cv2.resize(image, (256, 256))
            
            # Extract different feature sets
            stats = FeatureExtractor.extract_statistics(image)
            edges = FeatureExtractor.extract_edge_features(image)
            texture = FeatureExtractor.extract_texture_features(image)
            
            # Combine all features
            all_features = np.concatenate([stats, edges, texture])
            
            return all_features
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None


class SteganographyDetector:
    """Main detector class"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.models = {}
        self.metrics = {}
    
    def load_dataset(self):
        """Load and prepare dataset"""
        print("Loading dataset...")
        
        X_train, y_train = self._load_images_from_dir(TRAIN_DIR)
        X_test, y_test = self._load_images_from_dir(TEST_DIR)
        X_val, y_val = self._load_images_from_dir(VAL_DIR)
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        print(f"Validation set: {len(X_val)} samples")
        
        return (X_train, y_train), (X_test, y_test), (X_val, y_val)
    
    def _load_images_from_dir(self, base_dir):
        """Load images from directory structure"""
        X = []
        y = []
        
        # Load cover images (label 0)
        cover_dir = base_dir / "cover"
        if cover_dir.exists():
            for img_path in tqdm(sorted(cover_dir.glob("*.png")), desc=f"Loading cover from {base_dir.name}"):
                features = FeatureExtractor.extract_all_features(img_path)
                if features is not None:
                    X.append(features)
                    y.append(0)  # Cover image
        
        # Load stego images (label 1)
        stego_dir = base_dir / "stego"
        if stego_dir.exists():
            for img_path in tqdm(sorted(stego_dir.glob("*.png")), desc=f"Loading stego from {base_dir.name}"):
                features = FeatureExtractor.extract_all_features(img_path)
                if features is not None:
                    X.append(features)
                    y.append(1)  # Stego image
        
        return np.array(X), np.array(y)
    
    def train(self, X_train, y_train):
        """Train multiple models"""
        print("\nScaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        print("Training models...")
        
        # KNN
        print("  - K-Nearest Neighbors...")
        self.models['KNN'] = KNeighborsClassifier(n_neighbors=5, n_jobs=-1)
        self.models['KNN'].fit(X_train_scaled, y_train)
        
        # Random Forest
        print("  - Random Forest...")
        self.models['RandomForest'] = RandomForestClassifier(
            n_estimators=100, max_depth=15, n_jobs=-1, random_state=42
        )
        self.models['RandomForest'].fit(X_train_scaled, y_train)
        
        # Gradient Boosting
        print("  - Gradient Boosting...")
        self.models['GradientBoosting'] = GradientBoostingClassifier(
            n_estimators=100, max_depth=5, random_state=42
        )
        self.models['GradientBoosting'].fit(X_train_scaled, y_train)
        
        # SVM
        print("  - Support Vector Machine...")
        self.models['SVM'] = SVC(kernel='rbf', probability=True, random_state=42)
        self.models['SVM'].fit(X_train_scaled, y_train)
        
        print("Models trained successfully!")
    
    def evaluate(self, X_test, y_test, dataset_name="Test"):
        """Evaluate all models"""
        print(f"\nEvaluating on {dataset_name} Set")
        print("=" * 60)
        
        X_test_scaled = self.scaler.transform(X_test)
        
        results = {}
        
        for model_name, model in self.models.items():
            print(f"\n{model_name}:")
            
            # Predictions
            y_pred = model.predict(X_test_scaled)
            y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None
            
            # Metrics
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred)
            rec = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            
            print(f"  Accuracy:  {acc:.4f}")
            print(f"  Precision: {prec:.4f}")
            print(f"  Recall:    {rec:.4f}")
            print(f"  F1-Score:  {f1:.4f}")
            
            if y_pred_proba is not None:
                auc = roc_auc_score(y_test, y_pred_proba)
                print(f"  AUC-ROC:   {auc:.4f}")
                results[model_name] = {
                    'accuracy': acc, 'precision': prec, 'recall': rec,
                    'f1': f1, 'auc': auc, 'y_pred': y_pred, 'y_pred_proba': y_pred_proba
                }
            else:
                results[model_name] = {
                    'accuracy': acc, 'precision': prec, 'recall': rec,
                    'f1': f1, 'y_pred': y_pred, 'y_pred_proba': None
                }
            
            # Confusion matrix
            cm = confusion_matrix(y_test, y_pred)
            print(f"  Confusion Matrix:\n{cm}")
        
        self.metrics[dataset_name] = results
        return results
    
    def visualize_results(self, y_test):
        """Visualize results"""
        print("\nGenerating visualizations...")
        
        # Create comparison plot
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        
        metrics_names = ['accuracy', 'precision', 'recall', 'f1']
        
        for idx, metric in enumerate(metrics_names):
            ax = axes[idx // 2, idx % 2]
            
            values = [self.metrics['Test'][model].get(metric, 0) 
                     for model in self.models.keys()]
            
            bars = ax.bar(self.models.keys(), values, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'])
            ax.set_ylabel('Score')
            ax.set_title(f'{metric.capitalize()} Comparison')
            ax.set_ylim(0, 1)
            
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.3f}', ha='center', va='bottom')
        
        plt.tight_layout()
        plt.savefig(RESULTS_DIR / 'model_comparison.png', dpi=300, bbox_inches='tight')
        print("Saved: model_comparison.png")
        
        # Confusion matrices
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        axes = axes.flatten()
        
        for idx, (model_name, model) in enumerate(self.models.items()):
            X_test_scaled = self.scaler.transform(self.X_test)
            y_pred = model.predict(X_test_scaled)
            cm = confusion_matrix(y_test, y_pred)
            
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[idx],
                       cbar=False, xticklabels=['Cover', 'Stego'],
                       yticklabels=['Cover', 'Stego'])
            axes[idx].set_title(f'{model_name}')
            axes[idx].set_ylabel('True Label')
            axes[idx].set_xlabel('Predicted Label')
        
        plt.tight_layout()
        plt.savefig(RESULTS_DIR / 'confusion_matrices.png', dpi=300, bbox_inches='tight')
        print("Saved: confusion_matrices.png")
        
        # ROC curves
        fig, ax = plt.subplots(figsize=(10, 8))
        
        for model_name in self.models.keys():
            metrics = self.metrics['Test'][model_name]
            if metrics.get('y_pred_proba') is not None:
                fpr, tpr, _ = roc_curve(y_test, metrics['y_pred_proba'])
                auc = metrics.get('auc', 0)
                ax.plot(fpr, tpr, label=f'{model_name} (AUC = {auc:.3f})', linewidth=2)
        
        ax.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
        ax.set_xlabel('False Positive Rate')
        ax.set_ylabel('True Positive Rate')
        ax.set_title('ROC Curve Comparison')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(RESULTS_DIR / 'roc_curves.png', dpi=300, bbox_inches='tight')
        print("Saved: roc_curves.png")
    
    def save_models(self):
        """Save trained models"""
        print("\nSaving models...")
        
        for model_name, model in self.models.items():
            model_path = MODELS_DIR / f"{model_name.lower().replace(' ', '_')}_model.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(model, f)
            print(f"  Saved: {model_path}")
        
        # Save scaler
        scaler_path = MODELS_DIR / "scaler.pkl"
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        print(f"  Saved: {scaler_path}")
    
    def predict_image(self, image_path, model_name='KNN'):
        """Predict on a single image"""
        features = FeatureExtractor.extract_all_features(image_path)
        if features is None:
            return None
        
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        model = self.models[model_name]
        
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        return {
            'prediction': 'Stego' if prediction == 1 else 'Cover',
            'confidence': max(probability),
            'probabilities': {'Cover': probability[0], 'Stego': probability[1]}
        }


def main():
    """Main execution"""
    print("=" * 70)
    print("STEGANOGRAPHY DETECTION SYSTEM")
    print("=" * 70)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Initialize detector
    detector = SteganographyDetector()
    
    # Load dataset
    (X_train, y_train), (X_test, y_test), (X_val, y_val) = detector.load_dataset()
    
    # Store test data for later use
    detector.X_test = X_test
    
    # Train models
    detector.train(X_train, y_train)
    
    # Evaluate on test set
    detector.evaluate(X_test, y_test, "Test")
    
    # Evaluate on validation set
    detector.evaluate(X_val, y_val, "Validation")
    
    # Visualize results
    detector.visualize_results(y_test)
    
    # Save models
    detector.save_models()
    
    # Save summary report
    summary_path = RESULTS_DIR / f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    with open(summary_path, 'w') as f:
        f.write("STEGANOGRAPHY DETECTION - SUMMARY REPORT\n")
        f.write("=" * 70 + "\n")
        f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("DATASET STATISTICS\n")
        f.write("-" * 70 + "\n")
        f.write(f"Training samples: {len(X_train)}\n")
        f.write(f"Test samples: {len(X_test)}\n")
        f.write(f"Validation samples: {len(X_val)}\n")
        f.write(f"Feature dimension: {X_train.shape[1]}\n\n")
        
        f.write("MODEL PERFORMANCE (TEST SET)\n")
        f.write("-" * 70 + "\n")
        for model_name, metrics in detector.metrics['Test'].items():
            f.write(f"\n{model_name}:\n")
            f.write(f"  Accuracy:  {metrics['accuracy']:.4f}\n")
            f.write(f"  Precision: {metrics['precision']:.4f}\n")
            f.write(f"  Recall:    {metrics['recall']:.4f}\n")
            f.write(f"  F1-Score:  {metrics['f1']:.4f}\n")
            if 'auc' in metrics:
                f.write(f"  AUC-ROC:   {metrics['auc']:.4f}\n")
    
    print(f"\nReport saved: {summary_path}")
    print("\n" + "=" * 70)
    print("EXECUTION COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
