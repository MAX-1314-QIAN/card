from pathlib import Path
import sys

from PIL import Image, ImageDraw


root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent / "render_v21"
pages = sorted(root.glob("page-*.png"), key=lambda p: int(p.stem.split("-")[-1]))
for start in range(0, len(pages), 4):
    chunk = pages[start:start + 4]
    opened = [Image.open(path).convert("RGB") for path in chunk]
    w = max(im.width for im in opened)
    h = max(im.height for im in opened)
    sheet = Image.new("RGB", (w * 2 + 60, h * 2 + 90), "#D8D5CF")
    draw = ImageDraw.Draw(sheet)
    for offset, im in enumerate(opened):
        x = 20 + (offset % 2) * (w + 20)
        y = 35 + (offset // 2) * (h + 20)
        sheet.paste(im, (x, y))
        draw.text((x + 8, 8 + (offset // 2) * (h + 20)), f"PAGE {start + offset + 1}", fill="#202020")
    out = root / f"contact-{start + 1:02d}-{start + len(chunk):02d}.jpg"
    sheet.save(out, quality=88, optimize=True)
    for im in opened:
        im.close()
    print(out)
