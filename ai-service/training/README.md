# AI Training Notes (Starter)

This folder contains starter datasets and training guidance for stronger AI verification.

## Included sample data
- `sample_text_dataset.csv`: tiny labeled examples (`human`, `ai_generated`).

## Recommended image dataset strategy
Create this structure:

```
training/
  image_dataset/
    real/
    ai_generated/
    manipulated/
```

After adding images, train the detector profile:

```
cd ai-service
python training/train_image_detector.py
```

This generates `training/image_detector_profile.json`, which is automatically loaded by `main.py` and used by `POST /detect-image` for better AI-image detection before complaint submission.

Sources:
- Real civic photos from your field teams.
- AI-generated images (Stable Diffusion, Midjourney, DALL·E) generated for training.
- Edited/manipulated images (compression artifacts, copy-move edits, overlays).

## Baseline model options
- **Image**: EfficientNet-B0 / ResNet18 binary+multiclass head.
- **Text**: DistilBERT (or lightweight TF-IDF + Logistic Regression baseline).

## Integration target contract
Your trained service should expose:
- `POST /detect-image` -> `{ prediction, authenticity_score, confidence, reasons }`
- `POST /detect-text` -> `{ prediction, authenticity_score, confidence, reasons }`

The backend is already wired to consume these endpoints.
