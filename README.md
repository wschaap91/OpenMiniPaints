# OpenMiniPaints

An open, machine-readable database of miniature paint ranges — built from official manufacturer sources.

## Structure

```
data/
  vallejo/
    game-color.json      ← Vallejo Game Color (166 paints)
    model-color.json     ← Vallejo Model Color (223 paints)
schema/
  paint-range.schema.json  ← JSON Schema for all range files
scripts/
  scrape-vallejo.py        ← Repeatable PDF → JSON extractor
```

## Data format

Each `data/<brand>/<range>.json` follows `schema/paint-range.schema.json`:

```json
{
  "brand": "Vallejo",
  "range": "Game Color",
  "rangeCode": "GC",
  "source": { "type": "pdf", "url": "...", "extractedAt": "2026-05-27" },
  "paints": [
    {
      "code": "72.001",
      "name": "Dead White",
      "hex": "#ffffff",
      "type": "standard",
      "finish": "matte",
      "transparency": "opaque"
    }
  ]
}
```

### Paint types

| type | description |
|---|---|
| `standard` | Regular acrylic |
| `metallic` | Metallic pigment |
| `fluorescent` | Fluorescent pigment |
| `wash` | Thin wash / ink |
| `contrast` | One-coat contrast / Xpress |
| `special-fx` | Texture / special effect |
| `medium` | Non-pigmented medium, thinner, or varnish |
| `varnish` | Polyurethane varnish |

## Re-running the scraper

```bash
pip install pymupdf
python3 scripts/scrape-vallejo.py          # all ranges
python3 scripts/scrape-vallejo.py --gc     # Game Color only
python3 scripts/scrape-vallejo.py --mc     # Model Color only
```

PDFs are cached in `/tmp/vallejo-pdfs/` by default (override with `--pdf-dir`).

## Coverage

| Range | Entries | Hex coverage | Source PDF |
|---|---|---|---|
| Vallejo Game Color | 166 | ~79% (Xpress hex unavailable — raster in PDF) | CC266 Rev.01 |
| Vallejo Model Color | 223 | ~91% (mediums have no hex) | CC329 R00 |

## Sources

All data is extracted from official Vallejo color chart PDFs published at
[acrylicosvallejo.com](https://acrylicosvallejo.com/en/downloads/).
Hex values are approximate — derived from vector color data in the PDFs.

## Contributing

- Add a new range: run the scraper with the PDF URL, or add a manual JSON file following the schema.
- Corrections: edit the JSON directly and open a PR.
