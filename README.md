# MXI

Mathematics x Intelligence.

[Website](https://mxiteam.github.io/)

## Run locally

The homepage and the MXI-RoboICL article are static HTML, CSS, and JavaScript.
No build step, package installation, or API credentials are required. From the
repository root, start a local HTTP server:

```sh
python3 scripts/serve.py
```

Open <http://127.0.0.1:8000/> and select **MXI RoboICL**, or open
<http://127.0.0.1:8000/roboicl/> directly. Use the HTTP server rather than opening
the HTML file directly, because the interactive scenes load ES modules and data
with `fetch()`. The bundled server supports byte-range requests so the films can
seek without downloading the entire file first. Use `--port 8001` to choose a
different local port.

The article source is in `roboicl/`. Its fonts, wrist images, robot meshes,
motion data, vendored Three.js modules, 1080p and 4K films, poster, and English
captions are included in `assets/`. Runtime assets use relative paths and do not
depend on a personal website or external CDN. The 3D illustrations require a
browser with WebGL support.

GitHub Pages serves the repository root from `main`; the article is published at
<https://mxiteam.github.io/roboicl/> after merging and deployment.

The existing context-flow checks can be run with Node.js:

```sh
node --test tests/context-flow.test.mjs
```
