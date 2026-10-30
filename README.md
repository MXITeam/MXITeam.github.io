# MXI: Mathematics x Intelligence

**https://mxiteam.github.io/**

A minimal English homepage on black. Binary particles cycle through **MXI → robot → brain → Earth → MXI**, holding each form for five seconds and morphing for three seconds. The camera stays fixed. MXI uses the original bold sans-serif letterform.

The visible page contains only the supplied logo, GitHub link, particle scene, and **Mathematics x Intelligence** caption. There are no extra sections, explanatory sentences, mode controls, or animation buttons.

## Reference-driven forms

The three detailed targets are sampled from a local, original, reference-guided sculpture sheet. Luminance-weighted sampling retains the android's mechanical details, the brain's folds and neural structure, and the Asia-Pacific globe's coastline. Layered luminance depth preserves the fixed-view silhouette; these are reference-derived point clouds rather than free-orbit polygon models. Procedural targets remain available if the image cannot load.

Binary glyphs are approximately 7–8.5 CSS pixels before depth variation, with a desktop budget of roughly 12,000 particles to keep them readable without excessive overlap. Hover motion reveals extra binary detail. Pointer/click effects remain local to the field.

Keyboard users can focus the scene, press Enter for a pulse, and Space to pause/resume. Reduced motion shows static MXI. Rendering suspends offscreen and in hidden tabs; a readable heading remains if graphics are unavailable.

## Source

- `index.html`: minimal composition and metadata.
- `styles.css`: original sans-serif branding and responsive layout.
- `particle-reference.js`: asynchronous local image loading, luminance-weighted targets, and fixed-view depth projection.
- `particle-shapes.js`: loop timing and procedural fallback targets.
- `particle-shaders.js`: binary glyphs, camera, interpolation, masking, and lighting.
- `particles.js`: geometry, interaction, lifecycle, and rendering.
- `assets/`: supplied avatar, generated sculpture sheet, and hashed production assets.

No external models, fonts, scripts, textures, or package installation are required at runtime. All assets are served by the site. Asset filenames carry content hashes to avoid stale Pages caches.

## Preview and publish

After changing a source asset:

```sh
python3 scripts/version-assets.py
python3 -m http.server 8768 --bind 127.0.0.1
```

Open <http://127.0.0.1:8768/>. Verified changes pushed to `main` deploy through GitHub Pages from the repository root. The owner authorized making this homepage repository public.

```sh
node --check particle-reference.js
node --check particles.js
node --check particle-shaders.js
node --check particle-shapes.js
git diff --check
```

Verification evidence and limits are recorded in `docs/verification.md`.
