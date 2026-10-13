# Visual tagging and photo search — evaluation results

Measured on 13 Oct 2026 on the shop's real catalogue: **49 saree designs, 272 colour variants, 543 photos** (supplier WhatsApp photos), with category, fabric, occasions and colour names labelled by the owner. Produced by `scripts/evaluate-vision.mjs`; raw numbers in `results-clip-vit-base-patch32.json` and `results-clip-vit-base-patch16.json`. The catalogue itself is private and not in this repository.

Models: OpenAI CLIP ViT-B/32 and ViT-B/16 (8-bit quantised ONNX, via transformers.js), used **without any training on our data**.

## RQ1 — Zero-shot tagging from one photo

Top-1 accuracy on each colour's main photo (272 photos). *Naive* = the label as a plain phrase; *expert* = several saree-specific descriptions per label, averaged. Fabric and occasion count as correct if the prediction is one of the saree's labels.

| Attribute | Classes | Chance | Always the most common | B/32 naive | B/32 expert | B/16 naive | B/16 expert |
|---|---|---|---|---|---|---|---|
| Colour (primary) | 14 | 7.1% | 13.2% | 53.3% | 58.8% | 59.2% | 59.6% |
| Category | 9 | 11.1% | 21.0% | 12.1% | 21.7% | 12.5% | 14.3% |
| Fabric family | 9 | 12.6% | 44.4% | 27.4% | 10.9% | 21.4% | 21.4% |
| Occasion | 5 | 38.8% | 65.8% | 43.0% | 57.7% | 45.2% | 46.7% |

**Finding:** zero-shot CLIP recognises **colour** well (7–8× chance), but saree-specific labels (Paithani vs Banarasi vs Silk, georgette vs silk, wedding vs festive) are at or below the "always guess the most common" baseline. Expert prompts help category and occasion with B/32 but are not reliable across models.

## RQ1b — Labels from the most similar sarees (k-nearest neighbours, k = 7)

Each saree is labelled only from **other** sarees' photos (leave-one-saree-out), which is exactly the situation when the owner adds a new saree.

| Attribute | Always the most common | B/32 k-NN | B/16 k-NN |
|---|---|---|---|
| Colour (primary) | 13.2% | 27.6% | 29.0% |
| Category | 21.0% | 35.7% | 44.1% |
| Fabric family | 44.4% | 50.8% | 52.6% |
| Occasion | 65.8% | 67.6% | 66.2% |

**Finding:** using the shop's own labelled sarees beats zero-shot text prompts for category and fabric. Colour is still best from zero-shot prompts. The deployed "Suggest details from photo" therefore combines both: **colour from prompts, category / fabric / occasion from similar sarees**. Accuracy is expected to rise as the catalogue grows (only 49 designs today).

## RQ2 — Search by photo (find the same design from a different photo)

Leave-one-photo-out over all 543 photos: each photo is the query, all others are the gallery.

| Find the same… | Model | Queries | Recall@1 | Recall@5 | mAP | Random Recall@1 |
|---|---|---|---|---|---|---|
| design | B/32 | 543 | **86.6%** | **95.8%** | 46.5% | 2.3% |
| design | B/16 | 543 | 88.2% | 94.7% | 47.3% | 2.3% |
| colour of the design | B/32 | 411 | 20.2% | 45.3% | 20.8% | 0.3% |
| colour of the design | B/16 | 411 | 24.3% | 45.7% | 23.8% | 0.3% |

**Finding:** photo search finds the right saree first **87% of the time** and within the top 5 **96%** of the time — about 38× better than random. Telling apart colours of the *same* design from one photo is much harder (20–24% at rank 1), because many supplier photos show several colours together.

## RQ3 — Cost

| Model | Embedding time per photo (laptop CPU) | First-time model download in the browser |
|---|---|---|
| B/32 | 24 ms | 85 MB (image part only), then cached |
| B/16 | 55 ms | about twice as large |

B/32 is deployed: almost the same search quality as B/16 at less than half the time and size, which matters for customers on phones. Total running cost: ₹0 (the model runs in the customer's browser; similarity search runs inside the existing free PostgreSQL database with pgvector).

## Limitations and next steps

- Small catalogue (49 designs); several labels have only 1–3 sarees (e.g. Chiffon, Festive Specials).
- Labels are the owner's single judgement; categories overlap (a Banarasi saree is also silk).
- Next: repeat as the catalogue grows; compare a fashion-specific model; test Hindi / Marathi text search with a multilingual model; small user study with the owner on how many suggestions she accepts.
