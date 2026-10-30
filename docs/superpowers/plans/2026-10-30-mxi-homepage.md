# MXI Homepage Implementation Plan

**Goal:** An English-only MXI homepage with a black, animated silver-white point-cloud hero, ready for GitHub Pages.

**Architecture:** Static semantic HTML and shared CSS, with separate navigation and volumetric particle modules. All geometry and assets are local; no backend or build dependencies.

**Tech Stack:** HTML, CSS, JavaScript, WebGL, SVG, Python's local HTTP server.

**Spec:** `docs/superpowers/specs/2026-10-30-mxi-homepage-design.md`

## Global constraints

- Use MXI as the brand and the supplied GitHub avatar as its logo.
- Black background, silver-white three-dimensional particles, English-only copy.
- Animate visibly without requiring mouse input.
- Publish only the verified public project's information; no invented team or research results.
- Do not modify existing test files or change repository visibility without authorization.
- No required external fonts, scripts, trackers, or runtime services.

## Implementation

- [x] Create `index.html` with navigation, particle-letter hero, research details, project links, principles, and collaboration section.
- [x] Create `styles.css` with responsive dark layouts, accessible focus, and reduced-motion styles.
- [x] Create `script.js` for mobile navigation and active-section state.
- [x] Create `particles.js` for three-dimensional geometry, automatic motion, cursor interaction, pause/resume, and visibility handling.
- [x] Add the supplied logo, favicon, metadata, sitemap, robots file, and preview instructions.
- [x] Validate source and runtime behavior; accurately document the browser verification boundary.
- [x] Review, commit, push, and check Pages publication without changing visibility. Pages returned HTTP 422 because the repository is private on GitHub Free; visibility changes require owner authorization.
- [x] Honor the owner's decision to keep the repository private and provide the local preview instead of public deployment.
