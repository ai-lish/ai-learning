#!/usr/bin/env python3
"""Overlay text on s5ch17 base image"""
from PIL import Image, ImageDraw, ImageFont
import os

# Load base image
img = Image.open("/Users/zachli/.openclaw/workspace/ai-learning/images/s5ch17_base.png").convert("RGBA")
draw = ImageDraw.Draw(img)

# Try to load fonts, fallback to default
def get_font(size, bold=False):
    font_paths = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                pass
    return ImageFont.load_default()

font_title = get_font(36, bold=True)
font_subtitle = get_font(24)
font_label = get_font(22, bold=True)
font_text = get_font(20)
font_small = get_font(18)
font_calc = get_font(20, bold=True)
font_emoji = get_font(20)

# Colors
WHITE = (255, 255, 255, 255)
BLACK = (30, 30, 30, 255)
PURPLE = (128, 90, 213, 255)
ORANGE = (230, 126, 34, 255)
GREEN = (39, 174, 96, 255)
DARK_PURPLE = (90, 60, 150, 255)
DARK_ORANGE = (180, 90, 20, 255)
LIGHT_PURPLE = (240, 230, 255, 255)
LIGHT_ORANGE = (255, 240, 225, 255)
RED = (200, 50, 50, 255)
DARK_TEXT = (50, 50, 50, 255)

def draw_card(draw, x, y, w, h, bg_color, border_color=None, radius=10):
    """Draw rounded rectangle card"""
    from PIL import ImageDraw
    import math
    
    # Draw filled rectangle with rounded corners
    draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, fill=bg_color)
    
    # Draw border if specified
    if border_color:
        draw.rounded_rectangle([x, y, x+w, y+h], radius=radius, outline=border_color, width=2)

def draw_button(draw, x, y, w, h, text, bg_color, text_color=WHITE, font=None):
    """Draw button with text"""
    if font is None:
        font = font_small
    draw.rounded_rectangle([x, y, x+w, y+h], radius=8, fill=bg_color)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    draw.text((x + (w - text_w)//2, y + (h - text_h)//2), text, fill=text_color, font=font)

# Image dimensions
W, H = img.size
mid = W // 2

# ========== LEFT SIDE: ADDITION PRINCIPLE (PURPLE) ==========

# Title bar
draw.rounded_rectangle([20, 20, mid-20, 90], radius=12, fill=PURPLE)
bbox = draw.textbbox((0, 0), "加法原理", font=font_title)
draw.text((20 + (mid-40 - (bbox[2]-bbox[0]))//2, 35), "加法原理", fill=WHITE, font=font_title)
bbox = draw.textbbox((0, 0), "OR 運算", font=font_subtitle)
draw.text((20 + (mid-40 - (bbox[2]-bbox[0]))//2, 70), "OR 運算", fill=(220, 220, 255), font=font_subtitle)

# Content area
content_x = 30
content_y = 110

# Header text with emojis
draw.text((content_x, content_y), "🔐 密碼組合：加法原理", fill=DARK_TEXT, font=font_text)
draw.text((content_x, content_y+35), "📋 規則：3位密碼 = 1個字母(52個) + 2個數字(0-9)", fill=DARK_TEXT, font=font_text)
draw.text((content_x, content_y+70), "⚠️ 限制：O/o唔可以夾0，I/l唔可以夾1", fill=RED, font=font_text)

# Case A card
card_y = 240
draw_card(draw, 30, card_y, 290, 120, LIGHT_PURPLE, PURPLE, 10)
draw.text((45, card_y+10), "Case A", fill=PURPLE, font=font_label)
draw.text((45, card_y+40), "O或o開頭", fill=DARK_TEXT, font=font_text)
draw.text((45, card_y+70), "2 × 9 × 9 = 162", fill=DARK_TEXT, font=font_calc)

# Case B card
card_y = 370
draw_card(draw, 30, card_y, 290, 120, LIGHT_PURPLE, PURPLE, 10)
draw.text((45, card_y+10), "Case B", fill=PURPLE, font=font_label)
draw.text((45, card_y+40), "I/l開頭", fill=DARK_TEXT, font=font_text)
draw.text((45, card_y+70), "2 × 9 × 9 = 162", fill=DARK_TEXT, font=font_calc)

# Case C card
card_y = 500
draw_card(draw, 30, card_y, 290, 120, LIGHT_PURPLE, PURPLE, 10)
draw.text((45, card_y+10), "Case C", fill=PURPLE, font=font_label)
draw.text((45, card_y+40), "其他字母", fill=DARK_TEXT, font=font_text)
draw.text((45, card_y+70), "48 × 10 × 10 = 4800", fill=DARK_TEXT, font=font_calc)

# Answer button - left side
draw_button(draw, 30, 640, 580, 50, "162 + 162 + 4800 = 5124 ✅", PURPLE, WHITE, font_calc)

# ========== RIGHT SIDE: SUBTRACTION PRINCIPLE (ORANGE) ==========

# Title bar
draw.rounded_rectangle([mid+20, 20, W-20, 90], radius=12, fill=ORANGE)
bbox = draw.textbbox((0, 0), "減法原理", font=font_title)
draw.text((mid+20 + (W-mid-40 - (bbox[2]-bbox[0]))//2, 35), "減法原理", fill=WHITE, font=font_title)
bbox = draw.textbbox((0, 0), "N - n' 運算", font=font_subtitle)
draw.text((mid+20 + (W-mid-40 - (bbox[2]-bbox[0]))//2, 70), "N - n' 運算", fill=(255, 220, 180), font=font_subtitle)

# Content area
content_x = mid + 40

# Header text with emojis
draw.text((content_x, content_y), "🔐 密碼組合：減法原理", fill=DARK_TEXT, font=font_text)
draw.text((content_x, content_y+35), "📋 規則：3位密碼 = 1個字母(52個) + 2個數字(0-9)", fill=DARK_TEXT, font=font_text)
draw.text((content_x, content_y+70), "⚠️ 限制：O/o唔可以夾0，I/l唔可以夾1", fill=RED, font=font_text)

# Case D card
card_y = 240
draw_card(draw, mid+40, card_y, 580, 120, LIGHT_ORANGE, ORANGE, 10)
draw.text((mid+55, card_y+10), "Case D", fill=ORANGE, font=font_label)
draw.text((mid+55, card_y+40), "總數", fill=DARK_TEXT, font=font_text)
draw.text((mid+55, card_y+70), "52 × 10 × 10 = 5200", fill=DARK_TEXT, font=font_calc)

# Case E card
card_y = 370
draw_card(draw, mid+40, card_y, 580, 120, LIGHT_ORANGE, ORANGE, 10)
draw.text((mid+55, card_y+10), "Case E", fill=ORANGE, font=font_label)
draw.text((mid+55, card_y+40), "減去 O/o+0 和 I/l+1", fill=DARK_TEXT, font=font_text)
draw.text((mid+55, card_y+70), "5200 − 38 − 38 = 5124", fill=DARK_TEXT, font=font_calc)

# Answer button - right side
draw_button(draw, mid+40, 640, 580, 50, "✅ 5124", ORANGE, WHITE, font_calc)

# Save
output_path = "/Users/zachli/.openclaw/workspace/ai-learning/images/s5ch17_code_example_new.png"
img = img.convert("RGB")
img.save(output_path, "PNG")
print(f"Saved to {output_path}")
