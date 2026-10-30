# MXI

MXI: **Mathematics x Intelligence**. An English-only team homepage, built for GitHub Pages with plain HTML, CSS, JavaScript, and WebGL. No dependency installation or build step is required.

## Local preview

From the repository root:

```sh
python3 -m http.server 8768 --bind 127.0.0.1
```

Open <http://127.0.0.1:8768>. Stop the server with Ctrl+C. Refresh the page after changing source files.

## Content and design

- `index.html`: English content, accessible navigation, metadata, and a readable MXI heading.
- `styles.css`: black and silver visual design, responsive layout, focus states, and reduced-motion styles.
- `script.js`: mobile navigation, active-section indicators, and the current year.
- `particles.js`: locally generated, volumetric silver-white MXI lettering with automatic rotation, flowing particles, scatter/reassembly, cursor interaction, and a pause/resume control.
- `assets/mxi-logo.png`: the avatar supplied by the site owner, downloaded from the MXITeam GitHub avatar on 2026-10-30.

The brand is **MXI**, expanded exactly as **Mathematics x Intelligence**. The page title, hero tagline, introduction, and footer use this meaning. All published copy is English. The particle aesthetic follows the owner's reference: dense, silver-white points with visible depth on black. Motion starts automatically; pause/resume is available in the hero. Animation stops offscreen, in hidden tabs, and for a reduced-motion preference. The semantic MXI heading remains readable if WebGL is unavailable. The illustration does not claim a demonstration or measured result.

Research descriptions express interests and engineering approaches. The site does not claim benchmark results or list unconfirmed team members. The public project description is based on [EmbodiedAI-Demo-Pipeline's README](https://github.com/MXITeam/EmbodiedAI-Demo-Pipeline#readme). Private organization repositories are not listed.

## GitHub Pages

The site is ready to publish directly from the root of `main`. In repository **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)`. `.nojekyll` disables unnecessary Jekyll processing. The intended URL is <https://mxiteam.github.io/>.

The owner chose to keep the repository private and use a local preview. GitHub Pages returned HTTP 422 because private organization repositories are not supported on the current GitHub Free plan. No public site was deployed and repository visibility remains unchanged. Do not change visibility without new owner authorization.

For a future custom domain, update the canonical URL, Open Graph URL/image, `robots.txt`, and `sitemap.xml` together.

## Checks

```sh
node --check script.js
node --check particles.js
git diff --check
```

Acceptance covers automatic particle movement, pause/resume, reduced motion, offscreen/hidden-tab suspension, mobile navigation and Escape, research accordions, local assets and anchors, English-only copy, and a readable heading when graphics are unavailable. See `docs/verification.md` for the actual checks and limits of this delivery.
