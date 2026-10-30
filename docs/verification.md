# Delivery verification

Date: 2026-10-30.

## Current composition

Minimal English homepage containing the supplied logo, GitHub link, a bright 0/1 sculpture, and **Mathematics x Intelligence**. There are no extra sections, top labels, explanatory sentences, visible interaction guidance, mode controls, or animation buttons.

The sculpture cycles **MXI → robot → brain → Earth → MXI**. Each shape holds for five seconds and morphs for three seconds. A fixed oblique camera retains volume and keeps the held MXI stationary. The brain has folds and a brainstem; the globe uses stylized continental outlines. No external geometry or texture is downloaded.

## Checks

- All three JavaScript sources pass syntax checks; Git whitespace checks pass.
- Deterministic target checks verify finite coordinates and opacity, correct shape order, normalized interpolation weights, and a continuous 32-second loop.
- Mock-browser/WebGL checks verify packed 19-float attributes, automatic time advancement, click/Enter pulses, Space pause/resume, visibility suspension, reduced-motion static MXI, and context-loss fallback.
- A local CPU projection of the actual target geometry was visually inspected for recognizable robot, brain, and globe forms. This is a geometry preview, not evidence of actual WebGL rendering.
- Independent source review checked attribute stride/offsets, shader precision, cyclic weights, and reduced motion. Production asset filenames include hashes to avoid stale Pages caches.

## Limits

Browser access became unavailable and native screenshots were blank, so final GPU rendering, frame rate, morph appearance, and mobile-browser layout remain unverified. Source checks and CPU previews do not establish those results.

## Publication

The owner authorized making this homepage repository public and deploying to **https://mxiteam.github.io/**. Pages uses `main` and `/`, with HTTPS enforced. Final public HTML and asset readback are verified independently at delivery.
