"""Export clean RGBA PNGs; validate decoded files, not only pre-export arrays."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import json
from collections import deque

root = Path(__file__).resolve().parent
previous = root.parent / 'revision3'
names = ('boy', 'girl', 'moth', 'rodan', 'cloud', 'gillas', 'gamera', 'oilrig')
report = {'previous_hidden_rgb': {}, 'exported': {}}
loops = {}

def key_color(rgb):
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return (r > 45) & (b > 45) & (np.minimum(r, b) - g > 30)

def keep_character(frame):
    # Remove detached neighboring atlas fragments, including non-magenta shoes.
    a = np.array(frame)
    mask = a[:, :, 3] > 0
    visited = np.zeros(mask.shape, dtype=bool)
    largest = []
    height, width = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if visited[y, x]: continue
        queue = deque([(int(y), int(x))]); visited[y, x] = True; component = []
        while queue:
            cy, cx = queue.popleft(); component.append((cy, cx))
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True; queue.append((ny, nx))
        if len(component) > len(largest): largest = component
    keep = np.zeros(mask.shape, dtype=bool)
    for y, x in largest: keep[y, x] = True
    removed = int(np.sum(mask & ~keep))
    a[~keep] = 0
    return Image.fromarray(a), removed

def extract(cell, name):
    rgb = np.array(cell.convert('RGB')).astype(float)
    key = key_color(rgb)
    bg = np.median(np.concatenate((rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3))), axis=0)
    strength = max(1, min(bg[0], bg[2]) - bg[1])
    opacity = np.clip(1 - (np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]) / strength, 0, 1)
    soft = key & (rgb[:, :, 1] > bg[1] + 8) & (opacity > .08)
    recovered = np.clip((rgb - (1 - opacity[:, :, None]) * bg) / np.maximum(opacity[:, :, None], .01), 0, 255)
    alpha = np.where(key, 0, 255).astype('uint8')
    rgb[soft] = recovered[soft]
    # Explicit effect colors remove chroma spill without erasing fine arcs.
    if name == 'cloud': rgb[soft] = [255, 207, 108]
    elif name in ('gamera', 'oilrig'): rgb[soft] = [125, 206, 255]
    elif name == 'gillas':
        blue = soft & (recovered[:, :, 2] > recovered[:, :, 0] + 12)
        rgb[soft] = [214, 203, 179]
        rgb[blue] = [140, 204, 247]
    alpha[soft] = (opacity[soft] * 255).astype('uint8')
    # Atlas cell borders must never import fragments from adjacent poses.
    alpha[:3] = 0; alpha[-3:] = 0; alpha[:, :3] = 0; alpha[:, -3:] = 0
    alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.25)))
    rgba = np.dstack((rgb.astype('uint8'), alpha))
    spill = (rgb[:, :, 0] > rgb[:, :, 1] + 6) & (rgb[:, :, 2] > rgb[:, :, 1] + 8)
    if name == 'gillas':
        light = rgb.mean(axis=2)
        neutral = np.stack((np.minimum(255, light * 1.03), light, light * .90), axis=2)
        rgba[:, :, :3][spill] = neutral[spill].astype('uint8')
    elif name == 'cloud': rgba[:, :, :3][spill] = [255, 207, 108]
    elif name in ('gamera', 'oilrig'): rgba[:, :, :3][spill] = [125, 206, 255]
    rgba[rgba[:, :, 3] < 3] = 0
    rgba[key_color(rgba.astype(float))] = 0
    return Image.fromarray(rgba)

for name in names:
    if name in ('boy', 'girl', 'moth', 'rodan'):
        frames = []
        for i in range(7):
            # Previous lossless WebP encoding replaced RGB under alpha=0 with
            # predictor colors. Some render paths exposed horizontal blocks.
            a = np.array(Image.open(previous / f'{name}-frame-{i}.webp').convert('RGBA'))
            hidden = (a[:, :, 3] == 0) & np.any(a[:, :, :3] != 0, axis=2)
            report['previous_hidden_rgb'][f'{name}-{i}'] = int(np.sum(hidden))
            a[a[:, :, 3] == 0] = 0
            frame = Image.fromarray(a)
            if name in ('boy', 'girl'):
                frame, removed = keep_character(frame)
                report.setdefault('removed_detached_pixels', {})[f'{name}-{i}'] = removed
            frames.append(frame)
    else:
        atlas = Image.open(root / f'{name}-source.png')
        w, h = atlas.width // 4, atlas.height // 2
        frames = [extract(atlas.crop((i % 4 * w, i // 4 * h, (i % 4 + 1) * w, (i // 4 + 1) * h)), name) for i in range(7)]
        boxes = [f.getbbox() for f in frames]
        common = (min(b[0] for b in boxes) - 8, min(b[1] for b in boxes) - 8,
                  max(b[2] for b in boxes) + 8, max(b[3] for b in boxes) + 8)
        frames = [f.crop(common) for f in frames]
        if name == 'gamera':
            # Rotate the same carapace in its own plane, then foreshorten it.
            # This prevents seven generated poses from merely rocking in place.
            master_path = root / 'gamera-master.png'
            master = extract(Image.open(master_path), name) if master_path.exists() else frames[0]
            master = master.crop(master.getbbox())
            master.thumbnail((340, 340), Image.Resampling.LANCZOS)
            disc = Image.new('RGBA', (512, 512))
            disc.paste(master, ((512 - master.width) // 2, (512 - master.height) // 2))
            frames = [disc.rotate(-i * 360 / 7, Image.Resampling.BICUBIC).resize((512, 342), Image.Resampling.LANCZOS) for i in range(7)]
        else:
            for f in frames:
                f.thumbnail((512, 512), Image.Resampling.LANCZOS)
    loops[name] = []
    for i, frame in enumerate(frames):
        a = np.array(frame)
        a[a[:, :, 3] == 0] = 0
        a[key_color(a.astype(float))] = 0
        frame = Image.fromarray(a)
        path = root / f'{name}-frame-{i}.png'
        frame.save(path, optimize=True)
        decoded = np.array(Image.open(path).convert('RGBA'))
        assert np.array_equal(a, decoded), path
        assert not np.any(decoded[decoded[:, :, 3] == 0]), path
        assert not np.any(key_color(decoded.astype(float))), path
        assert not np.any(decoded[:2, :, 3]) and not np.any(decoded[-2:, :, 3]), path
        assert not np.any(decoded[:, :2, 3]) and not np.any(decoded[:, -2:, 3]), path
        report['exported'][path.name] = {'hidden_rgb': 0, 'key_color': 0, 'size': list(frame.size)}
        loops[name].append(frame)

# Flattened previews make alpha mistakes visible on light and dark backgrounds.
contact = Image.new('RGB', (1400, 420), '#bdd1ca')
d = ImageDraw.Draw(contact)
for i, frame in enumerate(loops['boy']):
    for row, color in enumerate(('#bdd1ca', '#253841')):
        tile = Image.new('RGBA', (200, 210), color)
        sprite = frame.copy(); sprite.thumbnail((190, 175), Image.Resampling.LANCZOS)
        tile.alpha_composite(sprite, ((200 - sprite.width) // 2, 25))
        contact.paste(tile.convert('RGB'), (i * 200, row * 210))
        d.text((i * 200 + 8, row * 210 + 8), f'frame {i + 1}', fill='#ae8151')
contact.save(root / 'boy-cleanup.png')

preview = []
show = ('boy', 'gamera', 'cloud', 'gillas', 'oilrig')
for i in range(7):
    page = Image.new('RGBA', (1250, 360), '#29383f')
    d = ImageDraw.Draw(page)
    for j, name in enumerate(show):
        sprite = loops[name][i].copy(); sprite.thumbnail((240, 300), Image.Resampling.LANCZOS)
        page.alpha_composite(sprite, (j * 250 + (250 - sprite.width) // 2, 45 + (300 - sprite.height) // 2))
        d.text((j * 250 + 15, 18), name, fill='#e4d4b0')
    preview.append(page.convert('RGB'))
preview[0].save(root / 'animation-preview.gif', save_all=True, append_images=preview[1:], duration=[140, 140, 150, 140, 140, 150, 140], loop=0, disposal=2)
preview[3].save(root / 'art-preview.png')
(root / 'alpha-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('56 PNG frames decoded and verified: clean transparent pixels, no chroma residue, clear borders.')
