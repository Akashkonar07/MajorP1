# Real catalogue (not in Git)

The real saree catalogue lives in this folder **on Yuvraj's laptop only**. It is
git-ignored because the GitHub repo is public and `products.json` contains the
owner's private base prices (admin-only, project brief §2) and supplier messages.

Contents after cleaning on 11 Oct 2026:

| | Count |
|---|---|
| Sarees (`products.json`) | 49 |
| Colour variants | 272 |
| WebP photos (`images/VLS-xxx/`) | 543 |

- Removed on purpose: VLS-003, VLS-005, VLS-006, VLS-042 (codes keep their gaps).
- VLS-040 confirmed (kept).
- `unmatched/` (8 photos without details) is never published.
- `_original_parts/` holds the original 3 zip parts as received.
- `review.html` and `VLS_Product_Sheet.xlsx` are the owner-facing exports from
  before cleaning (they still list the 4 removed sarees).

The website gets these sarees from Supabase (seeded by the script in `scripts/`),
not from this folder.
