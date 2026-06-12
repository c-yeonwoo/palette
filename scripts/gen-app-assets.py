#!/usr/bin/env python3
"""
팔레트 앱 아이콘 / 스플래시 임시 자산 생성기 (브랜드 컬러).

컨셉: 화가의 팔레트 + 8가지 컬러타입 물감 — "나의 색을 찾고, 너의 색과 조화를 이루다".
출력:
  frontend/assets/icon.png        1024x1024  (App Store / capacitor-assets 소스, 불투명)
  frontend/assets/splash.png      2732x2732  (라이트)
  frontend/assets/splash-dark.png 2732x2732  (다크)

이후 `npx capacitor-assets generate` 가 이 소스로 전 사이즈 변형을 만든다.
정식 출시 전 디자이너 자산으로 교체 권장 (이 스크립트 재실행 불필요).

실행:  python scripts/gen-app-assets.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "frontend", "assets")
os.makedirs(OUT, exist_ok=True)

# ── 브랜드 팔레트 (theme.css 기반) ──────────────────────────
CREAM = (244, 239, 231)      # #F4EFE7 brand cream (splash bg)
IVORY = (251, 247, 240)      # #FBF7F0 palette body
GOLD = (201, 168, 106)       # #C9A86A 시그니처 골드
CHARCOAL = (43, 38, 34)      # #2B2622 본문 텍스트
DARK_BG = (28, 25, 22)       # 다크 스플래시 배경

# 8가지 컬러타입 (Orange/Yellow/Green/Blue/Purple/Pink/Red/Gray)
COLOR_TYPES = [
    (244, 146, 59),   # orange
    (232, 194, 74),   # yellow
    (95, 184, 122),   # green
    (74, 144, 217),   # blue
    (155, 108, 196),  # purple
    (237, 127, 168),  # pink
    (224, 88, 79),    # red
    (154, 160, 166),  # gray
]

S = 4  # supersampling factor (anti-alias)


def _korean_font(px):
    for path in (
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/Library/Fonts/AppleGothic.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, px, index=0)
            except Exception:
                continue
    return None


def draw_palette_mark(size, body=IVORY, border=GOLD, hole=CREAM, dab_alpha=255):
    """화가의 팔레트 마크를 size×size RGBA 로 그린다 (배경 투명)."""
    n = size * S
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = n // 2, int(n * 0.52)
    rx, ry = int(n * 0.40), int(n * 0.33)

    # 드롭 섀도우
    shadow = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([cx - rx, cy - ry + int(n * 0.02), cx + rx, cy + ry + int(n * 0.03)],
               fill=(40, 32, 20, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=n * 0.012))
    img = Image.alpha_composite(img, shadow)
    d = ImageDraw.Draw(img)

    # 팔레트 몸체 + 골드 테두리
    bw = max(2, int(n * 0.008))
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry],
              fill=body + (255,), outline=border + (255,), width=bw)

    # 엄지 구멍 (우하단)
    hx, hy = cx + int(rx * 0.42), cy + int(ry * 0.30)
    hr = int(n * 0.072)
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=hole + (255,))

    # 8색 물감 — 상단 아치
    dab_r = int(n * 0.050)
    arc_r = int(min(rx, ry) * 0.66)
    start, end = 205, 335  # degrees (상단 좌→우)
    for i, col in enumerate(COLOR_TYPES):
        ang = math.radians(start + (end - start) * i / (len(COLOR_TYPES) - 1))
        dx = cx + int(arc_r * math.cos(ang))
        dy = cy + int(arc_r * math.sin(ang)) - int(ry * 0.06)
        d.ellipse([dx - dab_r, dy - dab_r, dx + dab_r, dy + dab_r],
                  fill=col + (dab_alpha,))

    return img.resize((size, size), Image.LANCZOS)


def make_icon():
    """1024 불투명 아이콘 (Apple: 알파 금지, 풀 블리드)."""
    size = 1024
    bg = Image.new("RGB", (size, size), CREAM)
    mark = draw_palette_mark(int(size * 0.82))
    mx = (size - mark.width) // 2
    my = (size - mark.height) // 2
    bg.paste(mark, (mx, my), mark)
    path = os.path.join(OUT, "icon.png")
    bg.save(path)
    print("icon.png       ", bg.size)


def make_splash(filename, bg_color, body, border, hole, text_color, wordmark=True):
    size = 2732
    bg = Image.new("RGB", (size, size), bg_color)
    mark = draw_palette_mark(int(size * 0.26), body=body, border=border, hole=hole)
    mx = (size - mark.width) // 2
    my = int(size * 0.40) - mark.height // 2
    bg.paste(mark, (mx, my), mark)

    if wordmark:
        font = _korean_font(int(size * 0.058))
        text = "팔레트"
        d = ImageDraw.Draw(bg)
        if font:
            tb = d.textbbox((0, 0), text, font=font)
            tw, th = tb[2] - tb[0], tb[3] - tb[1]
            tx = (size - tw) // 2 - tb[0]
            ty = my + mark.height + int(size * 0.045)
            d.text((tx, ty), text, fill=text_color, font=font)
        sub = _korean_font(int(size * 0.020))
        if sub:
            stext = "나의 색을 찾고, 너의 색과 조화를 이루다"
            sb = d.textbbox((0, 0), stext, font=sub)
            sw = sb[2] - sb[0]
            sx = (size - sw) // 2 - sb[0]
            sy = my + mark.height + int(size * 0.135)
            d.text((sx, sy), stext, fill=text_color, font=sub)

    path = os.path.join(OUT, filename)
    bg.save(path)
    print(f"{filename:15}", bg.size)


if __name__ == "__main__":
    make_icon()
    make_splash("splash.png", CREAM, IVORY, GOLD, CREAM, CHARCOAL)
    make_splash("splash-dark.png", DARK_BG, (54, 48, 42), GOLD, DARK_BG, CREAM)
    print("→ frontend/assets/ 생성 완료. 다음: cd frontend && npx capacitor-assets generate")
