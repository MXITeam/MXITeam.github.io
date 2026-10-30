# Delivery verification

Date: 2026-10-30.

## Current composition

Minimal English homepage containing the supplied logo, GitHub link, a bright 0/1 sculpture, and **Mathematics x Intelligence**. There are no extra sections, top labels, explanatory sentences, visible interaction guidance, mode controls, or animation buttons.

The sculpture cycles **MXI → robot → brain → Earth → MXI**. Each shape holds for five seconds and morphs for three seconds. A fixed oblique camera retains volume and keeps the held MXI stationary. The reference-driven robot is an anatomical android profile, the brain uses a lateral anatomical outline with dedicated neural connections, and the globe centers on Asia/Pacific with stylized coasts and a particle halo. The primary targets are sampled from a local, original reference-guided sculpture sheet with shallow luminance depth; procedural geometry is a fallback. No third-party geometry or texture is fetched at runtime.

## Checks

- All three JavaScript sources pass syntax checks; Git whitespace checks pass.
- Deterministic target checks verify finite coordinates and opacity, correct shape order, normalized interpolation weights, and a continuous 32-second loop. Actual generated-image pixels were decoded and tested through the reference sampler; all three panels produce bounded finite targets and camera reprojection preserves their silhouettes.
- Mock-browser/WebGL checks cover a full loop with all four held targets, packed 19-float attributes, brain-network index-buffer bounds, automatic time advancement, click/Enter pulses, Space pause/resume, visibility suspension, reduced-motion static MXI, and context-loss fallback.
- A local CPU projection of the actual target geometry was visually inspected for recognizable robot, brain, and globe forms. This is a geometry preview, not evidence of actual WebGL rendering.
- Independent source review checked attribute stride/offsets, shader precision, cyclic weights, and reduced motion. Production asset filenames include hashes to avoid stale Pages caches.

## Limits

A later native browser screenshot confirmed a running binary globe and the minimal desktop composition in release 578c845. A local native GPU screenshot also confirmed the image-sampled Asia-Pacific globe and restored sans-serif MXI, with the earlier medium binary size. The latest further size increase and mobile layout have not completed native visual acceptance. Frame rate was not measured. Source checks and CPU previews do not establish those results.

## Publication

The owner authorized making this homepage repository public and deploying to **https://mxiteam.github.io/**. Pages uses `main` and `/`, with HTTPS enforced. Final public HTML and asset readback are verified independently at delivery.
