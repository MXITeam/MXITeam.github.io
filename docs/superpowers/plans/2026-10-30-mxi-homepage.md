# MXI Homepage Implementation Plan

**Goal:** A single-screen, English-only MXI binary sculpture, published at https://mxiteam.github.io/.

**Architecture:** Static HTML/CSS with separate shader and animation-controller files. Fixed-volume masking, local geometry, and no external runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-30-mxi-homepage-design.md`

- [x] Keep only the hero, logo/GitHub header, brand meaning, and exact English introduction.
- [x] Remove secondary sections, navigation, mode controls/status, and extra top labels.
- [x] Keep letters stationary with a fixed oblique camera, front/back/side layers, and inverse per-depth masking.
- [x] Add internal binary flow, graph connections, waves, cursor vortices, pulse input, and echoes.
- [x] Preserve pause/resume, reduced motion, fallback, and visibility suspension.
- [x] Fit narrow, laptop, and short landscape viewport layouts.
- [x] Run source checks, mocked runtime verification, static audit, and independent source review.
- [x] Apply explicit owner authorization to make only this homepage repository public and enable Pages.
- [ ] Push the final revision and verify its public Pages deployment and served files.
