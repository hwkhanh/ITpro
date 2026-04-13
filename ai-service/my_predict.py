import pickle
import numpy as np
from pathlib import Path
from knn import FeatureExtractor


class SteganographyPredictor:
    """Use trained models to predict steganography in images"""

    def __init__(self, models_dir='models'):
        self.models_dir = Path(models_dir)
        self.models = {}
        self.scaler = None
        self.load_models()

    def load_models(self):
        """Load ONLY GradientBoosting model"""
        try:
            # Load scaler
            scaler_path = self.models_dir / 'scaler.pkl'
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            print("✓ Scaler loaded")

            # 👉 CHỈ GIỮ 1 MODEL
            model_files = {
                'GradientBoosting': 'gradientboosting_model.pkl'
            }

            for model_name, filename in model_files.items():
                model_path = self.models_dir / filename
                with open(model_path, 'rb') as f:
                    self.models[model_name] = pickle.load(f)
                print(f"✓ {model_name} model loaded")

        except FileNotFoundError as e:
            print(f"✗ Error loading model: {e}")
            raise

    def predict_image(self, image_path, model_name='GradientBoosting'):
        """Predict if image contains steganography"""

        # Extract features
        features = FeatureExtractor.extract_all_features(image_path)
        if features is None:
            return None

        # Scale features
        features_scaled = self.scaler.transform(features.reshape(1, -1))

        # Validate model
        if model_name not in self.models:
            return None

        model = self.models[model_name]

        # Predict
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]

        return {
            'image': str(image_path),
            'prediction': 'STEGO' if prediction == 1 else 'COVER',
            'confidence': float(max(probabilities)),
            'probability_cover': float(probabilities[0]),
            'probability_stego': float(probabilities[1])
        }