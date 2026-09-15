/**
 * Double-Worder Main Application Controller
 * Orchestrates user interactions, real-time typography rendering, URL persistence,
 * keyboard shortcuts, and SVG/DXF exports.
 */

import { AmbigramEngine } from './ambigram-engine.js';
import { VectorRenderer } from './vector-renderer.js';
import { CANVAS_SIZES, resolveCanvasDimensions } from './canvas-sizes.js';
import { SvgExporter } from './exporters/svg-exporter.js';
import { DxfExporter } from './exporters/dxf-exporter.js';
import { PngExporter } from './exporters/png-exporter.js';
import { PRESETS } from './presets.js';

class AmbigramApp {
  constructor() {
    this.engine = new AmbigramEngine();
    this.state = {
      text: 'ILLUMINATI',
      secondaryText: '',
      isDualWord: false,
      sizeId: 'A4',
      orientation: 'landscape',
      customWidth: 210,
      customHeight: 297,
      customUnit: 'mm',
      style: 'gothic',
      strokeWidth: 20,
      contrast: 2.0,
      letterSpacing: 10,
      slant: 0,
      flourishes: 'swashes',
      theme: 'dark',
      renderMode: 'filled',
      showGuides: true,
      showCenterPivot: true,
      marginMm: 20,
      scaleFactor: 1.0,
      opticalCenter: true,
      viewMode: 'single', // 'single' or 'split'
      exportHairline: false,
      includeBorder: false,
      includePivotMark: false
    };

    this.currentResult = null;
    this.currentCanvasDims = null;
    this.currentCanvasTransform = null;
    this.currentPositionedPath = '';

    this.initElements();
    this.loadStateFromUrl();
    this.initRenderer();
    this.setTheme(this.state.theme);
    this.bindEvents();
    this.renderPresets();
    this.update();
  }

  initElements() {
    // Inputs
    this.elText = document.getElementById('input-text');
    this.elSecondaryText = document.getElementById('input-secondary-text');
    this.elSecondaryGroup = document.getElementById('group-secondary-text');
    this.elDualWordToggle = document.getElementById('toggle-dual-word');
    
    // Canvas dimensions
    this.elCanvasSize = document.getElementById('select-canvas-size');
    this.elOrientationLandscape = document.getElementById('btn-orient-landscape');
    this.elOrientationPortrait = document.getElementById('btn-orient-portrait');
    this.elCustomSizeGroup = document.getElementById('group-custom-size');
    this.elCustomWidth = document.getElementById('input-custom-width');
    this.elCustomHeight = document.getElementById('input-custom-height');
    this.elCustomUnit = document.getElementById('select-custom-unit');
    this.elCanvasBadge = document.getElementById('canvas-dimension-badge');

    // Style & Typography
    this.elStyleButtons = document.querySelectorAll('[data-style]');
    this.elStrokeWidth = document.getElementById('slider-stroke-width');
    this.elStrokeWidthVal = document.getElementById('val-stroke-width');
    this.elContrast = document.getElementById('slider-contrast');
    this.elContrastVal = document.getElementById('val-contrast');
    this.elSpacing = document.getElementById('slider-spacing');
    this.elSpacingVal = document.getElementById('val-spacing');
    this.elSlant = document.getElementById('slider-slant');
    this.elSlantVal = document.getElementById('val-slant');
    this.elFlourishes = document.getElementById('select-flourishes');
    this.elMargin = document.getElementById('slider-margin');
    this.elMarginVal = document.getElementById('val-margin');
    this.elScale = document.getElementById('slider-scale');
    this.elScaleVal = document.getElementById('val-scale');

    // Theme & Mode
    this.elThemeButtons = document.querySelectorAll('.theme-btn[data-theme]');
    this.elRenderMode = document.getElementById('select-render-mode');
    this.elToggleGuides = document.getElementById('toggle-guides');
    this.elTogglePivot = document.getElementById('toggle-pivot');

    // View & Inspection
    this.elBtnFlip = document.getElementById('btn-flip-180');
    this.elBtnSpin = document.getElementById('btn-spin');
    this.elBtnSplit = document.getElementById('btn-split-view');
    this.elRotationBadge = document.getElementById('rotation-badge');

    // Containers
    this.elCanvasContainer = document.getElementById('canvas-container');
    this.elSplitSecondaryContainer = document.getElementById('canvas-container-inverted');
    this.elSplitWrapper = document.getElementById('split-canvas-wrapper');
    this.elPairsStrip = document.getElementById('letter-pairs-strip');
    this.elPresetsList = document.getElementById('presets-chips');

    // Export buttons
    this.elBtnExportSvg = document.getElementById('btn-export-svg');
    this.elBtnExportDxf = document.getElementById('btn-export-dxf');
    this.elBtnExportPng = document.getElementById('btn-export-png');
    this.elBtnCopySvg = document.getElementById('btn-copy-svg');

    // Toast notification
    this.elToast = document.getElementById('toast-notification');
  }

  initRenderer() {
    this.renderer = new VectorRenderer(this.elCanvasContainer);
    if (this.elSplitSecondaryContainer) {
      this.invertedRenderer = new VectorRenderer(this.elSplitSecondaryContainer);
      this.invertedRenderer.setRotation(180);
    }
  }

  setTheme(themeName) {
    const validThemes = ['dark', 'paper', 'blueprint', 'parchment'];
    const theme = validThemes.includes(themeName) ? themeName : 'dark';
    this.state.theme = theme;

    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);

    if (this.elThemeButtons) {
      this.elThemeButtons.forEach(btn => {
        const isMatch = btn.getAttribute('data-theme') === theme;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      });
    }

    this.update();
  }

  loadStateFromUrl() {
    try {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        if (params.has('text')) this.state.text = params.get('text');
        if (params.has('sec')) {
          this.state.secondaryText = params.get('sec');
          this.state.isDualWord = true;
        }
        if (params.has('size')) this.state.sizeId = params.get('size');
        if (params.has('orient')) this.state.orientation = params.get('orient');
        if (params.has('style')) this.state.style = params.get('style');
        if (params.has('theme')) this.state.theme = params.get('theme');
        if (params.has('flourish')) this.state.flourishes = params.get('flourish');
      }
    } catch (e) {
      console.warn('Could not parse URL hash params:', e);
    }
  }

  updateUrlHash() {
    try {
      const params = new URLSearchParams();
      params.set('text', this.state.text);
      if (this.state.isDualWord && this.state.secondaryText) {
        params.set('sec', this.state.secondaryText);
      }
      params.set('size', this.state.sizeId);
      params.set('orient', this.state.orientation);
      params.set('style', this.state.style);
      params.set('theme', this.state.theme);
      window.history.replaceState(null, '', '#' + params.toString());
    } catch (e) {
      // Ignore in restricted environments
    }
  }

  bindEvents() {
    // Text input
    this.elText.value = this.state.text;
    this.elText.addEventListener('input', (e) => {
      this.state.text = e.target.value.slice(0, 24);
      this.update();
    });

    if (this.elSecondaryText) {
      this.elSecondaryText.value = this.state.secondaryText;
      this.elSecondaryText.addEventListener('input', (e) => {
        this.state.secondaryText = e.target.value.slice(0, 24);
        this.update();
      });
    }

    if (this.elDualWordToggle) {
      this.elDualWordToggle.checked = this.state.isDualWord;
      this.elDualWordToggle.addEventListener('change', (e) => {
        this.state.isDualWord = e.target.checked;
        this.elSecondaryGroup.style.display = this.state.isDualWord ? 'block' : 'none';
        this.update();
      });
      this.elSecondaryGroup.style.display = this.state.isDualWord ? 'block' : 'none';
    }

    // Canvas Size
    this.elCanvasSize.value = this.state.sizeId;
    this.elCanvasSize.addEventListener('change', (e) => {
      this.state.sizeId = e.target.value;
      this.elCustomSizeGroup.style.display = (this.state.sizeId === 'CUSTOM') ? 'grid' : 'none';
      this.update();
    });

    // Orientation buttons
    this.elOrientationLandscape.addEventListener('click', () => {
      this.state.orientation = 'landscape';
      this.updateOrientationUI();
      this.update();
    });
    this.elOrientationPortrait.addEventListener('click', () => {
      this.state.orientation = 'portrait';
      this.updateOrientationUI();
      this.update();
    });
    this.updateOrientationUI();

    // Custom dimensions
    if (this.elCustomWidth) {
      this.elCustomWidth.addEventListener('input', (e) => {
        this.state.customWidth = Math.max(10, parseFloat(e.target.value) || 210);
        this.update();
      });
    }
    if (this.elCustomHeight) {
      this.elCustomHeight.addEventListener('input', (e) => {
        this.state.customHeight = Math.max(10, parseFloat(e.target.value) || 297);
        this.update();
      });
    }
    if (this.elCustomUnit) {
      this.elCustomUnit.addEventListener('change', (e) => {
        this.state.customUnit = e.target.value;
        this.update();
      });
    }

    // Style buttons
    this.elStyleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.style = btn.getAttribute('data-style');
        this.elStyleButtons.forEach(b => b.classList.toggle('active', b === btn));
        this.update();
      });
    });

    // Sliders
    const bindSlider = (slider, valDisplay, key, unit = '') => {
      if (!slider) return;
      slider.value = this.state[key];
      if (valDisplay) valDisplay.textContent = this.state[key] + unit;
      slider.addEventListener('input', (e) => {
        this.state[key] = parseFloat(e.target.value);
        if (valDisplay) valDisplay.textContent = this.state[key] + unit;
        this.update();
      });
    };

    bindSlider(this.elStrokeWidth, this.elStrokeWidthVal, 'strokeWidth');
    bindSlider(this.elContrast, this.elContrastVal, 'contrast', 'x');
    bindSlider(this.elSpacing, this.elSpacingVal, 'letterSpacing', 'px');
    bindSlider(this.elSlant, this.elSlantVal, 'slant', '°');
    bindSlider(this.elMargin, this.elMarginVal, 'marginMm', 'mm');
    bindSlider(this.elScale, this.elScaleVal, 'scaleFactor', 'x');

    // Flourishes
    if (this.elFlourishes) {
      this.elFlourishes.value = this.state.flourishes;
      this.elFlourishes.addEventListener('change', (e) => {
        this.state.flourishes = e.target.value;
        this.update();
      });
    }

    // Render Mode & Guides
    if (this.elRenderMode) {
      this.elRenderMode.value = this.state.renderMode;
      this.elRenderMode.addEventListener('change', (e) => {
        this.state.renderMode = e.target.value;
        this.update();
      });
    }

    if (this.elToggleGuides) {
      this.elToggleGuides.checked = this.state.showGuides;
      this.elToggleGuides.addEventListener('change', (e) => {
        this.state.showGuides = e.target.checked;
        this.update();
      });
    }

    if (this.elTogglePivot) {
      this.elTogglePivot.checked = this.state.showCenterPivot;
      this.elTogglePivot.addEventListener('change', (e) => {
        this.state.showCenterPivot = e.target.checked;
        this.update();
      });
    }

    // Theme buttons
    if (this.elThemeButtons) {
      this.elThemeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetTheme = btn.getAttribute('data-theme');
          this.setTheme(targetTheme);
          this.showToast(`Switched to ${targetTheme.charAt(0).toUpperCase() + targetTheme.slice(1)} theme`);
        });
      });
    }

    // 180° Flip Button
    this.elBtnFlip.addEventListener('click', () => {
      const newAngle = this.renderer.toggleFlip();
      this.updateRotationBadge(newAngle);
    });

    // Auto-Spin Button
    this.elBtnSpin.addEventListener('click', () => {
      const isSpinning = this.renderer.toggleContinuousSpin();
      this.elBtnSpin.classList.toggle('active-spin', isSpinning);
      this.elBtnSpin.setAttribute('aria-pressed', isSpinning);
      this.updateRotationBadge(this.renderer.rotationDeg);
    });

    // Split View Button
    if (this.elBtnSplit) {
      this.elBtnSplit.addEventListener('click', () => {
        this.state.viewMode = (this.state.viewMode === 'single') ? 'split' : 'single';
        this.elBtnSplit.classList.toggle('active', this.state.viewMode === 'split');
        if (this.elSplitWrapper) {
          this.elSplitWrapper.classList.toggle('split-active', this.state.viewMode === 'split');
        }
        this.update();
      });
    }

    // Export Buttons
    this.elBtnExportSvg.addEventListener('click', () => this.handleExportSvg());
    this.elBtnExportDxf.addEventListener('click', () => this.handleExportDxf());
    if (this.elBtnExportPng) {
      this.elBtnExportPng.addEventListener('click', () => this.handleExportPng());
    }
    if (this.elBtnCopySvg) {
      this.elBtnCopySvg.addEventListener('click', () => this.handleCopySvg());
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        const angle = this.renderer.toggleFlip();
        this.updateRotationBadge(angle);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        this.elBtnSpin.click();
      }
    });
  }

  updateOrientationUI() {
    this.elOrientationLandscape.classList.toggle('active', this.state.orientation === 'landscape');
    this.elOrientationPortrait.classList.toggle('active', this.state.orientation === 'portrait');
  }

  updateRotationBadge(angle) {
    if (!this.elRotationBadge) return;
    const normAngle = Math.round(angle) % 360;
    if (normAngle === 0) {
      this.elRotationBadge.textContent = '0° (Upright)';
      this.elRotationBadge.className = 'badge badge-upright';
    } else if (normAngle === 180) {
      this.elRotationBadge.textContent = '180° (Inverted)';
      this.elRotationBadge.className = 'badge badge-inverted';
    } else {
      this.elRotationBadge.textContent = `${normAngle}°`;
      this.elRotationBadge.className = 'badge badge-spinning';
    }
  }

  renderPresets() {
    if (!this.elPresetsList) return;
    this.elPresetsList.innerHTML = '';
    PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `<span class="preset-name">${preset.title}</span><span class="preset-tag">${preset.style}</span>`;
      chip.title = preset.description;
      chip.addEventListener('click', () => {
        this.applyPreset(preset);
      });
      this.elPresetsList.appendChild(chip);
    });
  }

  applyPreset(preset) {
    this.state.text = preset.text1;
    this.elText.value = preset.text1;

    if (preset.text2) {
      this.state.secondaryText = preset.text2;
      this.state.isDualWord = true;
      if (this.elSecondaryText) this.elSecondaryText.value = preset.text2;
      if (this.elDualWordToggle) this.elDualWordToggle.checked = true;
      if (this.elSecondaryGroup) this.elSecondaryGroup.style.display = 'block';
    } else {
      this.state.secondaryText = '';
      this.state.isDualWord = false;
      if (this.elDualWordToggle) this.elDualWordToggle.checked = false;
      if (this.elSecondaryGroup) this.elSecondaryGroup.style.display = 'none';
    }

    if (preset.style) {
      this.state.style = preset.style;
      this.elStyleButtons.forEach(b => b.classList.toggle('active', b.getAttribute('data-style') === preset.style));
    }
    if (preset.strokeWidth) {
      this.state.strokeWidth = preset.strokeWidth;
      if (this.elStrokeWidth) this.elStrokeWidth.value = preset.strokeWidth;
      if (this.elStrokeWidthVal) this.elStrokeWidthVal.textContent = preset.strokeWidth;
    }
    if (preset.contrast) {
      this.state.contrast = preset.contrast;
      if (this.elContrast) this.elContrast.value = preset.contrast;
      if (this.elContrastVal) this.elContrastVal.textContent = preset.contrast + 'x';
    }
    if (preset.flourishes) {
      this.state.flourishes = preset.flourishes;
      if (this.elFlourishes) this.elFlourishes.value = preset.flourishes;
    }
    if (preset.letterSpacing) {
      this.state.letterSpacing = preset.letterSpacing;
      if (this.elSpacing) this.elSpacing.value = preset.letterSpacing;
      if (this.elSpacingVal) this.elSpacingVal.textContent = preset.letterSpacing + 'px';
    }

    this.showToast(`Applied preset: ${preset.title}`);
    this.update();
  }

  update() {
    // 1. Generate Ambigram vector paths
    const result = this.engine.generate({
      text: this.state.text,
      secondaryText: this.state.isDualWord ? this.state.secondaryText : '',
      style: this.state.style,
      strokeWidth: this.state.strokeWidth,
      contrast: this.state.contrast,
      letterSpacing: this.state.letterSpacing,
      slant: this.state.slant,
      flourishes: this.state.flourishes
    });
    this.currentResult = result;

    // 2. Resolve canvas dimensions
    const canvasDims = resolveCanvasDimensions({
      sizeId: this.state.sizeId,
      orientation: this.state.orientation,
      customWidth: this.state.customWidth,
      customHeight: this.state.customHeight,
      customUnit: this.state.customUnit
    });
    this.currentCanvasDims = canvasDims;

    // Update canvas badge
    if (this.elCanvasBadge) {
      const presetInfo = CANVAS_SIZES[this.state.sizeId] || {};
      const dimLabel = `${canvasDims.width} × ${canvasDims.height} ${canvasDims.unit}`;
      const inchLabel = presetInfo.displayInches ? ` (${presetInfo.displayInches})` : '';
      this.elCanvasBadge.textContent = `${presetInfo.name || this.state.sizeId}: ${dimLabel}${inchLabel} [${this.state.orientation.toUpperCase()}]`;
    }

    // 3. Compute scale & position transformation
    const transform = this.renderer.computeCanvasTransform({
      ambigramResult: result,
      canvasWidth: canvasDims.width,
      canvasHeight: canvasDims.height,
      marginMm: this.state.marginMm,
      scaleFactor: this.state.scaleFactor,
      opticalCenter: this.state.opticalCenter
    });
    this.currentCanvasTransform = transform;

    // 4. Map paths to physical canvas coordinates
    const positionedPath = this.renderer.transformPathToCanvas(result.masterPathData, transform);
    this.currentPositionedPath = positionedPath;

    // 5. Render Primary Canvas Preview
    this.renderer.renderPreview({
      ambigramResult: result,
      canvasDimensions: canvasDims,
      canvasTransform: transform,
      positionedPath,
      showGuides: this.state.showGuides,
      showCenterPivot: this.state.showCenterPivot,
      theme: this.state.theme,
      renderMode: this.state.renderMode
    });

    // 6. If in split view, also render the inverted 180° preview
    if (this.state.viewMode === 'split' && this.invertedRenderer) {
      this.invertedRenderer.renderPreview({
        ambigramResult: result,
        canvasDimensions: canvasDims,
        canvasTransform: transform,
        positionedPath,
        showGuides: this.state.showGuides,
        showCenterPivot: this.state.showCenterPivot,
        theme: this.state.theme,
        renderMode: this.state.renderMode
      });
      this.invertedRenderer.setRotation(180);
    }

    // 7. Update character pairs analysis drawer
    this.renderPairsStrip(result.pairs);

    // 8. Update URL hash
    this.updateUrlHash();
  }

  renderPairsStrip(pairs) {
    if (!this.elPairsStrip) return;
    this.elPairsStrip.innerHTML = '';
    pairs.forEach(p => {
      const item = document.createElement('div');
      item.className = 'pair-pill' + (p.isCenter ? ' pair-center' : '');
      item.innerHTML = `
        <span class="pair-char top-char">${p.c1}</span>
        <span class="pair-arrow">⇅</span>
        <span class="pair-char bot-char">${p.c2}</span>
        ${p.isCenter ? '<span class="pair-tag">Center</span>' : ''}
      `;
      this.elPairsStrip.appendChild(item);
    });
  }

  handleExportSvg() {
    if (!this.currentPositionedPath || !this.currentCanvasDims) return;

    const filename = `ambigram-${this.state.text.toLowerCase()}-${this.state.style}.svg`;
    const svgString = SvgExporter.exportToSvg({
      pathData: this.currentPositionedPath,
      canvasWidth: this.currentCanvasDims.width,
      canvasHeight: this.currentCanvasDims.height,
      unit: this.currentCanvasDims.unit,
      exportMode: this.state.renderMode,
      includeBorder: this.state.includeBorder,
      includeCenterMark: this.state.includePivotMark,
      metadata: {
        title: `Ambigram - ${this.state.text}`,
        text1: this.state.text,
        text2: this.state.secondaryText,
        style: this.state.style
      }
    });

    SvgExporter.triggerDownload(svgString, filename, 'image/svg+xml');
    this.showToast(`SVG downloaded successfully (${filename})`);
  }

  handleExportDxf() {
    if (!this.currentPositionedPath || !this.currentCanvasDims) return;

    const filename = `ambigram-${this.state.text.toLowerCase()}-${this.state.style}.dxf`;
    const dxfString = DxfExporter.exportToDxf({
      paths: [this.currentPositionedPath],
      canvasWidth: this.currentCanvasDims.width,
      canvasHeight: this.currentCanvasDims.height,
      unit: this.currentCanvasDims.unit,
      layerName: 'AMBIGRAM_CUT'
    });

    SvgExporter.triggerDownload(dxfString, filename, 'application/dxf');
    this.showToast(`DXF downloaded successfully (${filename})`);
  }

  async handleExportPng() {
    if (!this.currentPositionedPath || !this.currentCanvasDims) return;

    try {
      this.showToast('Generating 300 DPI high-resolution PNG...');
      const svgString = SvgExporter.exportToSvg({
        pathData: this.currentPositionedPath,
        canvasWidth: this.currentCanvasDims.width,
        canvasHeight: this.currentCanvasDims.height,
        unit: this.currentCanvasDims.unit,
        exportMode: this.state.renderMode,
        includeBorder: false,
        includeCenterMark: false,
        metadata: { text1: this.state.text, style: this.state.style }
      });

      const filename = `ambigram-${this.state.text.toLowerCase()}-300dpi.png`;
      await PngExporter.downloadPng({
        svgString,
        widthMm: this.currentCanvasDims.width,
        heightMm: this.currentCanvasDims.height,
        dpi: 300,
        backgroundColor: (this.state.theme === 'dark') ? '#0f172a' : '#ffffff'
      }, filename);

      this.showToast(`PNG proof downloaded (${filename})`);
    } catch (err) {
      console.error('PNG export failed:', err);
      this.showToast('Failed to generate PNG proof');
    }
  }

  async handleCopySvg() {
    if (!this.currentPositionedPath || !this.currentCanvasDims) return;

    const svgString = SvgExporter.exportToSvg({
      pathData: this.currentPositionedPath,
      canvasWidth: this.currentCanvasDims.width,
      canvasHeight: this.currentCanvasDims.height,
      unit: this.currentCanvasDims.unit,
      exportMode: this.state.renderMode,
      includeBorder: false,
      includeCenterMark: false,
      metadata: { text1: this.state.text, style: this.state.style }
    });

    try {
      await navigator.clipboard.writeText(svgString);
      this.showToast('SVG vector code copied to clipboard!');
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = svgString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('SVG vector code copied to clipboard!');
    }
  }

  showToast(message) {
    if (!this.elToast) return;
    this.elToast.textContent = message;
    this.elToast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.elToast.classList.remove('visible');
    }, 3200);
  }
}

// Bootstrap application on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.ambigramApp = new AmbigramApp();
});
