# MXI: Mathematics x Intelligence

**https://mxiteam.github.io/**

A minimal English homepage on black. A single batch of luminous binary digits smoothly cycles through **MXI → robot → brain → Earth → MXI**. Each form holds for five seconds, then morphs for three seconds, completing a 32-second loop. The camera remains fixed, with depth from front, back, and side geometry.

The visible page contains only the supplied logo, GitHub link, particle scene, and **Mathematics x Intelligence** caption. There are no extra sections, labels, explanatory sentences, mode controls, or animation buttons.

Pointer and click interaction remains local to the field. Keyboard users can focus the scene, press Enter for a pulse, and Space to pause/resume. Reduced motion shows static MXI. Rendering suspends offscreen and in hidden tabs; a readable heading remains if graphics are unavailable.

## Source

- `index.html`: minimal composition and metadata.
- `styles.css`: responsive black layout.
- `particle-shapes.js`: deterministic 3D targets, stylized continents, and cyclic morph weights.
- `particle-shaders.js`: binary glyphs, fixed camera, interpolation, masking, and lighting.
- `particles.js`: geometry, interaction, animation lifecycle, and WebGL rendering.
- `assets/`: supplied avatar and versioned production assets.

No external models, fonts, scripts, textures, or package installation are required. Asset filenames carry content hashes to avoid stale GitHub Pages caches.

## Preview and publish

After changing an asset, refresh its versioned production file:

```sh
python3 scripts/version-assets.py
python3 -m http.server 8768 --bind 127.0.0.1
```

Open <http://127.0.0.1:8768/>. Verified changes pushed to `main` deploy through GitHub Pages from the repository root. The owner explicitly authorized making this homepage repository public.

```sh
node --check particles.js
node --check particle-shaders.js
node --check particle-shapes.js
git diff --check
```

Verification evidence and limitations are recorded in `docs/verification.md`.
