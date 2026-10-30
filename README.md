# MXI: Mathematics x Intelligence

A single-screen, English-only homepage: **https://mxiteam.github.io/**.

The page contains the supplied GitHub avatar, a stationary volumetric MXI sculpture built from luminous binary digits, the brand meaning, and:

> Exploring intelligence that perceives, reasons, predicts, and acts.

There are no About, Research, project, or secondary navigation sections.

## Animation

The camera is fixed. Front, back, and side layers provide depth while a per-depth letter mask keeps the MXI silhouette stable. Only the internal 0/1 field moves. It blends streaming digits, fine connections, and traveling waves without mode buttons.

Move the cursor to bend a local field; click or tap to launch an energy wave. Focus the sculpture and press Enter or Space for the same action. Pause/resume is keyboard accessible. Animation suspends in hidden tabs, offscreen, and for reduced-motion preferences. A readable MXI heading remains when graphics are unavailable.

The stylesheet filename includes its content hash so a new deployment cannot reuse an older cached stylesheet. All assets, shaders, binary glyphs, and geometry are local. No dependencies, external fonts, analytics, or build step are required.

## Source

- `index.html`: the single-screen composition and metadata.
- `styles.*.css`: black-and-silver responsive design and short-height layout.
- `particle-shaders.js`: procedural binary glyphs, fixed oblique projection and inverse masks, local fields, pulses, and lighting.
- `particles.js`: geometry, graph connections, input, animation lifecycle, and WebGL rendering.
- `assets/mxi-logo.png`: the avatar supplied by the owner.

## Preview and publish

```sh
python3 -m http.server 8768 --bind 127.0.0.1
```

Open <http://127.0.0.1:8768/> and refresh after source changes.

The owner authorized making this homepage repository public and deploying with GitHub Pages. Pages serves the root of `main` at <https://mxiteam.github.io/>. `.nojekyll` avoids unnecessary processing. Push verified changes to `main` to update the site.

```sh
node --check particles.js
node --check particle-shaders.js
git diff --check
```

See `docs/verification.md` for verification evidence and limits.
