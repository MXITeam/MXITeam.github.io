# Delivery verification

Date: 2026-10-30.

## Current composition

A pure-black, full-width binary particle sequence: **1011 → Mathematics → Mechanics → Robot → Brain → Universe → MXI**. Seven ten-second scenes loop continuously. The opening uses upper/lower split-flap digit animation without card surfaces or frames; the central bold 1011 stays fixed. Seven English selectors below the animation jump directly to their scenes and indicate the current one. The final MXI retains the original sans-serif font, readable 7–8.5px binary glyphs, and a fixed oblique view.

The exact owner-uploaded reference is `assets/story-reference.cc5b93713b1e.png` (2191 × 718). All five silhouettes are sampled from that file with soft edges and curved front/back depth. Particle neighborhoods travel through a continuous conduit rather than random scattering. The shader applies real perspective to the resulting XYZ coordinates. Procedural volumes provide a loading-failure fallback.

## Checks

- All production JavaScript sources pass syntax and Git whitespace checks.
- A one-off runtime diagnostic exercises a complete 70-second loop, all seven held targets, finite geometry, continuous target joins, pause/resume, hidden/offscreen suspension, reduced motion during an active pulse, static selected scene, and WebGL-context fallback.
- The exact supplied PNG was decoded independently. All five reference panels produced 10,000 finite bounded targets each, with measured front-to-back spans of approximately 0.98–1.34 normalized units.
- The original MXI grid diagnostic reproduced the old lattice coherence at approximately 1.0. Full-cell two-axis jitter and unbiased selection reduced measured coherence below 0.04. The final wordmask similarly uses two-axis jitter and shuffled sampling, with a maximum of 12,000 visible glyphs.
- Native Google Chrome for Testing screenshots confirmed the borderless opening chain and highlighted central 1011, full-width composition, and the reference-derived robot. Clicking Robot visibly switched to that source silhouette and highlighted its selector. Native inspection of the final flip refinement and Universe label is included in the final delivery pass.
- Independent source review covered seven buffers/targets, shader precision and projection consistency, scene transitions and lifecycle. Two found issues were corrected: negative pulse radius on reduced-motion changes, and discontinuous brain brightness at act boundaries.

## Limits

The scene shapes are reference-derived three-dimensional reliefs; they are not complete recovered meshes suitable for arbitrary camera angles. Native mobile performance and frame rate have not been measured. Geometry/lifecycle diagnostics alone do not establish visual quality or user acceptance.

## Publication

The owner authorized this homepage repository to be public at **https://mxiteam.github.io/**. Pages serves `main` at `/` with HTTPS. Production URLs use content hashes. Final delivery verifies both the built commit and served HTML/assets.
