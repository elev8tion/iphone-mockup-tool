#!/usr/bin/env python3
"""
iPhone Mockup Frame Extractor v2
Processes an iPhone mockup image to create a transparent frame overlay.
Uses precise geometric masking for clean results.
"""

from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import sys
import os
from collections import deque


def flood_fill_background(arr):
    """Find background pixels via flood fill from corners."""
    h, w = arr.shape[:2]
    bg_mask = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    for sy, sx in [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]:
        if not visited[sy, sx]:
            queue.append((sy, sx))
            visited[sy, sx] = True

    while queue:
        y, x = queue.popleft()
        r, g, b = int(arr[y, x, 0]), int(arr[y, x, 1]), int(arr[y, x, 2])
        bright = (r + g + b) / 3

        if bright > 120 and max(abs(r-g), abs(g-b), abs(r-b)) < 40:
            bg_mask[y, x] = True
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    return bg_mask


def find_screen_bounds(arr, bg_mask):
    """Find the screen area bounds by scanning for the inner bezel edge."""
    h, w = arr.shape[:2]
    brightness = arr[:, :, :3].astype(float).mean(axis=2)
    phone_mask = ~bg_mask
    bezel_mask = phone_mask & (brightness < 80)

    # Flood fill from center to find screen area
    screen_mask = np.zeros((h, w), dtype=bool)
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()

    cy, cx = h // 2, w // 2
    queue.append((cy, cx))
    visited[cy, cx] = True

    while queue:
        y, x = queue.popleft()
        if not bezel_mask[y, x] and phone_mask[y, x]:
            screen_mask[y, x] = True
            for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    # Get bounding box of screen area
    ys, xs = np.where(screen_mask)
    return {
        'top': int(ys.min()),
        'bottom': int(ys.max()),
        'left': int(xs.min()),
        'right': int(xs.max()),
        'mask': screen_mask
    }


def create_rounded_rect_mask(size, bounds, corner_radius):
    """Create a smooth rounded rectangle mask for the screen area."""
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [bounds['left'], bounds['top'], bounds['right'], bounds['bottom']],
        radius=corner_radius,
        fill=255
    )
    return mask


def extract_frame(input_path, output_dir, scale_factor=5):
    """Extract the phone frame from a mockup image."""
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)
    h, w = arr.shape[:2]
    print(f"Input: {w}x{h}")

    # Step 1: Find and remove background
    bg_mask = flood_fill_background(arr)

    # Step 2: Find screen area bounds
    screen = find_screen_bounds(arr, bg_mask)
    print(f"Screen area: ({screen['left']},{screen['top']}) to ({screen['right']},{screen['bottom']})")

    # Step 3: Create precise screen mask with rounded corners
    # iPhone 16 corner radius is about 25% of the screen width
    screen_width = screen['right'] - screen['left']
    corner_radius = int(screen_width * 0.12)

    # Shrink the screen bounds by 1px to keep the bezel inner edge intact
    shrunk_bounds = {
        'left': screen['left'] + 1,
        'top': screen['top'] + 1,
        'right': screen['right'] - 1,
        'bottom': screen['bottom'] - 1
    }

    screen_mask_img = create_rounded_rect_mask((w, h), shrunk_bounds, corner_radius)

    # Step 4: Build the frame image
    output = arr.copy()

    # Make background transparent
    output[bg_mask, 3] = 0

    # Make screen area transparent using the rounded rect mask
    screen_mask_arr = np.array(screen_mask_img)
    output[:, :, 3] = np.where(
        screen_mask_arr > 128,
        0,  # Transparent where screen is
        output[:, :, 3]  # Keep existing alpha elsewhere
    )

    # Step 5: Smooth the outer edges of the phone body
    # Create a soft alpha for the border between background and bezel
    result_img = Image.fromarray(output)

    # Step 6: Scale up for quality
    new_w = w * scale_factor
    new_h = h * scale_factor
    result_img = result_img.resize((new_w, new_h), Image.LANCZOS)

    # Save frame
    frame_path = os.path.join(output_dir, 'frame.png')
    result_img.save(frame_path, 'PNG')
    print(f"Frame saved: {frame_path} ({new_w}x{new_h})")

    # Step 7: Create screen-only mask (scaled)
    screen_mask_scaled = screen_mask_img.resize((new_w, new_h), Image.LANCZOS)
    mask_rgba = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 255))
    mask_arr = np.array(mask_rgba)
    sm_arr = np.array(screen_mask_scaled)
    mask_arr[:, :, 0] = sm_arr
    mask_arr[:, :, 1] = sm_arr
    mask_arr[:, :, 2] = sm_arr
    mask_path = os.path.join(output_dir, 'screen_mask.png')
    Image.fromarray(mask_arr).save(mask_path, 'PNG')
    print(f"Screen mask saved: {mask_path}")

    # Step 8: Save screen coordinates as JSON for the web app
    # Scale the coordinates
    coords = {
        'frame_width': new_w,
        'frame_height': new_h,
        'screen_left': shrunk_bounds['left'] * scale_factor,
        'screen_top': shrunk_bounds['top'] * scale_factor,
        'screen_right': shrunk_bounds['right'] * scale_factor,
        'screen_bottom': shrunk_bounds['bottom'] * scale_factor,
        'screen_width': (shrunk_bounds['right'] - shrunk_bounds['left']) * scale_factor,
        'screen_height': (shrunk_bounds['bottom'] - shrunk_bounds['top']) * scale_factor,
        'corner_radius': corner_radius * scale_factor,
        'original_width': w,
        'original_height': h,
        'scale_factor': scale_factor
    }

    import json
    coords_path = os.path.join(output_dir, 'coords.json')
    with open(coords_path, 'w') as f:
        json.dump(coords, f, indent=2)
    print(f"Coordinates saved: {coords_path}")
    print(f"  Screen: {coords['screen_width']}x{coords['screen_height']} at ({coords['screen_left']},{coords['screen_top']})")

    return coords


if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else '/Users/kcdacre8tor/Downloads/iphone-16.webp'
    output_dir = os.path.dirname(os.path.abspath(__file__))
    scale = 5  # 5x upscale

    coords = extract_frame(input_file, output_dir, scale_factor=scale)

    print(f"\nDone!")
    print(f"Files created in: {output_dir}")
    print(f"  frame.png       - Phone frame overlay ({coords['frame_width']}x{coords['frame_height']})")
    print(f"  screen_mask.png - Screen area mask")
    print(f"  coords.json     - Screen coordinates for web app")
