"""
VeriClaim optional AI microservice.
Enhances Node heuristics with lightweight text/image signals.
Run: uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

import os
import re
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="VeriClaim AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    title: str = ""
    description: str = ""
    image_path: str | None = None


class DetectImageRequest(BaseModel):
    image_path: str | None = None


class DetectTextRequest(BaseModel):
    title: str = ""
    description: str = ""


KEYWORD_MAP: list[tuple[list[str], str]] = [
    (["garbage", "trash", "waste"], "garbage"),
    (["water", "leak", "pipe"], "water_leakage"),
    (["drain", "sewage"], "drainage"),
    (["road", "pothole"], "road_damage"),
    (["electric", "power"], "electricity"),
    (["street light", "lamp"], "street_light"),
    (["pollution", "smoke"], "pollution"),
]

TRAINED_IMAGE_PROFILE_PATH = Path(__file__).parent / "training" / "image_detector_profile.json"


def load_image_profile() -> dict[str, Any]:
    if not TRAINED_IMAGE_PROFILE_PATH.exists():
        return {}
    try:
        with TRAINED_IMAGE_PROFILE_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


IMAGE_PROFILE = load_image_profile()


def predict_category(text: str) -> tuple[str, float]:
    t = text.lower()
    best = ("other", 0)
    for keys, cat in KEYWORD_MAP:
        score = sum(1 for k in keys if k in t)
        if score > best[1]:
            best = (cat, score)
    conf = 0.35 + min(0.55, best[1] * 0.12) if best[1] else 0.28
    return best[0], conf


def text_fake_score(title: str, description: str) -> tuple[float, list[str]]:
    text = f"{title} {description}".lower()
    reasons: list[str] = []
    score = 0.0
    if len(description.strip()) < 25:
        score += 0.2
        reasons.append("Short description")
    if re.search(r"(lorem ipsum|as an ai language model|fake complaint)", text):
        score += 0.45
        reasons.append("Suspicious phrase detected")
    if re.search(r"(alien|ufo|hack everything|destroy city|take over planet|ghost attack)", text):
        score += 0.5
        reasons.append("Unrealistic or non-civic complaint wording")
    words = description.lower().split()
    if len(words) > 10:
        uniq = len(set(words)) / len(words)
        if uniq < 0.35:
            score += 0.25
            reasons.append("Low lexical diversity")
    return min(1.0, score), reasons


def image_fake_score(rel_path: str | None) -> tuple[float, list[str]]:
    if not rel_path:
        return 0.0, []
    reasons: list[str] = []
    base = Path(os.getenv("BACKEND_ROOT", "..")) / "backend"
    full = (base / rel_path.lstrip("/")).resolve()
    try:
        name = full.name.lower()
        if re.search(r"(ai|midjourney|stable.?diffusion|dall.?e|generated|synthetic|fake)", name):
            return 0.65, ["Filename indicates AI-generated image source"]
        size = full.stat().st_size
        if IMAGE_PROFILE:
            class_means = IMAGE_PROFILE.get("class_mean_size", {})
            real_mean = float(class_means.get("real", 0) or 0)
            ai_mean = float(class_means.get("ai_like", 0) or 0)
            if real_mean > 0 and ai_mean > 0:
                dist_real = abs(size - real_mean)
                dist_ai = abs(size - ai_mean)
                if dist_ai < dist_real:
                    reasons.append("Trained profile: image resembles AI-generated size distribution")
                    return 0.62, reasons
                reasons.append("Trained profile: image resembles real-photo size distribution")
                return 0.1, reasons
        if size < 6000:
            return 0.22, ["Very small image file"]
        if size > 5_000_000:
            return 0.12, ["Unusually large image"]
    except OSError:
        return 0.15, ["Image not found on disk for microservice"]
    return 0.0, reasons


def image_authenticity(rel_path: str | None) -> tuple[str, float, float, list[str]]:
    fake_score, reasons = image_fake_score(rel_path)
    authenticity = round(max(0.0, 1.0 - fake_score), 4)
    if authenticity < 0.5:
        pred = "fake"
    elif authenticity < 0.65:
        pred = "suspicious"
    else:
        pred = "real"
    return pred, authenticity, authenticity, reasons


def text_authenticity(title: str, description: str) -> tuple[str, float, float, list[str]]:
    fake_score, reasons = text_fake_score(title, description)
    authenticity = round(max(0.0, 1.0 - fake_score), 4)
    if authenticity < 0.5:
        pred = "ai_generated"
    elif authenticity < 0.65:
        pred = "suspicious"
    else:
        pred = "human"
    return pred, authenticity, authenticity, reasons


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true", "service": "vericlaim-ai"}


@app.post("/analyze")
def analyze(body: AnalyzeRequest) -> dict[str, Any]:
    text = f"{body.title}\n{body.description}"
    cat, conf = predict_category(text)
    t_score, t_reasons = text_fake_score(body.title, body.description)
    i_score, i_reasons = image_fake_score(body.image_path)
    reasons = t_reasons + i_reasons
    return {
        "category": cat,
        "category_confidence": round(conf, 4),
        "text_fake_score": round(t_score, 4),
        "image_fake_score": round(i_score, 4),
        "reasons": reasons,
    }


@app.post("/detect-image")
def detect_image(body: DetectImageRequest) -> dict[str, Any]:
    prediction, authenticity_score, confidence, reasons = image_authenticity(body.image_path)
    return {
        "prediction": prediction,
        "authenticity_score": authenticity_score,
        "confidence": confidence,
        "reasons": reasons,
        "detectors": ["size-pattern", "artifact-heuristic"],
    }


@app.post("/detect-text")
def detect_text(body: DetectTextRequest) -> dict[str, Any]:
    prediction, authenticity_score, confidence, reasons = text_authenticity(body.title, body.description)
    return {
        "prediction": prediction,
        "authenticity_score": authenticity_score,
        "confidence": confidence,
        "reasons": reasons,
        "detectors": ["heuristic-nlp", "spam-pattern"],
    }
