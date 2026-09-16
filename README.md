# Double-Worder ✦ Rotational Ambigram Studio

> A sleek, high-precision typographic web application engineered to generate authentic 180° rotational ambigrams, format them across international and American paper sizes, and export clean vector assets in **SVG** and **DXF** (AutoCAD R12/CAM format) for print, CNC routing, and laser cutting.

Designed from three synergistic disciplines:
- 🛡️ **Senior Site Reliability Engineer (SRE)**: 100% client-side zero-dependency architecture, instant GitHub Pages deployment, defensive input sanitization, sub-second LCP, zero runtime server costs or points of failure.
- 💻 **Senior Developer**: Modular ES6 architecture, vector math discretization, standard-compliant AutoCAD DXF generation with inverted Cartesian mapping, robust testing harness.
- ✒️ **Experienced Type Designer**: Deep typographic principles of rotational ambigram design—Blackletter Textura minims, optical centering, stroke contrast ratios, 180° rotational morphology, and counter balancing.

---

## ⚡ Key Capabilities

### 1. Rotational Ambigram Typography Engine
- **Single-Word Rotational Ambigrams**: Enter any string (e.g. `ILLUMINATI`, `VICTORIA`, `MAGIC`, `SWIMS`) and the engine pairs character $i$ with character $N - 1 - i$. Central letters in odd-length words are mapped to 180° self-symmetric glyphs.
- **Dual-Word Flip Ambigrams**: Enter two distinct words (e.g., `ANGEL` and `DEVIL`, or `FAITH` and `HOPE`). The ambigram reads Word 1 right-side up and Word 2 when turned upside-down!
- **Universal Morphological Synthesizer**: Generates balanced vector contours for all $26 \times 26 = 676$ possible letter pairings by harmonizing vertical minim rhythm with top/bottom morphological cues.
- **Bespoke Handcrafted Glyph Library**: Hand-tuned vector definitions for all 26 self-symmetric letters and famous historical ambigram pairs (`M ↔ W`, `N ↔ U`, `V ↔ A`, `D ↔ P`, `C ↔ R`, `T ↔ O`, `B ↔ Q`, `H ↔ Y`, etc.).
- **Four Distinct Typographic Styles**:
  1. **Gothic Textura**: Medieval Blackletter with 45° lozenges, diamond terminals, and dense vertical minims (classic Dan Brown / John Langdon style).
  2. **Modern Geometric**: High-contrast constructivist monoline with clean architectural curves and modular joints.
  3. **Classical Serif**: Roman imperial lettering with modulated stroke weight and bracketed serifs.
  4. **Laser / CNC Stencil**: Specially bridged counter-spaces ensuring no interior "islands" drop out when cut on a laser or vinyl plotter.
- **Parametric Fine-Tuning**: Real-time sliders for Stroke Weight, Stroke Contrast ratio, Letter Spacing (tracking), Italic Slant ($-15^\circ$ to $+15^\circ$), and Symmetrical Flourishes (Calligraphic Swashes, Gothic Filigree, Frame Brackets).

### 2. Paper & Canvas Sizing
- **Default Size**: **ISO A4 (210 × 297 mm)**.
- **International Sizes (ISO 216)**:
  - **A4**: $210 \times 297\text{ mm}$ (Global Standard)
  - **A3**: $297 \times 420\text{ mm}$ (Poster format)
  - **A5**: $148 \times 210\text{ mm}$ (Booklet format)
- **North American Sizes (ANSI)**:
  - **US Letter**: $8.5 \times 11\text{ in}$ ($215.9 \times 279.4\text{ mm}$)
  - **US Legal**: $8.5 \times 14\text{ in}$ ($215.9 \times 355.6\text{ mm}$)
  - **US Tabloid / Ledger**: $11 \times 17\text{ in}$ ($279.4 \times 431.8\text{ mm}$)
  - **US Junior Legal**: $5 \times 8\text{ in}$ ($127 \times 203.2\text{ mm}$)
- **Laser & Vinyl Cutter Beds**:
  - **12" Vinyl / Cricut Mat**: $12 \times 12\text{ in}$ ($304.8 \times 304.8\text{ mm}$)
  - **Square 300**: $300 \times 300\text{ mm}$
- **Custom Dimensions**: User-definable width and height in millimeters or inches.
- **Instant Orientation Switch**: Landscape or Portrait with 1-click reflow and auto-scaling.
- **Printable Safe Margins & Optical Centering**: Adjustable margin boundaries (5–60 mm) with typographic optical center compensation (+2.5% vertical lift).

### 3. Professional Export Capabilities
- **Download SVG**:
  - Precision vector output with standard `viewBox`, exact millimeter or inch sizing.
  - Mode selection: Solid Filled Outlines (Graphic/Print), 0.1mm Red Hairline Cut Outlines (Laser/Plotter), or Both.
  - Optional canvas boundary layer and 180° rotational center registration mark.
- **Download DXF (AutoCAD R12 / CAM / Laser Cutters)**:
  - Strict AutoCAD R12 ASCII DXF output with `$INSUNITS = 4` (Millimeters) or `1` (Inches).
  - Cubic Bezier curves discretized into high-resolution closed `POLYLINE`/`VERTEX`/`SEQEND` contours.
  - Inverted Cartesian Y-axis ($Y_{\text{cad}} = \text{Height} - Y_{\text{svg}}$) so CAD software (AutoCAD, LightBurn, RDWorks, Fusion 360, Carbide Create, Cricut Design Space) reads the drawing right-side up with $(0,0)$ origin at the bottom-left.
- **Download PNG (300 DPI)**:
  - High-resolution print proof generated client-side via HTML5 Canvas.
- **One-Click SVG Clipboard Copy**: Instant copy for fast paste into Illustrator, Inkscape, or Figma.

### 4. Interactive Inspection & Ergonomics
- **180° Flip Button**: Smooth 3D animation flipping the canvas between $0^\circ$ (Upright) and $180^\circ$ (Inverted).
- **Continuous Auto-Spin**: Rotates through $360^\circ$ to visually verify rotational balance and rhythm.
- **Simultaneous Split-View**: Side-by-side display of the upright and inverted versions at the exact same time.
- **Letterform Symmetry Rhythm Bar**: Displays every character pair (e.g. `[V ↔ A] [I ↔ I] [C ↔ R] [T ↔ O]`) and highlights central self-symmetric anchors.
- **Hotkeys**:
  - `Space` or `R`: Flip 180°
  - `S`: Toggle Auto-Spin
- **URL State Sharing**: Permalinks encode text, style, canvas size, orientation, and theme in the hash fragment.

---

## 🏗️ Project Architecture

```
double-worder/
├── index.html               # Semantic, accessible HTML5 application shell
├── css/
│   └── main.css             # Modern stylesheet (Dark, Paper, Blueprint, Parchment themes, CSS grid)
├── js/
│   ├── app.js               # Application coordinator, DOM event listeners, state management
│   ├── bundle.js            # Standalone IIFE bundle for local file:// and web execution
│   ├── ambigram-engine.js   # 180° rotational typography engine & parametric synthesizer
│   ├── vector-renderer.js   # SVG path transformation, canvas fitting & rotational preview
│   ├── canvas-sizes.js      # ISO 216 & ANSI paper standards repository
│   ├── presets.js           # Curated ambigram showcase words
│   └── exporters/
│       ├── svg-exporter.js  # Production SVG XML generator with cutline styling
│       ├── dxf-exporter.js  # AutoCAD R12 DXF generator for CAM/laser cutters
│       └── png-exporter.js  # 300 DPI high-resolution proof renderer
├── assets/
│   └── favicon.svg          # Ambigram icon vector
├── tests/
│   ├── dxf-validator.js     # Structural parser & validator for DXF files
│   ├── test-engine.js       # End-to-end integration test
│   ├── test-dxf.js          # DXF syntax & section validation
│   ├── test-alphabet.js     # Exhaustive 26-letter & random pair stress test
│   ├── test-all-themes.js   # Headless browser verification of all 4 color themes
│   └── test-browser-features.js # Headless browser UI interaction verification
├── .github/
│   └── workflows/
│       └── deploy.yml       # Automated GitHub Pages CI/CD workflow
├── .nojekyll                # Disables Jekyll processing on GitHub Pages
├── package.json             # Test and local development scripts
└── README.md                # Comprehensive documentation
```

---

## 🚀 Hosting on GitHub Pages & Local Usage

The application requires **zero external servers** and comes with a pre-built standalone bundle (`js/bundle.js`) committed directly to the repository. It runs instantly out-of-the-box by double-clicking `index.html` locally via `file://`, via `npm start`, or hosted on GitHub Pages.

For local development when modifying modular ES6 sources in `js/`:
```bash
npm run build   # Rebuilds js/bundle.js via esbuild
npm test        # Runs test suite
npm start       # Serves local directory on http://localhost:3000
```

### Automatic Deployment (GitHub Actions)
1. Push this repository to GitHub on branch `main`.
2. In your repository settings:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically deploy the site to `https://<username>.github.io/<repository-name>/`.

### Manual / Branch Deployment
Alternatively:
- Under **Settings** → **Pages** → **Source**, choose **Deploy from a branch**.
- Select branch `main` and folder `/ (root)`.
- Save, and your app is live!

---

## 🧪 Testing & Verification

Run the automated test suite with Node.js:

```bash
npm test
```

This verifies:
1. Generation of single-word ambigrams, dual-word flips, and odd-length central symmetric anchors.
2. SVG structure compliance and namespace validity.
3. DXF R12 structure (`HEADER`, `TABLES`, `BLOCKS`, `ENTITIES`, `POLYLINE`, `VERTEX`, `SEQEND`, `0 EOF`).
4. All 26 letters of the English alphabet in self-symmetric and pair configurations.

---

## 📜 License

MIT License. Engineered for typographers, laser crafters, makers, and web developers.
