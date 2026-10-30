# MXI: Mathematics x Intelligence

**https://mxiteam.github.io/**

A minimal English homepage on pure black. A borderless binary chain opens with a fixed, bold **1011** at its center. Other digits alternate 0/1 using a two-part, center-hinged flip animation. The sequence continues through **Mathematics → Mechanics → Robot → Brain → Universe → MXI**, then loops.

Each of the seven scenes occupies ten seconds: six seconds of readable form and four seconds of transition. A traveling front carries neighboring particles along a persistent digital conduit into the next body. The seven English scene names below the animation are clickable; the current scene is highlighted. The final MXI uses the original bold sans-serif font and a fixed oblique camera. Its 0/1 glyphs stay approximately 7–8.5 CSS pixels.

The five detailed forms use the exact silver reference sheet supplied by the owner, stored locally as `assets/story-reference.cc5b93713b1e.png`. Luminance-weighted sampling retains the original mechanical, anatomical and cosmic details. Curved front/back depth, perspective, subtle view changes and depth lighting provide volume. Soft source edges and a full-width field remove rectangular picture framing. These are reference-derived particle reliefs, not complete free-orbit reconstructed meshes. Procedural 3D geometry provides an image-load fallback.

Only the supplied logo/header GitHub link, animation, scene selectors, and final Mathematics x Intelligence caption are visible. There are no extra sections or explanatory copy. Mathematical annotations use a handwriting-style local font. No external fonts, models, scripts, or textures are fetched at runtime.

## Source

- `index.html`, `styles.css`: full-width composition, navigation, metadata and responsive layout.
- `story-shapes.js`: seven-scene timing and persistent digital conduit.
- `story-targets.js`: exact reference sampling, curved depth, soft edges and camera reconstruction.
- `story-geometry.js`: procedural fallback volumes and the final MXI particle mask.
- `story-shaders.js`: binary glyphs, depth lighting, perspective and conduit transitions.
- `story.js`: rendering, flip digits, scene jumping, interaction and lifecycle.
- `scripts/version-assets.py`: hashed production asset URLs for Pages caching.

Focus the animation and press Enter for a wave or Space to pause/resume. Scene buttons support keyboard activation. Reduced motion shows a static MXI by default and respects manually selected scenes. Rendering suspends when the tab is hidden or the stage is offscreen. A semantic heading and visual fallback remain if WebGL is unavailable.

## Preview and publish

```sh
python3 scripts/version-assets.py
python3 -m http.server 8768 --bind 127.0.0.1
```

Open <http://127.0.0.1:8768/>. Verified changes pushed to `main` deploy through GitHub Pages from the repository root. The owner authorized making this homepage repository public.

```sh
node --check story.js
node --check story-shapes.js
node --check story-targets.js
node --check story-geometry.js
node --check story-shaders.js
git diff --check
```

See `docs/verification.md` for acceptance evidence and limits.
