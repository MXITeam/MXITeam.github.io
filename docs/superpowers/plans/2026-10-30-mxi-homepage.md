# MXI Homepage Implementation Plan

**Goal:** A minimal binary-particle MXI → robot → brain → Earth loop, published at https://mxiteam.github.io/.

**Architecture:** Static HTML/CSS, deterministic shape targets, shaders, and animation controller. Local content-hashed assets; no package dependencies.

**Spec:** `docs/superpowers/specs/2026-10-30-mxi-homepage-design.md`

- [x] Keep only the logo/GitHub header, particle sculpture, and brand caption.
- [x] Remove extra sections, labels, explanations, visible instructions, and all animation buttons.
- [x] Generate a detailed original sculpture sheet and sample reference-derived robot, brain, and Earth targets with a continuous 32-second morph cycle.
- [x] Restore the original sans-serif MXI font and enlarge binary glyphs while reducing overlap.
- [x] Keep the camera fixed and MXI stationary during its hold, retaining volume and depth layers.
- [x] Preserve keyboard input, reduced motion, fallback, and visibility suspension.
- [x] Verify target geometry, ordered loop weights, runtime lifecycle, source syntax, and static scope.
- [x] Apply owner authorization to publish only this homepage repository through Pages.
- [ ] Push and verify the final deployed HTML and all content-hashed production assets.
