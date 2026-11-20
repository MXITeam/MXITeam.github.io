# MXI

Mathematics x Intelligence.

[Website](https://mxiteam.github.io/)

## MXI-RoboICL

The article at `roboicl/index.html` is a static HTML, CSS, and browser-JavaScript
page. The homepage's **MXI RoboICL** project links to `./roboicl/`.

The existing GitHub Pages configuration publishes `main` from the repository
root. After merging and the normal Pages deployment, the article is available at
<https://mxiteam.github.io/roboicl/>. No separate application server, build step,
package installation, or deployment service is needed.

The article's images, fonts, Three.js modules, robot meshes, motion data, English
captions, and 1080p/4K films are included under `assets/`. All runtime asset paths
are relative to this repository; the page does not depend on a personal website
or external CDN. The interactive illustrations run in the browser with WebGL.
