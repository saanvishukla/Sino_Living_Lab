"""E-directory poster generator using PIL.

Renders a portrait poster listing all active tenants in a building, grouped by floor.
"""
from __future__ import annotations

import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont

from app.db.models import Building, Tenant


POSTER_DIR = Path(
    os.environ.get("POSTERS_DIR")
    or Path(__file__).resolve().parent.parent.parent / "generated_posters"
)
POSTER_DIR.mkdir(parents=True, exist_ok=True)

WIDTH = 1080
HEIGHT = 1920
MARGIN = 80


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load a reasonable system font, falling back to default."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _floor_sort_key(floor: str) -> tuple[int, str]:
    """Sort floors: B2, B1, G, 1, 2, 3..."""
    f = floor.strip().upper()
    if f.startswith("B"):
        try:
            return (-int(f[1:]), f)
        except ValueError:
            return (-999, f)
    if f == "G":
        return (0, f)
    try:
        return (int(f), f)
    except ValueError:
        return (999, f)


def render_poster(building: Building, tenants: list[Tenant], output_path: Path | None = None) -> Path:
    """Render a directory poster and return the saved PNG path."""
    brand = building.brand_config or {}
    primary = brand.get("primary_color", "#c8102e")
    accent = brand.get("accent_color", "#f4b223")

    img = Image.new("RGB", (WIDTH, HEIGHT), "#ffffff")
    draw = ImageDraw.Draw(img)

    # --- Header band
    header_h = 320
    draw.rectangle([(0, 0), (WIDTH, header_h)], fill=primary)

    # Sino logo square
    logo_size = 70
    logo_x, logo_y = MARGIN, 80
    draw.rectangle(
        [(logo_x, logo_y), (logo_x + logo_size, logo_y + logo_size)],
        fill="#ffffff",
    )
    draw.text((logo_x + 20, logo_y + 12), "S", fill=primary, font=_font(44, bold=True))

    draw.text(
        (logo_x + logo_size + 20, logo_y + 8),
        "SINO GROUP",
        fill="#ffffff",
        font=_font(22),
    )
    draw.text(
        (logo_x + logo_size + 20, logo_y + 38),
        "E-DIRECTORY",
        fill="#ffffff",
        font=_font(14),
    )

    # Building title
    draw.text((MARGIN, 190), building.name.upper(), fill="#ffffff", font=_font(56))
    if building.address:
        draw.text((MARGIN, 260), building.address, fill="#ffffff", font=_font(20))

    # --- Tenant directory
    y = header_h + 60

    # Group tenants by floor
    by_floor: dict[str, list[Tenant]] = defaultdict(list)
    for t in tenants:
        by_floor[t.floor or "—"].append(t)

    floors = sorted(by_floor.keys(), key=_floor_sort_key, reverse=True)

    for floor in floors:
        # Floor header
        draw.rectangle([(MARGIN, y), (MARGIN + 70, y + 50)], fill=primary)
        draw.text((MARGIN + 15, y + 6), floor, fill="#ffffff", font=_font(28))
        draw.line([(MARGIN + 90, y + 25), (WIDTH - MARGIN, y + 25)], fill="#e5e5e5", width=2)
        y += 70

        for tenant in sorted(by_floor[floor], key=lambda t: t.name):
            # Dot
            draw.ellipse([(MARGIN + 4, y + 14), (MARGIN + 14, y + 24)], fill=accent)
            # Name
            draw.text((MARGIN + 30, y + 4), tenant.name, fill="#111111", font=_font(22))
            # Unit on right
            if tenant.unit:
                draw.text(
                    (WIDTH - MARGIN - 120, y + 4),
                    tenant.unit,
                    fill="#888888",
                    font=_font(20),
                )
            # Category small
            if tenant.category:
                draw.text(
                    (MARGIN + 30, y + 30),
                    tenant.category,
                    fill="#888888",
                    font=_font(14),
                )
            y += 56

            if y > HEIGHT - 140:
                break
        y += 20
        if y > HEIGHT - 140:
            break

    # --- Footer
    draw.line([(MARGIN, HEIGHT - 100), (WIDTH - MARGIN, HEIGHT - 100)], fill="#e5e5e5", width=1)
    footer_text = f"Generated {datetime.utcnow().strftime('%d %b %Y · %H:%M UTC')}"
    draw.text((MARGIN, HEIGHT - 80), footer_text, fill="#999999", font=_font(14))
    draw.text(
        (WIDTH - MARGIN - 220, HEIGHT - 80),
        "Sino Operating Layer",
        fill="#999999",
        font=_font(14),
    )

    # Save
    if output_path is None:
        output_path = POSTER_DIR / f"{building.code.lower()}_{int(datetime.utcnow().timestamp())}.png"
    img.save(output_path, "PNG", optimize=True)
    return output_path
