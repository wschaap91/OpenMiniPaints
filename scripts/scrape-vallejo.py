#!/usr/bin/env python3
"""
OpenMiniPaints — Vallejo Color Chart scraper
=============================================
Downloads official Vallejo PDF color charts and extracts paint data into JSON files.

Usage:
    python3 scripts/scrape-vallejo.py [--all | --gc | --mc]

Requirements:
    pip install pymupdf requests

Output:
    data/vallejo/game-color.json
    data/vallejo/model-color.json
"""

import re
import json
import sys
import argparse
from datetime import date
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)

try:
    import urllib.request as urllib_request
except ImportError:
    pass

# ── Official PDF sources ────────────────────────────────────────────────────
SOURCES = {
    "game-color": {
        "url": "https://www.vallejoacrylics.com/wp-content/uploads/2023/09/CC266-Game_Color-NewIC-Rev01-1.pdf",
        "brand": "Vallejo",
        "range": "Game Color",
        "rangeCode": "GC",
    },
    "model-color": {
        "url": "https://acrylicosvallejo.com/wp-content/uploads/2024/03/CC329-R00-Model-Color-NewIC.pdf",
        "brand": "Vallejo",
        "range": "Model Color",
        "rangeCode": "MC",
    },
}

# ── Helpers ─────────────────────────────────────────────────────────────────

def download_pdf(url: str, dest: Path) -> Path:
    """Download PDF to dest, return path."""
    if dest.exists():
        print(f"  Using cached: {dest}")
        return dest
    print(f"  Downloading: {url}")
    req = urllib_request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib_request.urlopen(req) as response:
        dest.write_bytes(response.read())
    print(f"  Saved: {dest}")
    return dest


def get_spans(page):
    """Return all text spans with center coords."""
    spans = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                txt = span["text"].strip()
                if txt:
                    spans.append({
                        "text": txt,
                        "cx": (span["bbox"][0] + span["bbox"][2]) / 2,
                        "cy": (span["bbox"][1] + span["bbox"][3]) / 2,
                    })
    return spans


def get_swatches_40x24(page):
    """Return all ~40×24 px colored rectangles (individual paint swatches)."""
    swatches = []
    for p in page.get_drawings():
        fill = p.get("fill")
        rect = p.get("rect")
        if not fill or not rect:
            continue
        w = rect.x1 - rect.x0
        h = rect.y1 - rect.y0
        if 33 <= w <= 41 and 19 <= h <= 27:
            r, g, b = fill
            swatches.append({
                "hex": "#{:02x}{:02x}{:02x}".format(int(r * 255), int(g * 255), int(b * 255)),
                "cx": (rect.x0 + rect.x1) / 2,
                "cy": (rect.y0 + rect.y1) / 2,
            })
    return swatches


def match_name_and_hex(cs, spans, swatches):
    """
    Given a code span, find:
    - name: text span at same X (±20px), 4–11px below
    - hex:  swatch at same X (±22px), 8–30px above
    """
    nc = [
        s for s in spans
        if abs(s["cx"] - cs["cx"]) < 20
        and 4 <= (s["cy"] - cs["cy"]) <= 11
        and not re.match(r'^[\d.(]', s["text"])
        and len(s["text"]) > 2
    ]
    name = min(nc, key=lambda s: s["cy"] - cs["cy"])["text"] if nc else None

    sc = [
        (cs["cy"] - sw["cy"], sw)
        for sw in swatches
        if abs(sw["cx"] - cs["cx"]) < 22 and 8 < (cs["cy"] - sw["cy"]) < 30
    ]
    hex_color = min(sc, key=lambda x: x[0])[1]["hex"] if sc else None
    return name, hex_color


def legend_name(cs, spans):
    """Find name for a code that is in a horizontal legend (name is to the right, same Y)."""
    nc = [
        s for s in spans
        if abs(s["cy"] - cs["cy"]) < 4
        and s["cx"] > cs["cx"] + 5
        and not re.match(r'^[\d.]', s["text"])
        and len(s["text"]) > 2
    ]
    nc.sort(key=lambda s: s["cx"])
    return nc[0]["text"] if nc else None


# ── Game Color ───────────────────────────────────────────────────────────────

METALLIC_GC = {f"72.{n:03d}" for n in [52, 53, 54, 55, 56, 57, 58, 59, 60]}
FLUORO_GC   = {f"72.{n:03d}" for n in [103, 104, 156, 157, 158, 159, 160, 161]}
SPECIAL_FX  = {f"72.{n:03d}" for n in range(600, 612)}
MEDIUM_GC   = {f"72.{n:03d}" for n in [650, 651, 652, 653]}


def gc_meta(code: str) -> dict:
    if code in METALLIC_GC:
        return {"type": "metallic", "finish": "metallic", "transparency": "opaque"}
    if code in FLUORO_GC:
        return {"type": "fluorescent", "finish": "matte", "transparency": "semi-transparent"}
    if code.startswith("73."):
        return {"type": "wash", "finish": "satin", "transparency": "transparent"}
    if code in SPECIAL_FX:
        return {"type": "special-fx", "finish": "matte", "transparency": "semi-transparent"}
    if re.match(r"72\.4", code):
        return {"type": "contrast", "finish": "matte", "transparency": "semi-transparent"}
    if code in MEDIUM_GC:
        return {"type": "varnish", "finish": "gloss", "transparency": "transparent"}
    return {"type": "standard", "finish": "matte", "transparency": "opaque"}


def extract_game_color(pdf_path: Path, source_info: dict) -> dict:
    doc = fitz.open(str(pdf_path))
    page = doc[0]
    spans = get_spans(page)
    swatches = get_swatches_40x24(page)
    raw = {}

    # Standard GC + metallics + fluorescents (visual grid, X=1640–2070)
    for cs in [s for s in spans if re.match(r'72\.(0\d\d|1[0-6]\d)', s["text"]) and 1640 <= s["cx"] <= 2070]:
        name, hex_color = match_name_and_hex(cs, spans, swatches)
        if cs["text"] not in raw:
            raw[cs["text"]] = {"name": name, "hex": hex_color}

    # Wash (73.2xx), Fluo, Special FX (intermediate zone X=400–820)
    for cs in [s for s in spans
               if re.match(r'(73\.\d{3}|72\.(103|104|1[5-6]\d|60\d|61[01]))', s["text"])
               and 400 <= s["cx"] <= 820]:
        name, hex_color = match_name_and_hex(cs, spans, swatches)
        if cs["text"] not in raw:
            raw[cs["text"]] = {"name": name, "hex": hex_color}

    # Xpress Color — names from legend (X=2275–2400), hex not available (raster images in PDF)
    for x_min, x_max in [(2275, 2300), (2375, 2400)]:
        for cs in [s for s in spans if re.match(r'72\.4\d\d', s["text"]) and x_min <= s["cx"] <= x_max]:
            if cs["text"] not in raw:
                raw[cs["text"]] = {"name": legend_name(cs, spans), "hex": None}

    paints = []
    for code in sorted(raw.keys()):
        v = raw[code]
        if not v["name"]:
            continue
        meta = gc_meta(code)
        paints.append({"code": code, "name": v["name"], "hex": v["hex"], **meta})

    return {
        "brand": source_info["brand"],
        "range": source_info["range"],
        "rangeCode": source_info["rangeCode"],
        "source": {
            "type": "pdf",
            "url": source_info["url"],
            "extractedAt": str(date.today()),
            "notes": (
                "CC266 Rev.01. Standard GC, Metallics, Fluorescents, Washes (73.2xx), "
                "Special FX (72.6xx), Xpress Color (72.4xx — names only, "
                "hex unavailable from raster swatches in this PDF)."
            ),
        },
        "paints": paints,
    }


# ── Model Color ──────────────────────────────────────────────────────────────

METALLIC_MC = {f"70.{n}" for n in ["790","791","792","793","794","795","796","797","996","997","998","999"]}
MEDIUM_MC   = {f"70.{n}" for n in ["400","470","510","520","521","522","523","524","540","596","597"]}


def mc_meta(code: str, name: str) -> dict:
    if code in METALLIC_MC:
        return {"type": "metallic", "finish": "metallic", "transparency": "opaque"}
    if code in MEDIUM_MC:
        return {"type": "medium", "finish": "matte", "transparency": "transparent"}
    finish = "gloss" if "Gloss" in (name or "") else "matte"
    return {"type": "standard", "finish": finish, "transparency": "opaque"}


def extract_model_color(pdf_path: Path, source_info: dict) -> dict:
    doc = fitz.open(str(pdf_path))
    page = doc[0]
    spans = get_spans(page)
    swatches = get_swatches_40x24(page)
    raw = {}

    # Visual grid (X=420–2060)
    for cs in [s for s in spans if re.match(r'70\.\d{3}', s["text"]) and 420 <= s["cx"] <= 2060]:
        name, hex_color = match_name_and_hex(cs, spans, swatches)
        if cs["text"] not in raw:
            raw[cs["text"]] = {"name": name, "hex": hex_color}

    # Mediums / legend at X<420 (horizontal layout, no swatch)
    for cs in [s for s in spans if re.match(r'70\.\d{3}', s["text"]) and s["cx"] < 420]:
        if cs["text"] not in raw:
            raw[cs["text"]] = {"name": legend_name(cs, spans), "hex": None}

    paints = []
    for code in sorted(raw.keys()):
        v = raw[code]
        if not v["name"]:
            continue
        meta = mc_meta(code, v["name"])
        paints.append({"code": code, "name": v["name"], "hex": v["hex"], **meta})

    return {
        "brand": source_info["brand"],
        "range": source_info["range"],
        "rangeCode": source_info["rangeCode"],
        "source": {
            "type": "pdf",
            "url": source_info["url"],
            "extractedAt": str(date.today()),
            "notes": (
                "CC329 R00 (2024 reformulation). Standard MC, Metallics (70.79x, 70.996-999), "
                "Mediums/Varnishes (70.4xx–70.5xx). Mediums have no hex (clear liquids)."
            ),
        },
        "paints": paints,
    }


# ── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape Vallejo color chart PDFs → JSON")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", default=True, help="Extract all ranges (default)")
    group.add_argument("--gc",  action="store_true", help="Game Color only")
    group.add_argument("--mc",  action="store_true", help="Model Color only")
    parser.add_argument("--pdf-dir", type=Path, default=Path("/tmp/vallejo-pdfs"),
                        help="Directory to cache downloaded PDFs")
    args = parser.parse_args()

    root = Path(__file__).parent.parent
    out_dir = root / "data" / "vallejo"
    out_dir.mkdir(parents=True, exist_ok=True)
    args.pdf_dir.mkdir(parents=True, exist_ok=True)

    run_gc = args.gc or (not args.mc)
    run_mc = args.mc or (not args.gc)

    if run_gc:
        info = SOURCES["game-color"]
        pdf_path = download_pdf(info["url"], args.pdf_dir / "game-color.pdf")
        print("Extracting Game Color…")
        data = extract_game_color(pdf_path, info)
        out = out_dir / "game-color.json"
        out.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        paints = data["paints"]
        print(f"  {len(paints)} paints → {out}")
        print(f"  Missing hex: {sum(1 for p in paints if not p['hex'])}")

    if run_mc:
        info = SOURCES["model-color"]
        pdf_path = download_pdf(info["url"], args.pdf_dir / "model-color.pdf")
        print("Extracting Model Color…")
        data = extract_model_color(pdf_path, info)
        out = out_dir / "model-color.json"
        out.write_text(json.dumps(data, indent=2, ensure_ascii=False))
        paints = data["paints"]
        print(f"  {len(paints)} paints → {out}")
        print(f"  Missing hex: {sum(1 for p in paints if not p['hex'])}")


if __name__ == "__main__":
    main()
