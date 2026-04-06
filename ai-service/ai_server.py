import sys
import os

sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid

from my_predict import SteganographyPredictor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

my_predictor = SteganographyPredictor()


def save_temp_file(upload_file):
    filename = f"temp_{uuid.uuid4().hex}_{upload_file.filename}"
    with open(filename, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return filename


def delete_temp_file(path):
    if os.path.exists(path):
        os.remove(path)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    temp_path = None

    try:
        # ===== Validate =====
        if not file.filename:
            return JSONResponse(status_code=400, content={"error": "No file uploaded"})

        if not file.filename.lower().endswith((".png", ".jpg", ".jpeg")):
            return JSONResponse(status_code=400, content={"error": "Invalid file type"})

        # ===== Save temp =====
        temp_path = save_temp_file(file)

        # ===== Predict =====
        result = my_predictor.predict_image(temp_path)

        if not result or "error" in result:
            return JSONResponse(
                status_code=400,
                content={"error": "Prediction failed"}
            )

        # ===== Response =====
        return {
            "prediction": result["prediction"],
            "label": "stego" if result["prediction"] == "STEGO" else "clean",
            "confidence": float(result["confidence"]),
            "probability_stego": float(result["probability_stego"])
        }

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    finally:
        if temp_path:
            delete_temp_file(temp_path)


@app.get("/")
def home():
    return {"message": "AI Server running 🚀"}