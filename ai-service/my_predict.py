import pickle
import numpy as np
from pathlib import Path
from knn import FeatureExtractor


class SteganographyPredictor:
    """Production-ready predictor using ONLY GradientBoosting"""

    def __init__(self, models_dir='models'):
        self.models_dir = Path(models_dir)
        self.model = None
        self.scaler = None
        self.load_model()

    def load_model(self):
        """Load scaler + GradientBoosting model ONLY"""
        try:
            # Load scaler
            with open(self.models_dir / 'scaler.pkl', 'rb') as f:
                self.scaler = pickle.load(f)
            print("✓ Scaler loaded")

            # Load GradientBoosting model
            with open(self.models_dir / 'gradientboosting_model.pkl', 'rb') as f:
                self.model = pickle.load(f)
            print("✓ GradientBoosting model loaded")

        except FileNotFoundError as e:
            print(f"✗ Model file not found: {e}")
            raise

        except Exception as e:
            print(f"✗ Error loading model: {e}")
            raise

    def predict_image(self, image_path):
        """Predict steganography"""
        try:
            # Extract features
            features = FeatureExtractor.extract_all_features(image_path)

            if features is None:
                return {"error": "Feature extraction failed"}

            # Scale
            features = np.array(features)
            features_scaled = self.scaler.transform(features.reshape(1, -1))

            # Predict
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]

            return {
                'prediction': 'STEGO' if prediction == 1 else 'COVER',
                'confidence': float(max(probabilities)),
                'probability_stego': float(probabilities[1])
            }

        except Exception as e:
            print(f"Prediction error: {e}")
            return {"error": str(e)}