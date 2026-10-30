# Delivery verification

Date: 2026-10-30.

## Current revision

Single-screen English-only homepage. The wordmark is **MXI**, expanded as **Mathematics x Intelligence**, without a trailing dot. The supplied avatar is local. About, Research, project and footer sections, secondary navigation, mode controls/status, and extra top labels are removed.

The volumetric binary letters use a constant oblique camera and fixed per-depth masks. Front, back, and side layers restore depth; only the internal 0/1 field moves. Direct interaction provides local vortices and click/tap/Enter pulses. Streaming, connections, waves, echoes, and glow blend internally without mode buttons.

## Completed source and runtime checks

- Both JavaScript files pass Node syntax checks; Git whitespace checks pass.
- A local mock-browser/WebGL harness verifies automatic time advancement, normalized field blending, click and Enter pulses, pause/resume, hidden-tab and offscreen suspension, reduced-motion static rendering, and graphics-context-loss fallback.
- Static HTML checks cover the single-screen scope, exact English copy, local asset references, internal anchors, and removed labels/navigation.
- Independent source review checked the fixed camera inverse and texture orientation, shader interfaces, and interaction lifecycle. The unsafe GLSL negative-base square was replaced by multiplication; viewport sizing uses remaining height and a short-height rule.

The harness does not establish real GPU shader compilation, frame rate, visual quality, or binary-glyph legibility. Native browser acceptance could not be completed: the browser access host became unavailable, and screenshots were blank. GPU visual and mobile-browser checks remain unverified.

## Publication

The owner authorized publishing this homepage repository and making it public. GitHub API confirms Pages uses `main` and `/`, with HTTPS enforced, at **https://mxiteam.github.io/**. The final pushed revision's build and served asset checks are verified separately at delivery. Other repository visibility settings are outside this change.
