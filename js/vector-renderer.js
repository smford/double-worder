/**
 * Vector Renderer
 * Coordinates the placement, scaling, visual guidelines, and interactive preview
 * of the ambigram on the physical canvas.
 */

import { AmbigramEngine } from './ambigram-engine.js';

export class VectorRenderer {
  constructor(containerElement) {
    this.container = containerElement;
    this.rotationDeg = 0;
    this.isSpinning = false;
    this.spinInterval = null;
  }

  /**
   * Fit and center the ambigram within the target physical canvas dimensions
   * @param {Object} params
   * @param {Object} params.ambigramResult - Result from AmbigramEngine.generate()
   * @param {number} params.canvasWidth - Canvas width in mm
   * @param {number} params.canvasHeight - Canvas height in mm
   * @param {number} [params.marginMm=20] - Safe printable margin in mm
   * @param {number} [params.scaleFactor=1.0] - User zoom/scale multiplier
   * @param {boolean} [params.opticalCenter=true] - Slight upward offset for typographic balance
   */
  computeCanvasTransform({
    ambigramResult,
    canvasWidth,
    canvasHeight,
    marginMm = 20,
    scaleFactor = 1.0,
    opticalCenter = true
  }) {
    const rawBounds = ambigramResult.bounds;
    const availWidth = Math.max(10, canvasWidth - 2 * marginMm);
    const availHeight = Math.max(10, canvasHeight - 2 * marginMm);

    // Compute uniform fit scale
    const fitScaleX = availWidth / (rawBounds.width || 100);
    const fitScaleY = availHeight / (rawBounds.height || 100);
    const baseFitScale = Math.min(fitScaleX, fitScaleY) * 0.85;
    const finalScale = baseFitScale * scaleFactor;

    const scaledW = rawBounds.width * finalScale;
    const scaledH = rawBounds.height * finalScale;

    // Center coordinates
    const targetCenterX = canvasWidth / 2;
    // Optical center raises by ~3% of canvas height
    const opticalOffset = opticalCenter ? canvasHeight * -0.025 : 0;
    const targetCenterY = (canvasHeight / 2) + opticalOffset;

    const targetOriginX = targetCenterX - scaledW / 2;
    const targetOriginY = targetCenterY - scaledH / 2;

    return {
      scale: finalScale,
      originX: targetOriginX,
      originY: targetOriginY,
      centerX: targetCenterX,
      centerY: targetCenterY,
      scaledWidth: scaledW,
      scaledHeight: scaledH
    };
  }

  /**
   * Scale and position path data into physical canvas coordinates
   */
  transformPathToCanvas(rawPathData, transform) {
    if (!rawPathData) return '';
    const { scale, originX, originY } = transform;

    return rawPathData.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
      const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const isRel = cmd === cmd.toLowerCase();
      const uCmd = cmd.toUpperCase();

      if (uCmd === 'Z' || isRel) return fullMatch;

      if (uCmd === 'H') {
        return 'H ' + numbers.map(x => (x * scale + originX).toFixed(2)).join(' ');
      }
      if (uCmd === 'V') {
        return 'V ' + numbers.map(y => (y * scale + originY).toFixed(2)).join(' ');
      }

      const transformed = [];
      for (let i = 0; i < numbers.length; i += 2) {
        const x = numbers[i];
        const y = numbers[i + 1];
        if (x !== undefined && y !== undefined) {
          transformed.push((x * scale + originX).toFixed(2), (y * scale + originY).toFixed(2));
        }
      }
      return uCmd + ' ' + transformed.join(' ');
    });
  }

  /**
   * Render the interactive preview SVG into the DOM
   */
  renderPreview({
    ambigramResult,
    canvasDimensions,
    canvasTransform,
    positionedPath,
    showGuides = true,
    showCenterPivot = true,
    theme = 'dark',
    renderMode = 'filled' // 'filled', 'outline', 'both'
  }) {
    const { width, height, unit } = canvasDimensions;
    const { centerX, centerY } = canvasTransform;

    const themeStyles = {
      dark: {
        canvasBg: '#0f172a',
        canvasBorder: '#334155',
        marginGuide: '#1e293b',
        textColor: '#f8fafc',
        cutStroke: '#f43f5e',
        guideColor: '#38bdf8'
      },
      paper: {
        canvasBg: '#ffffff',
        canvasBorder: '#cbd5e1',
        marginGuide: '#f1f5f9',
        textColor: '#0f172a',
        cutStroke: '#e11d48',
        guideColor: '#6366f1'
      },
      blueprint: {
        canvasBg: '#0b192c',
        canvasBorder: '#1e3e62',
        marginGuide: '#142942',
        textColor: '#00ffff',
        cutStroke: '#ff204e',
        guideColor: '#00d2df'
      },
      parchment: {
        canvasBg: '#fef3c7',
        canvasBorder: '#d97706',
        marginGuide: '#fde68a',
        textColor: '#451a03',
        cutStroke: '#b91c1c',
        guideColor: '#b45309'
      }
    };

    const currentTheme = themeStyles[theme] || themeStyles.dark;

    let pathStyleAttr = '';
    if (renderMode === 'outline') {
      pathStyleAttr = `fill="none" stroke="${currentTheme.cutStroke}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"`;
    } else if (renderMode === 'both') {
      pathStyleAttr = `fill="${currentTheme.textColor}" stroke="${currentTheme.cutStroke}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"`;
    } else {
      // filled default
      pathStyleAttr = `fill="${currentTheme.textColor}" stroke="none"`;
    }

    // Guidelines
    let guidesMarkup = '';
    if (showGuides) {
      guidesMarkup = `
        <!-- Printable Margin Guide -->
        <rect x="20" y="20" width="${Math.max(1, width - 40)}" height="${Math.max(1, height - 40)}"
              fill="none" stroke="${currentTheme.guideColor}" stroke-width="0.3" stroke-dasharray="3,3" opacity="0.35" />
      `;
    }

    let pivotMarkup = '';
    if (showCenterPivot) {
      pivotMarkup = `
        <!-- Rotational 180° Center Pivot -->
        <g id="preview-pivot" opacity="0.65">
          <circle cx="${centerX}" cy="${centerY}" r="4" fill="none" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <line x1="${centerX - 7}" y1="${centerY}" x2="${centerX + 7}" y2="${centerY}" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <line x1="${centerX}" y1="${centerY - 7}" x2="${centerX}" y2="${centerY + 7}" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <text x="${centerX + 6}" y="${centerY - 6}" fill="${currentTheme.guideColor}" font-size="3" font-family="monospace">180° PIVOT</text>
        </g>
      `;
    }

    const svgHtml = `
      <svg
        id="ambigram-canvas-svg"
        viewBox="0 0 ${width} ${height}"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style="background: ${currentTheme.canvasBg}; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform: rotate(${this.rotationDeg}deg);"
      >
        <!-- Canvas Background Rect -->
        <rect width="${width}" height="${height}" fill="${currentTheme.canvasBg}" />
        <rect width="${width}" height="${height}" fill="none" stroke="${currentTheme.canvasBorder}" stroke-width="0.5" />

        ${guidesMarkup}
        ${pivotMarkup}

        <!-- Ambigram Letterforms -->
        <g id="preview-ambigram-paths">
          <path d="${positionedPath}" ${pathStyleAttr} />
        </g>
      </svg>
    `;

    this.container.innerHTML = svgHtml;
  }

  /**
   * Flip canvas 180 degrees
   */
  toggleFlip() {
    this.rotationDeg = (this.rotationDeg === 0) ? 180 : 0;
    const svg = this.container.querySelector('#ambigram-canvas-svg');
    if (svg) {
      svg.style.transform = `rotate(${this.rotationDeg}deg)`;
    }
    return this.rotationDeg;
  }

  /**
   * Set specific rotation angle
   */
  setRotation(deg) {
    this.rotationDeg = deg;
    const svg = this.container.querySelector('#ambigram-canvas-svg');
    if (svg) {
      svg.style.transform = `rotate(${this.rotationDeg}deg)`;
    }
  }

  /**
   * Toggle continuous spin inspection
   */
  toggleContinuousSpin() {
    if (this.isSpinning) {
      this.stopContinuousSpin();
      return false;
    } else {
      this.isSpinning = true;
      let currentAngle = this.rotationDeg;
      this.spinInterval = setInterval(() => {
        currentAngle = (currentAngle + 1) % 360;
        this.setRotation(currentAngle);
      }, 20);
      return true;
    }
  }

  stopContinuousSpin() {
    if (this.spinInterval) {
      clearInterval(this.spinInterval);
      this.spinInterval = null;
    }
    this.isSpinning = false;
    // Snap back to 0 or 180
    const snap = this.rotationDeg > 90 && this.rotationDeg < 270 ? 180 : 0;
    this.setRotation(snap);
  }
}
