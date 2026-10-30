#!/usr/bin/env python3
"""Give local production assets content-based URLs for GitHub Pages caching."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
assets = root / 'assets'
assets.mkdir(exist_ok=True)
page = root / 'index.html'
html = page.read_text()
for filename in ('styles.css', 'particle-shapes.js', 'particle-shaders.js', 'particles.js'):
    source = root / filename
    data = source.read_bytes()
    digest = hashlib.sha256(data).hexdigest()[:12]
    output = assets / f'{source.stem}.{digest}{source.suffix}'
    output.write_bytes(data)
    pattern = r'(?P<attribute>(?:href|src)=")\./(?:assets/)?' + re.escape(source.stem) + r'(?:\.[0-9a-f]{12})?' + re.escape(source.suffix) + r'(?:\?[^"\s]*)?"'
    html, count = re.subn(pattern, lambda match: match.group('attribute') + './assets/' + output.name + '"', html)
    if count != 1:
        raise SystemExit(f'Expected one reference to {filename}; found {count}')
    for previous in assets.glob(f'{source.stem}.*{source.suffix}'):
        if previous != output and re.fullmatch(re.escape(source.stem) + r'\.[0-9a-f]{12}' + re.escape(source.suffix), previous.name):
            previous.unlink()
    print(output.relative_to(root))
page.write_text(html)
