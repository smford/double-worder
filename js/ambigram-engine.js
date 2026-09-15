/**
 * Double-Worder Ambigram Engine
 * Engineered with principles of typography, vector geometry, and 180° rotational symmetry.
 * 
 * Supports:
 * - Single-word rotational ambigrams (reads the same 180° upside-down)
 * - Dual-word ambigrams (Word 1 upright, Word 2 upside-down)
 * - Four distinct typographic styles: Gothic Textura, Modern Geometric, Classical Roman, Laser Stencil
 * - Parametric letterform synthesis for all 26x26 character pairs
 * - Bespoke handcrafted curve definitions for classic ambigram letter pairs
 * - Symmetrical calligraphic swashes and decorative flourishes
 */

export class AmbigramEngine {
  constructor() {
    this.nominalHeight = 200;
    this.baseline = 25;
    this.capHeight = 175;
    this.xHeight = 135;
    this.centerPivotY = 100;
  }

  /**
   * Rotate an SVG path string 180 degrees around (cx, cy)
   */
  static rotatePath180(d, cx, cy) {
    if (!d) return '';
    // Tokenize command letters and numbers
    return d.replace(/([A-DF-Za-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g, (match, cmd, num) => {
      if (cmd) return cmd;
      return num; // we will process commands specifically
    }).replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
      const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const isRel = cmd === cmd.toLowerCase();
      const uCmd = cmd.toUpperCase();

      if (uCmd === 'Z') return 'Z';

      if (uCmd === 'H') {
        // Horizontal line
        const res = numbers.map(x => isRel ? -x : (2 * cx - x));
        return (isRel ? 'h ' : 'H ') + res.join(' ');
      }
      if (uCmd === 'V') {
        // Vertical line
        const res = numbers.map(y => isRel ? -y : (2 * cy - y));
        return (isRel ? 'v ' : 'V ') + res.join(' ');
      }

      const transformed = [];
      for (let i = 0; i < numbers.length; i += 2) {
        const x = numbers[i];
        const y = numbers[i + 1];
        if (x !== undefined && y !== undefined) {
          if (isRel) {
            transformed.push((-x).toFixed(2), (-y).toFixed(2));
          } else {
            transformed.push((2 * cx - x).toFixed(2), (2 * cy - y).toFixed(2));
          }
        }
      }

      return (isRel ? cmd : uCmd) + ' ' + transformed.join(' ');
    });
  }

  /**
   * Translate an SVG path string by (dx, dy)
   */
  static translatePath(d, dx, dy) {
    if (!d) return '';
    return d.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
      const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const isRel = cmd === cmd.toLowerCase();
      const uCmd = cmd.toUpperCase();

      if (uCmd === 'Z' || isRel) return fullMatch; // Relative commands don't shift with translation

      if (uCmd === 'H') {
        return 'H ' + numbers.map(x => (x + dx).toFixed(2)).join(' ');
      }
      if (uCmd === 'V') {
        return 'V ' + numbers.map(y => (y + dy).toFixed(2)).join(' ');
      }

      const transformed = [];
      for (let i = 0; i < numbers.length; i += 2) {
        const x = numbers[i];
        const y = numbers[i + 1];
        if (x !== undefined && y !== undefined) {
          transformed.push((x + dx).toFixed(2), (y + dy).toFixed(2));
        }
      }
      return uCmd + ' ' + transformed.join(' ');
    });
  }

  /**
   * Helper to format an SVG polygon loop into an SVG path string
   */
  static polygonToPath(points, closed = true) {
    if (!points || points.length === 0) return '';
    let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
    }
    if (closed) d += ' Z';
    return d;
  }

  /**
   * Primary generator for an ambigram
   * @param {Object} params
   * @param {string} params.text - Primary text (or Word 1)
   * @param {string} [params.secondaryText=''] - Secondary text for dual-word ambigram (optional)
   * @param {string} [params.style='gothic'] - 'gothic', 'geometric', 'roman', 'stencil'
   * @param {number} [params.strokeWidth=18] - Base stroke width in glyph units (8 - 32)
   * @param {number} [params.contrast=1.8] - Ratio between vertical and horizontal strokes (1.0 - 2.8)
   * @param {number} [params.letterSpacing=12] - Tracking between letters (-10 to 40)
   * @param {number} [params.slant=0] - Italic slant in degrees (-15 to 15)
   * @param {string} [params.flourishes='none'] - 'none', 'swashes', 'filigree', 'frame'
   */
  generate({
    text = 'AMBIGRAM',
    secondaryText = '',
    style = 'gothic',
    strokeWidth = 18,
    contrast = 1.8,
    letterSpacing = 12,
    slant = 0,
    flourishes = 'none'
  }) {
    const clean1 = (text || '').trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, '') || 'AMBIGRAM';
    const isDualWord = Boolean(secondaryText && secondaryText.trim().length > 0);
    const clean2 = isDualWord
      ? secondaryText.trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, '')
      : clean1;

    // Build letter pairings
    const pairs = this.buildLetterPairs(clean1, clean2, isDualWord);

    // Compute glyph vector paths for each pair
    const glyphs = [];
    let currentX = 0;

    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const glyph = this.createHybridGlyph(pair.c1, pair.c2, {
        style,
        strokeWidth,
        contrast,
        slant,
        isCenter: pair.isCenter,
        pairIndex: i,
        totalPairs: pairs.length
      });

      // Offset glyph to its position along the word baseline
      const translatedPath = AmbigramEngine.translatePath(glyph.path, currentX, 0);

      glyphs.push({
        pair,
        index: i,
        width: glyph.width,
        x: currentX,
        path: translatedPath
      });

      currentX += glyph.width + letterSpacing;
    }

    const totalWordWidth = currentX > 0 ? currentX - letterSpacing : 0;
    const totalWordHeight = this.nominalHeight;

    // Apply decorative flourishes or framing
    let flourishPath = '';
    if (flourishes !== 'none') {
      flourishPath = this.generateFlourishes({
        style,
        flourishType: flourishes,
        totalWidth: totalWordWidth,
        totalHeight: totalWordHeight,
        strokeWidth
      });
    }

    // Combine all paths into a master path string
    const combinedPaths = glyphs.map(g => g.path).filter(Boolean);
    if (flourishPath) {
      combinedPaths.push(flourishPath);
    }

    const masterPathData = combinedPaths.join(' ');

    return {
      success: true,
      text1: clean1,
      text2: clean2,
      isDualWord,
      style,
      pairs,
      glyphs,
      masterPathData,
      flourishPath,
      bounds: {
        width: totalWordWidth,
        height: totalWordHeight,
        centerX: totalWordWidth / 2,
        centerY: totalWordHeight / 2
      }
    };
  }

  /**
   * Build character pairs for rotational symmetry
   */
  buildLetterPairs(word1, word2, isDualWord) {
    const pairs = [];
    if (!isDualWord) {
      // Single word rotational symmetry:
      // Pair word[i] with word[len - 1 - i]
      const len = word1.length;
      for (let i = 0; i < len; i++) {
        const c1 = word1[i];
        const c2 = word1[len - 1 - i];
        const isCenter = (len % 2 === 1 && i === Math.floor(len / 2));
        pairs.push({ c1, c2, index: i, isCenter });
      }
    } else {
      // Dual word ambigram:
      // Word 1 reads upright; Word 2 reads inverted.
      // Word 2 is reversed so that Word 1[i] pairs with Word 2[len2 - 1 - i].
      const maxLen = Math.max(word1.length, word2.length);
      const padded1 = word1.padEnd(maxLen, ' ');
      const padded2 = word2.padEnd(maxLen, ' ');

      for (let i = 0; i < maxLen; i++) {
        const c1 = padded1[i];
        const c2 = padded2[maxLen - 1 - i];
        pairs.push({ c1, c2, index: i, isCenter: false });
      }
    }
    return pairs;
  }

  /**
   * Generate hybrid vector glyph for character pair (c1, c2)
   */
  createHybridGlyph(c1, c2, options) {
    const {
      style = 'gothic',
      strokeWidth = 18,
      contrast = 1.8,
      slant = 0,
      isCenter = false
    } = options;

    // Handle space character
    if (c1 === ' ' && c2 === ' ') {
      return { width: 50, path: '' };
    }

    // Determine glyph width based on letter character attributes
    const width = this.getGlyphWidth(c1, c2);
    const height = this.nominalHeight;
    const cx = width / 2;
    const cy = height / 2;

    // 1. Check if a curated bespoke glyph pair definition exists
    const bespokeKey = `${c1}_${c2}`;
    const invertedKey = `${c2}_${c1}`;

    let path = '';

    if (this.bespokeGlyphs[bespokeKey]) {
      path = this.bespokeGlyphs[bespokeKey](width, height, strokeWidth, contrast, style);
    } else if (this.bespokeGlyphs[invertedKey]) {
      // Invert 180° the opposite pair
      const rawPath = this.bespokeGlyphs[invertedKey](width, height, strokeWidth, contrast, style);
      path = AmbigramEngine.rotatePath180(rawPath, cx, cy);
    } else if (c1 === c2 && isCenter && this.selfSymmetricGlyphs[c1]) {
      // Specialized 180° self-symmetric central letter
      path = this.selfSymmetricGlyphs[c1](width, height, strokeWidth, contrast, style);
    } else {
      // 2. Synthesize using Parametric Morphology Synthesizer
      path = this.synthesizeHybridGlyph(c1, c2, width, height, strokeWidth, contrast, style);
    }

    // Apply slant (italic angle) if requested
    if (slant !== 0) {
      path = this.applySlant(path, slant, cy);
    }

    return { width, height, path };
  }

  /**
   * Approximate natural typographical width for a pair of letters
   */
  getGlyphWidth(c1, c2) {
    const narrowChars = new Set(['I', 'J', 'L', '1']);
    const wideChars = new Set(['M', 'W']);
    const veryWideChars = new Set(['M', 'W']);

    const isNarrow1 = narrowChars.has(c1);
    const isNarrow2 = narrowChars.has(c2);
    const isWide1 = wideChars.has(c1);
    const isWide2 = wideChars.has(c2);

    if (isNarrow1 && isNarrow2) return 70;
    if (isWide1 || isWide2) return 150;
    if (isNarrow1 || isNarrow2) return 95;
    return 115; // standard width
  }

  /**
   * Apply slant transformation (skewX) around vertical center
   */
  applySlant(pathData, slantDeg, centerY) {
    if (!pathData || slantDeg === 0) return pathData;
    const rad = (slantDeg * Math.PI) / 180;
    const tan = Math.tan(rad);

    return pathData.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
      const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const isRel = cmd === cmd.toLowerCase();
      const uCmd = cmd.toUpperCase();

      if (uCmd === 'Z' || isRel) return fullMatch;

      const transformed = [];
      for (let i = 0; i < numbers.length; i += 2) {
        const x = numbers[i];
        const y = numbers[i + 1];
        if (x !== undefined && y !== undefined) {
          const slantedX = x + (centerY - y) * tan;
          transformed.push(slantedX.toFixed(2), y.toFixed(2));
        }
      }
      return uCmd + ' ' + transformed.join(' ');
    });
  }

  /**
   * Synthesizes a hybrid glyph for any character pair (c1, c2)
   * using rotational morphology:
   * Upper half renders c1's distinctive structural cues.
   * Lower half renders c2's distinctive cues (inverted 180°).
   */
  synthesizeHybridGlyph(c1, c2, width, height, sw, contrast, style) {
    const cx = width / 2;
    const cy = height / 2;
    const hsw = sw / contrast; // horizontal stroke width (thinner)
    const paths = [];

    // Extract structural profiles
    const prof1 = this.getCharProfile(c1);
    const prof2 = this.getCharProfile(c2);

    // Number of vertical minims / stems to balance
    const stemCount = Math.max(prof1.stems, prof2.stems);

    // Compute stem X positions
    const stemXs = [];
    const margin = sw * 0.8;
    const usableW = width - 2 * margin - sw;

    if (stemCount === 1) {
      stemXs.push(cx - sw / 2);
    } else if (stemCount === 2) {
      stemXs.push(margin);
      stemXs.push(width - margin - sw);
    } else {
      // 3 stems (like M or W)
      stemXs.push(margin);
      stemXs.push(cx - sw / 2);
      stemXs.push(width - margin - sw);
    }

    const yTop = 20;
    const yBot = height - 20;

    // Draw vertical stems (minims)
    for (const sx of stemXs) {
      if (style === 'gothic') {
        paths.push(this.createGothicMinim(sx, yTop, yBot, sw));
      } else if (style === 'stencil') {
        paths.push(this.createStencilStem(sx, yTop, yBot, sw));
      } else if (style === 'roman') {
        paths.push(this.createRomanStem(sx, yTop, yBot, sw, hsw));
      } else {
        // geometric
        paths.push(this.createGeometricStem(sx, yTop, yBot, sw));
      }
    }

    // Upper structural features (from c1)
    const upperPaths = this.createUpperFeatures(c1, prof1, stemXs, yTop, cy, sw, hsw, style, width);
    if (upperPaths) paths.push(upperPaths);

    // Lower structural features:
    // We create the upper features of c2, and rotate them 180° to become c1's lower features!
    const c2Upper = this.createUpperFeatures(c2, prof2, stemXs, yTop, cy, sw, hsw, style, width);
    if (c2Upper) {
      const rotatedC2 = AmbigramEngine.rotatePath180(c2Upper, cx, cy);
      paths.push(rotatedC2);
    }

    // Waist crossbar if either letter requires a middle connection
    if (prof1.hasCrossbar || prof2.hasCrossbar) {
      const barY = cy - hsw / 2;
      const xLeft = stemXs[0];
      const xRight = stemXs[stemXs.length - 1] + sw;
      paths.push(`M ${xLeft} ${barY} L ${xRight} ${barY} L ${xRight} ${barY + hsw} L ${xLeft} ${barY + hsw} Z`);
    }

    return paths.join(' ');
  }

  /**
   * Character morphological profiles
   */
  getCharProfile(ch) {
    const p = {
      stems: 2,
      hasTopBar: false,
      hasApex: false,
      hasTopArch: false,
      hasCrossbar: false,
      hasRoundBowl: false,
      isOpenTop: false
    };

    switch (ch) {
      case 'I':
      case '1':
        p.stems = 1;
        p.hasTopBar = true;
        p.hasCrossbar = false;
        break;
      case 'T':
        p.stems = 1;
        p.hasTopBar = true;
        break;
      case 'L':
      case 'J':
        p.stems = 1;
        break;
      case 'A':
        p.stems = 2;
        p.hasApex = true;
        p.hasCrossbar = true;
        break;
      case 'B':
      case 'P':
      case 'R':
        p.stems = 2;
        p.hasRoundBowl = true;
        p.hasCrossbar = true;
        break;
      case 'C':
      case 'G':
        p.stems = 1;
        p.hasTopArch = true;
        break;
      case 'D':
      case 'O':
      case 'Q':
        p.stems = 2;
        p.hasTopArch = true;
        p.hasRoundBowl = true;
        break;
      case 'E':
      case 'F':
        p.stems = 1;
        p.hasTopBar = true;
        p.hasCrossbar = true;
        break;
      case 'H':
        p.stems = 2;
        p.hasCrossbar = true;
        break;
      case 'M':
        p.stems = 3;
        p.hasTopArch = true;
        break;
      case 'N':
        p.stems = 2;
        p.hasTopArch = true;
        break;
      case 'S':
        p.stems = 1;
        p.hasTopArch = true;
        break;
      case 'U':
      case 'V':
      case 'Y':
        p.stems = 2;
        p.isOpenTop = true;
        break;
      case 'W':
        p.stems = 3;
        p.isOpenTop = true;
        break;
      case 'X':
      case 'Z':
        p.stems = 2;
        p.hasTopBar = true;
        break;
      default:
        p.stems = 2;
        break;
    }
    return p;
  }

  /**
   * Upper structural features for character silhouette
   */
  createUpperFeatures(ch, prof, stemXs, yTop, cy, sw, hsw, style, width) {
    const paths = [];
    const leftX = stemXs[0];
    const rightX = stemXs[stemXs.length - 1] + sw;

    if (prof.hasTopBar) {
      // Horizontal bar across the top
      paths.push(`M ${leftX - sw * 0.5} ${yTop} L ${rightX + sw * 0.5} ${yTop} L ${rightX + sw * 0.5} ${yTop + hsw} L ${leftX - sw * 0.5} ${yTop + hsw} Z`);
    } else if (prof.hasTopArch || prof.hasRoundBowl) {
      // Arch connecting stems at the top
      const midX = width / 2;
      const archH = 25;
      paths.push(`M ${leftX} ${yTop + archH} C ${leftX} ${yTop}, ${rightX} ${yTop}, ${rightX} ${yTop + archH} L ${rightX - sw} ${yTop + archH} C ${rightX - sw} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + archH} Z`);
    } else if (prof.hasApex) {
      // Pointed apex meeting at top center (like A)
      const midX = width / 2;
      paths.push(`M ${midX - sw} ${yTop + 25} L ${midX} ${yTop} L ${midX + sw} ${yTop + 25} L ${midX} ${yTop + 10} Z`);
    }

    return paths.join(' ');
  }

  /**
   * Classic Gothic Textura Minim with 45° diamond caps
   */
  createGothicMinim(x, y1, y2, sw) {
    const d = sw * 0.8; // diamond height
    const pts = [
      [x, y1 + d],
      [x + sw / 2, y1],
      [x + sw, y1 + d],
      [x + sw, y2 - d],
      [x + sw / 2, y2],
      [x, y2 - d]
    ];
    return AmbigramEngine.polygonToPath(pts);
  }

  /**
   * Geometric monoline stem with subtle chamfer
   */
  createGeometricStem(x, y1, y2, sw) {
    const pts = [
      [x, y1],
      [x + sw, y1],
      [x + sw, y2],
      [x, y2]
    ];
    return AmbigramEngine.polygonToPath(pts);
  }

  /**
   * Classical Roman Stem with bracketed serifs
   */
  createRomanStem(x, y1, y2, sw, hsw) {
    const serifExt = sw * 0.6;
    const serifH = hsw * 0.8;
    const pts = [
      [x - serifExt, y1],
      [x + sw + serifExt, y1],
      [x + sw + serifExt, y1 + serifH],
      [x + sw, y1 + serifH + 6],
      [x + sw, y2 - serifH - 6],
      [x + sw + serifExt, y2 - serifH],
      [x + sw + serifExt, y2],
      [x - serifExt, y2],
      [x - serifExt, y2 - serifH],
      [x, y2 - serifH - 6],
      [x, y1 + serifH + 6],
      [x - serifExt, y1 + serifH]
    ];
    return AmbigramEngine.polygonToPath(pts);
  }

  /**
   * Stencil / Laser-cut stem with bridge gaps
   */
  createStencilStem(x, y1, y2, sw) {
    const cy = (y1 + y2) / 2;
    const bridge = 8; // Bridge gap for CNC/laser
    // Two segments to avoid solid counters
    const topPts = [
      [x, y1],
      [x + sw, y1],
      [x + sw, cy - bridge],
      [x, cy - bridge]
    ];
    const botPts = [
      [x, cy + bridge],
      [x + sw, cy + bridge],
      [x + sw, y2],
      [x, y2]
    ];
    return AmbigramEngine.polygonToPath(topPts) + ' ' + AmbigramEngine.polygonToPath(botPts);
  }

  /**
   * Decorative Symmetrical Flourishes & Framing
   */
  generateFlourishes({ style, flourishType, totalWidth, totalHeight, strokeWidth }) {
    if (flourishType === 'none') return '';

    const paths = [];
    const sw = strokeWidth * 0.6;
    const margin = 25;
    const left = -margin;
    const right = totalWidth + margin;
    const topY = -15;
    const botY = totalHeight + 15;
    const cx = totalWidth / 2;
    const cy = totalHeight / 2;

    if (flourishType === 'swashes') {
      // Symmetrical calligraphic swash on top and bottom
      const topSwash = `M ${left} ${topY + 20} C ${left + 40} ${topY - 10}, ${cx - 50} ${topY - 15}, ${cx} ${topY - 15} C ${cx + 50} ${topY - 15}, ${right - 40} ${topY - 10}, ${right} ${topY + 20} L ${right} ${topY + 20 + sw} C ${right - 40} ${topY - 10 + sw}, ${cx + 50} ${topY - 15 + sw}, ${cx} ${topY - 15 + sw} C ${cx - 50} ${topY - 15 + sw}, ${left + 40} ${topY - 10 + sw}, ${left} ${topY + 20 + sw} Z`;
      const botSwash = AmbigramEngine.rotatePath180(topSwash, cx, cy);
      paths.push(topSwash, botSwash);
    } else if (flourishType === 'frame') {
      // Architectural geometric framing brackets
      const bracketW = 40;
      const bracketH = 30;
      // Top-left
      const tl = `M ${left} ${topY + bracketH} L ${left} ${topY} L ${left + bracketW} ${topY} L ${left + bracketW} ${topY + sw} L ${left + sw} ${topY + sw} L ${left + sw} ${topY + bracketH} Z`;
      // Top-right
      const tr = `M ${right - bracketW} ${topY} L ${right} ${topY} L ${right} ${topY + bracketH} L ${right - sw} ${topY + bracketH} L ${right - sw} ${topY + sw} L ${right - bracketW} ${topY + sw} Z`;
      // Bottom counterparts rotated 180°
      const bl = AmbigramEngine.rotatePath180(tr, cx, cy);
      const br = AmbigramEngine.rotatePath180(tl, cx, cy);
      paths.push(tl, tr, bl, br);
    } else if (flourishType === 'filigree') {
      // Gothic diamond end-caps and filigree lozenges
      const lozengeSize = strokeWidth * 1.4;
      const l1 = [
        [left - lozengeSize, cy],
        [left, cy - lozengeSize],
        [left + lozengeSize, cy],
        [left, cy + lozengeSize]
      ];
      const r1 = [
        [right - lozengeSize, cy],
        [right, cy - lozengeSize],
        [right + lozengeSize, cy],
        [right, cy + lozengeSize]
      ];
      paths.push(AmbigramEngine.polygonToPath(l1), AmbigramEngine.polygonToPath(r1));
    }

    return paths.join(' ');
  }

  // =========================================================================
  // BESPOKE HANDCRAFTED CURVE DEFINITIONS FOR FAMOUS AMBIGRAM PAIRS
  // =========================================================================

  bespokeGlyphs = {
    // M <-> W: The classic 3-minim rotational ambigram
    'M_W': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const x1 = sw * 0.5;
      const x2 = w / 2 - sw / 2;
      const x3 = w - sw * 1.5;
      const yTop = 20;
      const yBot = h - 20;

      // 3 minims joined by 2 top arches and 2 bottom vertices
      const pts1 = [
        [x1, yTop + sw], [x1 + sw / 2, yTop], [x1 + sw, yTop + sw],
        [x1 + sw, yBot - sw], [x1 + sw / 2, yBot], [x1, yBot - sw]
      ];
      const pts2 = [
        [x2, yTop + sw], [x2 + sw / 2, yTop], [x2 + sw, yTop + sw],
        [x2 + sw, yBot - sw], [x2 + sw / 2, yBot], [x2, yBot - sw]
      ];
      const pts3 = [
        [x3, yTop + sw], [x3 + sw / 2, yTop], [x3 + sw, yTop + sw],
        [x3 + sw, yBot - sw], [x3 + sw / 2, yBot], [x3, yBot - sw]
      ];

      // Top connecting arches for M
      const arch1 = `M ${x1 + sw} ${yTop + sw} L ${x2} ${yTop + sw} L ${x2} ${yTop + sw + hsw} L ${x1 + sw} ${yTop + sw + hsw} Z`;
      const arch2 = `M ${x2 + sw} ${yTop + sw} L ${x3} ${yTop + sw} L ${x3} ${yTop + sw + hsw} L ${x2 + sw} ${yTop + sw + hsw} Z`;

      // Bottom connecting vertices for W (inverted 180° arches)
      const bot1 = `M ${x1 + sw} ${yBot - sw - hsw} L ${x2} ${yBot - sw - hsw} L ${x2} ${yBot - sw} L ${x1 + sw} ${yBot - sw} Z`;
      const bot2 = `M ${x2 + sw} ${yBot - sw - hsw} L ${x3} ${yBot - sw - hsw} L ${x3} ${yBot - sw} L ${x2 + sw} ${yBot - sw} Z`;

      return `${AmbigramEngine.polygonToPath(pts1)} ${AmbigramEngine.polygonToPath(pts2)} ${AmbigramEngine.polygonToPath(pts3)} ${arch1} ${arch2} ${bot1} ${bot2}`;
    },

    // N <-> U: 2 minims with top arch for N and bottom basin for U
    'N_U': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const x1 = sw * 0.8;
      const x2 = w - sw * 1.8;
      const yTop = 20;
      const yBot = h - 20;

      const stem1 = [
        [x1, yTop + sw], [x1 + sw / 2, yTop], [x1 + sw, yTop + sw],
        [x1 + sw, yBot - sw], [x1 + sw / 2, yBot], [x1, yBot - sw]
      ];
      const stem2 = [
        [x2, yTop + sw], [x2 + sw / 2, yTop], [x2 + sw, yTop + sw],
        [x2 + sw, yBot - sw], [x2 + sw / 2, yBot], [x2, yBot - sw]
      ];

      // Top arch for N
      const topArch = `M ${x1 + sw} ${yTop + sw} L ${x2} ${yTop + sw} L ${x2} ${yTop + sw + hsw} L ${x1 + sw} ${yTop + sw + hsw} Z`;
      // Bottom basin curve for U
      const botBasin = `M ${x1 + sw} ${yBot - sw - hsw} L ${x2} ${yBot - sw - hsw} L ${x2} ${yBot - sw} L ${x1 + sw} ${yBot - sw} Z`;

      return `${AmbigramEngine.polygonToPath(stem1)} ${AmbigramEngine.polygonToPath(stem2)} ${topArch} ${botBasin}`;
    },

    // V <-> A: Chevron / Apex pair
    'V_A': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const cx = w / 2;
      const yTop = 20;
      const yBot = h - 20;
      const cy = h / 2;

      // Left leg from top-left to bottom apex
      const leg1 = [
        [sw * 0.5, yTop],
        [sw * 1.5, yTop],
        [cx + sw * 0.5, yBot],
        [cx - sw * 0.5, yBot]
      ];
      // Right leg from bottom apex to top-right
      const leg2 = [
        [w - sw * 1.5, yTop],
        [w - sw * 0.5, yTop],
        [cx + sw * 0.5, yBot],
        [cx - sw * 0.5, yBot]
      ];

      // Horizontal crossbar at waist for A
      const bar = `M ${sw * 1.5} ${cy - hsw / 2} L ${w - sw * 1.5} ${cy - hsw / 2} L ${w - sw * 1.5} ${cy + hsw / 2} L ${sw * 1.5} ${cy + hsw / 2} Z`;

      return `${AmbigramEngine.polygonToPath(leg1)} ${AmbigramEngine.polygonToPath(leg2)} ${bar}`;
    },

    // B <-> Q / D <-> P: Round bowl and vertical minim
    'D_P': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const xStem = sw * 0.8;
      const yTop = 20;
      const yBot = h - 20;
      const cy = h / 2;

      // Left vertical stem (D upright) / Right descender (P inverted)
      const stem = [
        [xStem, yTop], [xStem + sw, yTop],
        [xStem + sw, yBot], [xStem, yBot]
      ];

      // Curved bowl on the right
      const bowl = `M ${xStem + sw} ${yTop + 10} C ${w + 5} ${yTop + 10}, ${w + 5} ${yBot - 10}, ${xStem + sw} ${yBot - 10} L ${xStem + sw} ${yBot - 10 - hsw} C ${w - sw} ${yBot - 10 - hsw}, ${w - sw} ${yTop + 10 + hsw}, ${xStem + sw} ${yTop + 10 + hsw} Z`;

      return `${AmbigramEngine.polygonToPath(stem)} ${bowl}`;
    },

    // C <-> R (from VICTORIA)
    'C_R': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const yTop = 20;
      const yBot = h - 20;
      const cy = h / 2;

      // Left spine for C and R stem
      const spine = [
        [sw * 0.8, yTop + 20], [sw * 1.8, yTop + 20],
        [sw * 1.8, yBot - 20], [sw * 0.8, yBot - 20]
      ];

      // Top curve for C (and upper loop for R)
      const topArm = `M ${sw * 0.8} ${yTop + 20} C ${sw * 0.8} ${yTop}, ${w - 10} ${yTop}, ${w - 10} ${yTop + 25} L ${w - 10 - sw} ${yTop + 25} C ${w - 10 - sw} ${yTop + hsw}, ${sw * 1.8} ${yTop + hsw}, ${sw * 1.8} ${yTop + 20} Z`;

      // Bottom arm for C (becomes diagonal leg for R when flipped)
      const botArm = `M ${sw * 0.8} ${yBot - 20} C ${sw * 0.8} ${yBot}, ${w - 10} ${yBot}, ${w - 10} ${yBot - 25} L ${w - 10 - sw} ${yBot - 25} C ${w - 10 - sw} ${yBot - hsw}, ${sw * 1.8} ${yBot - hsw}, ${sw * 1.8} ${yBot - 20} Z`;

      // Middle connection for R loop
      const midBar = `M ${sw * 1.8} ${cy - hsw / 2} L ${w - 20} ${cy - hsw / 2} L ${w - 20} ${cy + hsw / 2} L ${sw * 1.8} ${cy + hsw / 2} Z`;

      return `${AmbigramEngine.polygonToPath(spine)} ${topArm} ${botArm} ${midBar}`;
    },

    // T <-> O (from VICTORIA)
    'T_O': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const cx = w / 2;
      const yTop = 20;
      const yBot = h - 20;

      // Top crossbar for T (and top oval curve for O)
      const topBar = `M ${sw * 0.5} ${yTop} L ${w - sw * 0.5} ${yTop} L ${w - sw * 0.5} ${yTop + hsw} L ${sw * 0.5} ${yTop + hsw} Z`;

      // Central stem for T
      const centerStem = [
        [cx - sw / 2, yTop], [cx + sw / 2, yTop],
        [cx + sw / 2, yBot], [cx - sw / 2, yBot]
      ];

      // Side curved brackets that form the O outline
      const leftArc = `M ${sw * 0.8} ${yTop + 15} C ${sw * 0.8 - 10} ${h / 2}, ${sw * 0.8 - 10} ${h / 2}, ${sw * 0.8} ${yBot - 15} L ${sw * 0.8 + hsw} ${yBot - 15} C ${sw * 0.8} ${h / 2}, ${sw * 0.8} ${h / 2}, ${sw * 0.8 + hsw} ${yTop + 15} Z`;
      const rightArc = `M ${w - sw * 0.8} ${yTop + 15} C ${w - sw * 0.8 + 10} ${h / 2}, ${w - sw * 0.8 + 10} ${h / 2}, ${w - sw * 0.8} ${yBot - 15} L ${w - sw * 0.8 - hsw} ${yBot - 15} C ${w - sw * 0.8} ${h / 2}, ${w - sw * 0.8} ${h / 2}, ${w - sw * 0.8 - hsw} ${yTop + 15} Z`;

      // Bottom bar for O
      const botBar = `M ${sw * 0.5} ${yBot - hsw} L ${w - sw * 0.5} ${yBot - hsw} L ${w - sw * 0.5} ${yBot} L ${sw * 0.5} ${yBot} Z`;

      return `${topBar} ${AmbigramEngine.polygonToPath(centerStem)} ${leftArc} ${rightArc} ${botBar}`;
    }
  };

  // =========================================================================
  // SELF-SYMMETRIC GLYPH DEFINITIONS (Rotate 180° into themselves)
  // =========================================================================

  selfSymmetricGlyphs = {
    // S: Serpentine 180° point-symmetric spine
    'S': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const cx = w / 2;
      const cy = h / 2;
      const yTop = 20;
      const yBot = h - 20;

      // S spine passing through center pivot (cx, cy)
      const pts = [
        [w - sw * 1.2, yTop + 25],
        [w - sw * 1.2, yTop],
        [cx, yTop],
        [sw * 1.2, yTop + 30],
        [cx - sw * 0.5, cy - 10],
        [cx + sw * 0.5, cy + 10],
        [w - sw * 1.2, yBot - 30],
        [cx, yBot],
        [sw * 1.2, yBot],
        [sw * 1.2, yBot - 25]
      ];
      return AmbigramEngine.polygonToPath(pts, false) + ` M ${cx} ${cy} Z`;
    },

    // N: Two vertical minims with 180° diagonal connecting stroke
    'N': (w, h, sw, contrast, style) => {
      const x1 = sw * 0.8;
      const x2 = w - sw * 1.8;
      const yTop = 20;
      const yBot = h - 20;

      const stem1 = [
        [x1, yTop], [x1 + sw, yTop],
        [x1 + sw, yBot], [x1, yBot]
      ];
      const stem2 = [
        [x2, yTop], [x2 + sw, yTop],
        [x2 + sw, yBot], [x2, yBot]
      ];
      // Point-symmetric diagonal
      const diag = [
        [x1, yTop], [x1 + sw * 1.2, yTop],
        [x2 + sw, yBot], [x2 - sw * 0.2, yBot]
      ];

      return `${AmbigramEngine.polygonToPath(stem1)} ${AmbigramEngine.polygonToPath(stem2)} ${AmbigramEngine.polygonToPath(diag)}`;
    },

    // O: Rotational symmetric oval
    'O': (w, h, sw, contrast, style) => {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2 - sw * 0.8;
      const ry = (h - 40) / 2;
      const irx = rx - sw;
      const iry = ry - (sw / contrast);

      return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry} Z M ${cx} ${cy - iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy + iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy - iry} Z`;
    },

    // I: Classic minim with balanced top and bottom serifs
    'I': (w, h, sw, contrast, style) => {
      const cx = w / 2;
      const yTop = 20;
      const yBot = h - 20;
      const serifW = sw * 1.8;
      const hsw = sw / contrast;

      const stem = [
        [cx - sw / 2, yTop], [cx + sw / 2, yTop],
        [cx + sw / 2, yBot], [cx - sw / 2, yBot]
      ];
      const topSerif = `M ${cx - serifW} ${yTop} L ${cx + serifW} ${yTop} L ${cx + serifW} ${yTop + hsw} L ${cx - serifW} ${yTop + hsw} Z`;
      const botSerif = `M ${cx - serifW} ${yBot - hsw} L ${cx + serifW} ${yBot - hsw} L ${cx + serifW} ${yBot} L ${cx - serifW} ${yBot} Z`;

      return `${AmbigramEngine.polygonToPath(stem)} ${topSerif} ${botSerif}`;
    },

    // H: Two vertical stems with centered crossbar
    'H': (w, h, sw, contrast, style) => {
      const x1 = sw * 0.8;
      const x2 = w - sw * 1.8;
      const yTop = 20;
      const yBot = h - 20;
      const cy = h / 2;
      const hsw = sw / contrast;

      const stem1 = [
        [x1, yTop], [x1 + sw, yTop],
        [x1 + sw, yBot], [x1, yBot]
      ];
      const stem2 = [
        [x2, yTop], [x2 + sw, yTop],
        [x2 + sw, yBot], [x2, yBot]
      ];
      const bar = `M ${x1 + sw} ${cy - hsw / 2} L ${x2} ${cy - hsw / 2} L ${x2} ${cy + hsw / 2} L ${x1 + sw} ${cy + hsw / 2} Z`;

      return `${AmbigramEngine.polygonToPath(stem1)} ${AmbigramEngine.polygonToPath(stem2)} ${bar}`;
    },

    // X: Two diagonal crossing strokes
    'X': (w, h, sw, contrast, style) => {
      const x1 = sw * 0.8;
      const x2 = w - sw * 0.8;
      const yTop = 20;
      const yBot = h - 20;

      const diag1 = [
        [x1, yTop], [x1 + sw, yTop],
        [x2, yBot], [x2 - sw, yBot]
      ];
      const diag2 = [
        [x2 - sw, yTop], [x2, yTop],
        [x1 + sw, yBot], [x1, yBot]
      ];

      return `${AmbigramEngine.polygonToPath(diag1)} ${AmbigramEngine.polygonToPath(diag2)}`;
    },

    // Z: Rotational symmetric Z
    'Z': (w, h, sw, contrast, style) => {
      const hsw = sw / contrast;
      const yTop = 20;
      const yBot = h - 20;

      const topBar = `M ${sw * 0.8} ${yTop} L ${w - sw * 0.8} ${yTop} L ${w - sw * 0.8} ${yTop + hsw} L ${sw * 0.8} ${yTop + hsw} Z`;
      const botBar = `M ${sw * 0.8} ${yBot - hsw} L ${w - sw * 0.8} ${yBot - hsw} L ${w - sw * 0.8} ${yBot} L ${sw * 0.8} ${yBot} Z`;
      const diag = [
        [w - sw * 0.8 - sw, yTop + hsw],
        [w - sw * 0.8, yTop + hsw],
        [sw * 0.8 + sw, yBot - hsw],
        [sw * 0.8, yBot - hsw]
      ];

      return `${topBar} ${botBar} ${AmbigramEngine.polygonToPath(diag)}`;
    }
  };
}
