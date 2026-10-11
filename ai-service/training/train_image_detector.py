"""
Train a lightweight image authenticity profile from labeled folders.

Expected dataset layout:
training/image_dataset/
  real/
  ai_generated/
  manipulated/
"""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).parent
DATASET_DIR = ROOT / "image_dataset"
OUTPUT_PATH = ROOT / "image_detector_profile.json"
AI_LIKE_LABELS = {"ai_generated", "manipulated"}


def collect_sizes(folder: Path) -> list[int]:
    if not folder.exists():
        return []
    sizes: list[int] = []
    for file in folder.rglob("*"):
        if file.is_file():
            try:
                sizes.append(file.stat().st_size)
            except OSError:
                continue
    return sizes


def mean(values: list[int]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 2)


def main() -> None:
    class_sizes: dict[str, list[int]] = {}
    for label in ["real", "ai_generated", "manipulated"]:
        class_sizes[label] = collect_sizes(DATASET_DIR / label)

    ai_like = class_sizes["ai_generated"] + class_sizes["manipulated"]
    profile = {
        "version": 1,
        "dataset_root": str(DATASET_DIR),
        "total_samples": sum(len(v) for v in class_sizes.values()),
        "class_counts": {k: len(v) for k, v in class_sizes.items()},
        "class_mean_size": {
            "real": mean(class_sizes["real"]),
            "ai_like": mean(ai_like),
        },
        "labels": {
            "real": "real",
            "ai_like": sorted(AI_LIKE_LABELS),
        },
    }

    OUTPUT_PATH.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    print(f"Saved trained profile: {OUTPUT_PATH}")
    print(json.dumps(profile, indent=2))


if __name__ == "__main__":
    main()
