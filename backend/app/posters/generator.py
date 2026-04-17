"""E-directory poster generator using PIL.

Renders a portrait poster listing all active tenants in a building, grouped by floor.
"""
from __future__ import annotations

import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime

import qrcode
from PIL import Image, ImageDraw, ImageFont

from app.config import settings
from app.db.models import Building, Tenant


def _make_qr(data: str, box_size: int = 2) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="#111111", back_color="#ffffff").convert("RGB")


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
        # Linux (Render/Docker)
        "/usr/share/fonts/truetype/dejavu/DejaVu-Sans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def _font_zh(size: int) -> ImageFont.FreeTypeFont:
    """Load a CJK font for Traditional Chinese rendering."""
    candidates = [
        # macOS
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        # Linux (Docker) — apt install fonts-noto-cjk
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        # WenQuanYi fallback
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/wqy-microhei/wqy-microhei.ttc",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return _font(size)


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
        "E-DIRECTORY  ·  電子指南",
        fill="#ffffff",
        font=_font_zh(14),
    )

    # Building title (EN large + ZH underneath)
    draw.text((MARGIN, 170), building.name.upper(), fill="#ffffff", font=_font(52))
    if building.name_zh:
        draw.text((MARGIN, 232), building.name_zh, fill="#ffffff", font=_font_zh(30))
    if building.address:
        addr = building.address_zh or building.address
        draw.text((MARGIN, 278), addr, fill="#ffffff", font=_font_zh(16))

    # Building-level QR in the header (top-right)
    try:
        b_qr = _make_qr(
            f"{settings.public_base_url.rstrip('/')}/b/{building.code}",
            box_size=3,
        )
        bq_size = 140
        b_qr = b_qr.resize((bq_size, bq_size), Image.NEAREST)
        img.paste(b_qr, (WIDTH - MARGIN - bq_size, 150))
        draw.text(
            (WIDTH - MARGIN - bq_size, 150 + bq_size + 4),
            "Scan for full directory",
            fill="#ffffff",
            font=_font_zh(11),
        )
    except Exception:
        pass

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
            draw.ellipse([(MARGIN + 4, y + 16), (MARGIN + 14, y + 26)], fill=accent)
            # EN name
            draw.text((MARGIN + 30, y + 2), tenant.name, fill="#111111", font=_font(22))
            # ZH name
            if tenant.name_zh and tenant.name_zh != tenant.name:
                draw.text(
                    (MARGIN + 30, y + 30),
                    tenant.name_zh,
                    fill="#444444",
                    font=_font_zh(18),
                )
            # Unit to the left of QR code
            if tenant.unit:
                draw.text(
                    (WIDTH - MARGIN - 210, y + 8),
                    tenant.unit,
                    fill="#888888",
                    font=_font(20),
                )
            # QR code linking to /t/<tenant_id>
            try:
                qr_img = _make_qr(
                    f"{settings.public_base_url.rstrip('/')}/t/{tenant.id}",
                    box_size=2,
                )
                qr_size = 70
                qr_img = qr_img.resize((qr_size, qr_size), Image.NEAREST)
                img.paste(qr_img, (WIDTH - MARGIN - qr_size, y))
            except Exception:
                pass
            # Category small (bilingual)
            if tenant.category:
                cat_text = (
                    f"{tenant.category} · {tenant.category_zh}"
                    if tenant.category_zh
                    else tenant.category
                )
                draw.text(
                    (MARGIN + 30, y + 56),
                    cat_text,
                    fill="#888888",
                    font=_font_zh(13),
                )
            y += 80

            if y > HEIGHT - 140:
                break
        y += 20
        if y > HEIGHT - 140:
            break

    # --- Footer
    draw.line([(MARGIN, HEIGHT - 100), (WIDTH - MARGIN, HEIGHT - 100)], fill="#e5e5e5", width=1)
    footer_text = f"Generated  生成時間  {datetime.utcnow().strftime('%d %b %Y · %H:%M UTC')}"
    draw.text((MARGIN, HEIGHT - 80), footer_text, fill="#999999", font=_font_zh(13))
    draw.text(
        (WIDTH - MARGIN - 260, HEIGHT - 80),
        "Sino Operating Layer  信和營運平台",
        fill="#999999",
        font=_font_zh(13),
    )

    # Save
    if output_path is None:
        output_path = POSTER_DIR / f"{building.code.lower()}_{int(datetime.utcnow().timestamp())}.png"
    img.save(output_path, "PNG", optimize=True)
    return output_path
