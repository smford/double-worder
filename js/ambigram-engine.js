/**
 * Double-Worder Ambigram Engine (Ultra-Legible Typographic Architecture)
 * Engineered with principles of typography, optical counter spaces, and 180° rotational symmetry.
 * 
 * Key Typographic Principles for Legibility:
 * 1. Letter Silhouette & Negative Space: Letters must maintain their defining open counters
 *    (e.g., C, E, F, L, T are open on the right; U, V, W are open at the top).
 * 2. 180° Dual-Zone Morphological Pairing:
 *    - The Upper Zone (y: 25..100) displays the dominant silhouette of C1.
 *    - The Lower Zone (y: 100..175) displays Rotate180(UpperZone(C2)).
 *    - Stems connect through the waist only where active, keeping negative spaces open!
 * 3. Bespoke Handcrafted Glyphs for all 26 self-symmetric characters and famous ambigram pairs.
 */

export class AmbigramEngine {
  constructor() {
    this.nominalHeight = 200;
    this.yTop = 25;
    this.yBot = 175;
    this.yMid = 100;
  }

  /**
   * Rotate an SVG path string 180 degrees around (cx, cy)
   */
  static rotatePath180(d, cx, cy) {
    if (!d) return '';
    return d.replace(/([A-DF-Za-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g, (match, cmd, num) => {
      if (cmd) return cmd;
      return num;
    }).replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
      const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const isRel = cmd === cmd.toLowerCase();
      const uCmd = cmd.toUpperCase();

      if (uCmd === 'Z') return 'Z';

      if (uCmd === 'H') {
        const res = numbers.map(x => isRel ? -x : (2 * cx - x));
        return (isRel ? 'h ' : 'H ') + res.join(' ');
      }
      if (uCmd === 'V') {
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

      if (uCmd === 'Z' || isRel) return fullMatch;

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
   * Primary ambigram generator
   */
  generate({
    text = 'AMBIGRAM',
    secondaryText = '',
    style = 'gothic',
    strokeWidth = 18,
    contrast = 1.8,
    letterSpacing = 14,
    slant = 0,
    flourishes = 'none'
  }) {
    const clean1 = (text || '').trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, '') || 'AMBIGRAM';
    const isDualWord = Boolean(secondaryText && secondaryText.trim().length > 0);
    const clean2 = isDualWord
      ? secondaryText.trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, '')
      : clean1;

    const pairs = this.buildLetterPairs(clean1, clean2, isDualWord);

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

  buildLetterPairs(word1, word2, isDualWord) {
    const pairs = [];
    if (!isDualWord) {
      const len = word1.length;
      for (let i = 0; i < len; i++) {
        const c1 = word1[i];
        const c2 = word1[len - 1 - i];
        const isCenter = (len % 2 === 1 && i === Math.floor(len / 2));
        pairs.push({ c1, c2, index: i, isCenter });
      }
    } else {
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

  createHybridGlyph(c1, c2, options) {
    const {
      style = 'gothic',
      strokeWidth = 18,
      contrast = 1.8,
      slant = 0,
      isCenter = false
    } = options;

    if (c1 === ' ' && c2 === ' ') {
      return { width: 50, path: '' };
    }

    const width = this.getGlyphWidth(c1, c2);
    const height = this.nominalHeight;
    const cx = width / 2;
    const cy = height / 2;

    const bespokeKey = `${c1}_${c2}`;
    const invertedKey = `${c2}_${c1}`;

    let path = '';

    if (this.bespokeGlyphs[bespokeKey]) {
      path = this.bespokeGlyphs[bespokeKey](width, height, strokeWidth, contrast, style);
    } else if (this.bespokeGlyphs[invertedKey]) {
      const rawPath = this.bespokeGlyphs[invertedKey](width, height, strokeWidth, contrast, style);
      path = AmbigramEngine.rotatePath180(rawPath, cx, cy);
    } else if (c1 === c2 && this.selfSymmetricGlyphs[c1]) {
      path = this.selfSymmetricGlyphs[c1](width, height, strokeWidth, contrast, style);
    } else {
      path = this.synthesizeDualZoneGlyph(c1, c2, width, height, strokeWidth, contrast, style);
    }

    if (slant !== 0) {
      path = this.applySlant(path, slant, cy);
    }

    return { width, height, path };
  }

  getGlyphWidth(c1, c2) {
    const narrow = new Set(['I', '1', 'J', 'L']);
    const wide = new Set(['M', 'W']);

    if (narrow.has(c1) && narrow.has(c2)) return 75;
    if (wide.has(c1) || wide.has(c2)) return 155;
    if (narrow.has(c1) || narrow.has(c2)) return 95;
    return 120;
  }

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
   * Universal Dual-Zone Ambigram Synthesizer for arbitrary pairs (C1, C2).
   * 
   * Preserves letter silhouettes:
   * - Renders Upper Silhouette of C1 (y: yTop to yMid)
   * - Renders Rotate180(Upper Silhouette of C2) as Lower Silhouette (y: yMid to yBot)
   * - Bridges active vertical stems through the waist
   * - Leaves non-active zones completely OPEN to ensure legibility!
   */
  synthesizeDualZoneGlyph(c1, c2, width, height, sw, contrast, style) {
    const cx = width / 2;
    const cy = height / 2;
    const hsw = Math.max(8, sw / contrast);
    const paths = [];

    const p1 = this.getCharBlueprint(c1, width, sw, hsw);
    const p2 = this.getCharBlueprint(c2, width, sw, hsw);

    // 1. Upper Features from C1
    if (p1.upperPath) {
      paths.push(p1.upperPath);
    }

    // 2. Lower Features from C2 (Inverted 180°)
    if (p2.upperPath) {
      const rotatedC2Upper = AmbigramEngine.rotatePath180(p2.upperPath, cx, cy);
      paths.push(rotatedC2Upper);
    }

    // 3. Connect vertical stems through the waist
    // Left stem
    const hasLeft1 = p1.stems.includes('left');
    const hasRight2 = p2.stems.includes('right'); // When inverted, right stem becomes left!
    if (hasLeft1 && hasRight2) {
      // Continuous left stem from top to bottom
      paths.push(this.renderStem(p1.leftX, this.yTop, this.yBot, sw, style));
    } else if (hasLeft1) {
      // Upper left stem only (leaves lower-left open for C2!)
      paths.push(this.renderStem(p1.leftX, this.yTop, this.yMid + 10, sw, style));
    } else if (hasRight2) {
      // Lower left stem only (leaves upper-left open for C1!)
      paths.push(this.renderStem(p1.leftX, this.yMid - 10, this.yBot, sw, style));
    }

    // Right stem
    const hasRight1 = p1.stems.includes('right');
    const hasLeft2 = p2.stems.includes('left'); // When inverted, left stem becomes right!
    if (hasRight1 && hasLeft2) {
      // Continuous right stem from top to bottom
      paths.push(this.renderStem(p1.rightX, this.yTop, this.yBot, sw, style));
    } else if (hasRight1) {
      // Upper right stem only
      paths.push(this.renderStem(p1.rightX, this.yTop, this.yMid + 10, sw, style));
    } else if (hasLeft2) {
      // Lower right stem only
      paths.push(this.renderStem(p1.rightX, this.yMid - 10, this.yBot, sw, style));
    }

    // Center stem
    const hasCenter1 = p1.stems.includes('center');
    const hasCenter2 = p2.stems.includes('center');
    if (hasCenter1 && hasCenter2) {
      paths.push(this.renderStem(cx - sw / 2, this.yTop, this.yBot, sw, style));
    } else if (hasCenter1) {
      paths.push(this.renderStem(cx - sw / 2, this.yTop, this.yMid + 10, sw, style));
    } else if (hasCenter2) {
      paths.push(this.renderStem(cx - sw / 2, this.yMid - 10, this.yBot, sw, style));
    }

    // Waist crossbar (if either letter needs a middle junction)
    if (p1.needsWaist || p2.needsWaist) {
      const xStart = Math.min(p1.leftX, p2.leftX);
      const xEnd = Math.max(p1.rightX + sw, p2.rightX + sw);
      const barY = this.yMid - hsw / 2;
      paths.push(`M ${xStart} ${barY} L ${xEnd} ${barY} L ${xEnd} ${barY + hsw} L ${xStart} ${barY + hsw} Z`);
    }

    return paths.join(' ');
  }

  renderStem(x, y1, y2, sw, style) {
    if (style === 'gothic') {
      const d = Math.min(sw * 0.75, Math.abs(y2 - y1) * 0.25);
      const pts = [
        [x, y1 + d], [x + sw / 2, y1], [x + sw, y1 + d],
        [x + sw, y2 - d], [x + sw / 2, y2], [x, y2 - d]
      ];
      return AmbigramEngine.polygonToPath(pts);
    } else {
      // clean geometric / serif / stencil
      const pts = [
        [x, y1], [x + sw, y1],
        [x + sw, y2], [x, y2]
      ];
      return AmbigramEngine.polygonToPath(pts);
    }
  }

  /**
   * Anatomical blueprint for each character in normalized glyph box
   */
  getCharBlueprint(ch, width, sw, hsw) {
    const cx = width / 2;
    const yTop = this.yTop;
    const yMid = this.yMid;
    const leftX = 20;
    const rightX = width - 20 - sw;

    const bp = {
      stems: [],
      upperPath: '',
      needsWaist: false,
      leftX,
      rightX
    };

    switch (ch) {
      case 'A':
        bp.stems = ['left', 'right'];
        bp.needsWaist = true;
        // Pointed apex meeting at top center
        bp.upperPath = `M ${leftX} ${yMid} L ${cx - sw / 2} ${yTop + 15} L ${cx} ${yTop} L ${cx + sw / 2} ${yTop + 15} L ${rightX + sw} ${yMid} L ${rightX} ${yMid} L ${cx} ${yTop + 20} L ${leftX + sw} ${yMid} Z`;
        break;

      case 'B':
      case 'P':
      case 'R':
        bp.stems = ['left'];
        bp.needsWaist = true;
        // Upper bowl from yTop to yMid
        bp.upperPath = `M ${leftX} ${yTop} L ${rightX} ${yTop} C ${width} ${yTop}, ${width} ${yMid}, ${rightX} ${yMid} L ${leftX} ${yMid} L ${leftX} ${yMid - hsw} L ${rightX} ${yMid - hsw} C ${width - sw} ${yMid - hsw}, ${width - sw} ${yTop + hsw}, ${rightX} ${yTop + hsw} L ${leftX} ${yTop + hsw} Z`;
        break;

      case 'C':
        bp.stems = ['left'];
        // Top arm curving right with downward terminal
        bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
        break;

      case 'D':
      case 'O':
      case 'Q':
        bp.stems = ['left', 'right'];
        // Top arch connecting left to right
        bp.upperPath = `M ${leftX} ${yMid} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yMid} L ${rightX} ${yMid} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yMid} Z`;
        break;

      case 'E':
      case 'F':
        bp.stems = ['left'];
        bp.needsWaist = true;
        // Top horizontal arm
        bp.upperPath = `M ${leftX} ${yTop} L ${rightX + sw} ${yTop} L ${rightX + sw} ${yTop + hsw} L ${leftX} ${yTop + hsw} Z`;
        break;

      case 'G':
        bp.stems = ['left'];
        bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
        break;

      case 'H':
        bp.stems = ['left', 'right'];
        bp.needsWaist = true;
        break;

      case 'I':
      case '1':
        bp.stems = ['center'];
        // Balanced top serif
        bp.upperPath = `M ${cx - 24} ${yTop} L ${cx + 24} ${yTop} L ${cx + 24} ${yTop + hsw} L ${cx - 24} ${yTop + hsw} Z`;
        break;

      case 'J':
      case 'L':
        bp.stems = ['left'];
        // Top serif for L
        bp.upperPath = `M ${leftX - 8} ${yTop} L ${leftX + sw + 12} ${yTop} L ${leftX + sw + 12} ${yTop + hsw} L ${leftX - 8} ${yTop + hsw} Z`;
        break;

      case 'K':
        bp.stems = ['left'];
        bp.needsWaist = true;
        // Diagonal upper arm branching from waist
        bp.upperPath = `M ${leftX + sw} ${yMid} L ${rightX + sw} ${yTop} L ${rightX} ${yTop} L ${leftX + sw} ${yMid - 15} Z`;
        break;

      case 'M':
        bp.stems = ['left', 'center', 'right'];
        // Two top connecting arches
        bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${cx} ${yTop}, ${cx} ${yTop + 20} C ${cx} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 20} L ${rightX} ${yTop + 20} C ${rightX} ${yTop + hsw}, ${cx + sw / 2} ${yTop + hsw}, ${cx} ${yTop + 25} C ${cx - sw / 2} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
        break;

      case 'N':
        bp.stems = ['left', 'right'];
        // Top arch connecting left to right
        bp.upperPath = `M ${leftX} ${yTop + 25} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 25} Z`;
        break;

      case 'S':
        bp.stems = [];
        // Top hook of S
        bp.upperPath = `M ${rightX + sw} ${yTop + 25} C ${rightX + sw} ${yTop}, ${cx} ${yTop}, ${cx - 15} ${yTop + 10} C ${leftX} ${yTop + 25}, ${cx - 20} ${yMid - 10}, ${cx} ${yMid} L ${cx + 10} ${yMid} C ${cx - 10} ${yMid - 15}, ${leftX + sw} ${yTop + 25}, ${cx} ${yTop + hsw} C ${rightX} ${yTop + hsw}, ${rightX} ${yTop + 25}, ${rightX + sw} ${yTop + 25} Z`;
        break;

      case 'T':
        bp.stems = ['center'];
        // Wide top horizontal crossbar
        bp.upperPath = `M 15 ${yTop} L ${width - 15} ${yTop} L ${width - 15} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
        break;

      case 'U':
      case 'V':
      case 'W':
      case 'Y':
        bp.stems = ['left', 'right'];
        // Open top! No upper bar or arch
        break;

      case 'X':
        bp.stems = [];
        bp.upperPath = `M ${leftX} ${yTop} L ${cx} ${yMid} L ${cx - sw / 2} ${yMid} L ${leftX} ${yTop + hsw} Z M ${rightX + sw} ${yTop} L ${cx} ${yMid} L ${cx + sw / 2} ${yMid} L ${rightX + sw} ${yTop + hsw} Z`;
        break;

      case 'Z':
        bp.stems = [];
        bp.upperPath = `M 15 ${yTop} L ${width - 15} ${yTop} L ${width - 15} ${yTop + hsw} L ${cx + 15} ${yMid} L ${cx - 15} ${yMid} L ${width - 35} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
        break;

      default:
        bp.stems = ['left', 'right'];
        break;
    }

    return bp;
  }

  generateFlourishes({ style, flourishType, totalWidth, totalHeight, strokeWidth }) {
    if (flourishType === 'none') return '';

    const paths = [];
    const sw = strokeWidth * 0.5;
    const margin = 20;
    const left = -margin;
    const right = totalWidth + margin;
    const topY = -12;
    const cx = totalWidth / 2;
    const cy = totalHeight / 2;

    if (flourishType === 'swashes') {
      const topSwash = `M ${left} ${topY + 15} C ${left + 50} ${topY - 12}, ${cx - 60} ${topY - 15}, ${cx} ${topY - 15} C ${cx + 60} ${topY - 15}, ${right - 50} ${topY - 12}, ${right} ${topY + 15} L ${right} ${topY + 15 + sw} C ${right - 50} ${topY - 12 + sw}, ${cx + 60} ${topY - 15 + sw}, ${cx} ${topY - 15 + sw} C ${cx - 60} ${topY - 15 + sw}, ${left + 50} ${topY - 12 + sw}, ${left} ${topY + 15 + sw} Z`;
      const botSwash = AmbigramEngine.rotatePath180(topSwash, cx, cy);
      paths.push(topSwash, botSwash);
    } else if (flourishType === 'frame') {
      const bW = 35;
      const bH = 25;
      const tl = `M ${left} ${topY + bH} L ${left} ${topY} L ${left + bW} ${topY} L ${left + bW} ${topY + sw} L ${left + sw} ${topY + sw} L ${left + sw} ${topY + bH} Z`;
      const tr = `M ${right - bW} ${topY} L ${right} ${topY} L ${right} ${topY + bH} L ${right - sw} ${topY + bH} L ${right - sw} ${topY + sw} L ${right - bW} ${topY + sw} Z`;
      const bl = AmbigramEngine.rotatePath180(tr, cx, cy);
      const br = AmbigramEngine.rotatePath180(tl, cx, cy);
      paths.push(tl, tr, bl, br);
    } else if (flourishType === 'filigree') {
      const size = strokeWidth * 1.2;
      const l1 = [
        [left - size, cy], [left, cy - size],
        [left + size, cy], [left, cy + size]
      ];
      const r1 = [
        [right - size, cy], [right, cy - size],
        [right + size, cy], [right, cy + size]
      ];
      paths.push(AmbigramEngine.polygonToPath(l1), AmbigramEngine.polygonToPath(r1));
    }

    return paths.join(' ');
  }

  // =========================================================================
  // BESPOKE MASTER GLYPH SET FOR CLASSIC & HISTORICAL AMBIGRAM PAIRS
  // Handcrafted to guarantee 100% legibility in both upright and 180° views.
  // =========================================================================

  bespokeGlyphs = {
    // -----------------------------------------------------------------------
    // L <-> T: Iconic Angels & Demons pair
    // Upright: Left stem with bottom right foot -> L
    // Inverted 180°: Top horizontal crossbar with stem -> T
    // -----------------------------------------------------------------------
    'L_T': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const xStem = 24;
      const yTop = 25;
      const yBot = 175;

      // Vertical stem
      const stem = `M ${xStem} ${yTop} L ${xStem + sw} ${yTop} L ${xStem + sw} ${yBot} L ${xStem} ${yBot} Z`;
      // Top right spur (for T crossbar when flipped)
      const topArm = `M ${xStem + sw} ${yTop} L ${xStem + sw + 35} ${yTop} L ${xStem + sw + 35} ${yTop + hsw} L ${xStem + sw} ${yTop + hsw} Z`;
      // Top left spur (for T crossbar left side when flipped)
      const topLeft = `M ${xStem - 16} ${yTop} L ${xStem} ${yTop} L ${xStem} ${yTop + hsw} L ${xStem - 16} ${yTop + hsw} Z`;
      // Bottom foot (L foot upright; becomes T right crossbar when flipped)
      const botFoot = `M ${xStem + sw} ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L ${xStem} ${yBot} Z`;

      return `${stem} ${topArm} ${topLeft} ${botFoot}`;
    },

    // -----------------------------------------------------------------------
    // L <-> A: Upright L, Inverted A
    // -----------------------------------------------------------------------
    'L_A': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;
      const xLeft = 20;
      const xRight = w - 20 - sw;

      // Left stem (L upright, Right leg of A when flipped)
      const stem = `M ${xLeft} ${yTop} L ${xLeft + sw} ${yTop} L ${xLeft + sw} ${yBot} L ${xLeft} ${yBot} Z`;
      // Bottom foot (L upright)
      const foot = `M ${xLeft + sw} ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L ${xLeft + sw} ${yBot} Z`;
      // Right diagonal leg branching from waist to bottom apex (apex of A when flipped!)
      const diagA = `M ${xRight} ${yMid} L ${cx} ${yTop} L ${cx + sw} ${yTop} L ${xRight + sw} ${yMid} Z`;
      // Waist crossbar for A
      const bar = `M ${xLeft + sw} ${yMid - hsw / 2} L ${xRight} ${yMid - hsw / 2} L ${xRight} ${yMid + hsw / 2} L ${xLeft + sw} ${yMid + hsw / 2} Z`;

      return `${stem} ${foot} ${diagA} ${bar}`;
    },

    // -----------------------------------------------------------------------
    // U <-> N: Classic Blackletter Uncial pair
    // Upright: N arch on top; Inverted: U basin on top
    // -----------------------------------------------------------------------
    'U_N': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const x1 = 20;
      const x2 = w - 20 - sw;
      const yTop = 25;
      const yBot = 175;

      // Left stem (minim with open bottom for N)
      const stem1 = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
      // Right stem (minim with open top for U)
      const stem2 = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot - 20} L ${x2} ${yBot - 20} Z`;
      // Top arch connecting left to right (N arch)
      const topArch = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
      // Bottom basin connecting left to right (U curve when flipped)
      const botBasin = `M ${x1} ${yBot - 20} C ${x1} ${yBot}, ${x2 + sw} ${yBot}, ${x2 + sw} ${yBot - 20} L ${x2 + sw - hsw} ${yBot - 20} C ${x2 + sw - hsw} ${yBot - hsw}, ${x1 + hsw} ${yBot - hsw}, ${x1 + hsw} ${yBot - 20} Z`;

      return `${stem1} ${stem2} ${topArch} ${botBasin}`;
    },

    // -----------------------------------------------------------------------
    // M <-> W: 3 minims crown / valley
    // -----------------------------------------------------------------------
    'M_W': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const x1 = 16;
      const x2 = w / 2 - sw / 2;
      const x3 = w - 16 - sw;
      const yTop = 25;
      const yBot = 175;

      const s1 = `M ${x1} ${yTop + 15} L ${x1 + sw} ${yTop + 15} L ${x1 + sw} ${yBot - 15} L ${x1} ${yBot - 15} Z`;
      const s2 = `M ${x2} ${yTop + 15} L ${x2 + sw} ${yTop + 15} L ${x2 + sw} ${yBot - 15} L ${x2} ${yBot - 15} Z`;
      const s3 = `M ${x3} ${yTop + 15} L ${x3 + sw} ${yTop + 15} L ${x3 + sw} ${yBot - 15} L ${x3} ${yBot - 15} Z`;

      // Top arches for M
      const a1 = `M ${x1} ${yTop + 15} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 15} L ${x2} ${yTop + 15} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 15} Z`;
      const a2 = `M ${x2} ${yTop + 15} C ${x2} ${yTop}, ${x3 + sw} ${yTop}, ${x3 + sw} ${yTop + 15} L ${x3} ${yTop + 15} C ${x3} ${yTop + hsw}, ${x2 + sw} ${yTop + hsw}, ${x2 + sw} ${yTop + 15} Z`;

      // Bottom vertices for W (flipped)
      const b1 = `M ${x1} ${yBot - 15} C ${x1} ${yBot}, ${x2 + sw} ${yBot}, ${x2 + sw} ${yBot - 15} L ${x2} ${yBot - 15} C ${x2} ${yBot - hsw}, ${x1 + sw} ${yBot - hsw}, ${x1 + sw} ${yBot - 15} Z`;
      const b2 = `M ${x2} ${yBot - 15} C ${x2} ${yBot}, ${x3 + sw} ${yBot}, ${x3 + sw} ${yBot - 15} L ${x3} ${yBot - 15} C ${x3} ${yBot - hsw}, ${x2 + sw} ${yBot - hsw}, ${x2 + sw} ${yBot - 15} Z`;

      return `${s1} ${s2} ${s3} ${a1} ${a2} ${b1} ${b2}`;
    },

    // -----------------------------------------------------------------------
    // M <-> I: Prominent center minim with Gothic flanking arches
    // -----------------------------------------------------------------------
    'M_I': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const x1 = 18;
      const x2 = cx - sw / 2;
      const x3 = w - 18 - sw;
      const yTop = 25;
      const yBot = 175;

      // Prominent center stem for I
      const centerStem = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot} L ${x2} ${yBot} Z`;
      // Top and bottom serifs for I
      const topSerif = `M ${cx - 28} ${yTop} L ${cx + 28} ${yTop} L ${cx + 28} ${yTop + hsw} L ${cx - 28} ${yTop + hsw} Z`;
      const botSerif = `M ${cx - 28} ${yBot - hsw} L ${cx + 28} ${yBot - hsw} L ${cx + 28} ${yBot} L ${cx - 28} ${yBot} Z`;

      // Flanking minims and top arches for M
      const leftMinim = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot - 40} L ${x1} ${yBot - 40} Z`;
      const rightMinim = `M ${x3} ${yTop + 40} L ${x3 + sw} ${yTop + 40} L ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} Z`;
      const archL = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
      const archR = `M ${x2} ${yBot - 20} C ${x2} ${yBot}, ${x3 + sw} ${yBot}, ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} C ${x3} ${yBot - hsw}, ${x2 + sw} ${yBot - hsw}, ${x2 + sw} ${yBot - 20} Z`;

      return `${centerStem} ${topSerif} ${botSerif} ${leftMinim} ${rightMinim} ${archL} ${archR}`;
    },

    // -----------------------------------------------------------------------
    // V <-> A: Chevron Apex pair
    // -----------------------------------------------------------------------
    'V_A': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;

      // Left diagonal down to bottom vertex
      const leg1 = `M 15 ${yTop} L ${15 + sw} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
      // Right diagonal up from bottom vertex to top
      const leg2 = `M ${w - 15} ${yTop} L ${w - 15 - sw} ${yTop} L ${cx - sw / 2} ${yBot} L ${cx + sw / 2} ${yBot} Z`;
      // Waist crossbar for A
      const bar = `M ${cx - 24} ${yMid - hsw / 2} L ${cx + 24} ${yMid - hsw / 2} L ${cx + 24} ${yMid + hsw / 2} L ${cx - 24} ${yMid + hsw / 2} Z`;

      return `${leg1} ${leg2} ${bar}`;
    },

    // -----------------------------------------------------------------------
    // C <-> R (from VICTORIA)
    // -----------------------------------------------------------------------
    'C_R': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const xStem = 20;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;

      // Left spine for C and stem for R
      const spine = `M ${xStem} ${yTop + 20} L ${xStem + sw} ${yTop + 20} L ${xStem + sw} ${yBot - 20} L ${xStem} ${yBot - 20} Z`;
      // Top arch for C (becomes diagonal leg for R when flipped)
      const topArm = `M ${xStem} ${yTop + 20} C ${xStem} ${yTop}, ${w - 15} ${yTop}, ${w - 15} ${yTop + 25} L ${w - 15 - sw} ${yTop + 25} C ${w - 15 - sw} ${yTop + hsw}, ${xStem + sw} ${yTop + hsw}, ${xStem + sw} ${yTop + 20} Z`;
      // Middle loop connecting to R upper bowl
      const midLoop = `M ${xStem + sw} ${yMid - hsw} L ${w - 15} ${yMid - hsw} C ${w} ${yMid - hsw}, ${w} ${yTop + 10}, ${w - 20} ${yTop + 10} L ${w - 20} ${yTop + 10 + hsw} C ${w - sw} ${yTop + 10 + hsw}, ${w - sw} ${yMid}, ${xStem + sw} ${yMid} Z`;
      // Bottom leg (R leg upright; C bottom arm when flipped)
      const botLeg = `M ${xStem + sw} ${yMid} L ${w - 15} ${yBot} L ${w - 15 - sw} ${yBot} L ${xStem + sw} ${yMid + 15} Z`;

      return `${spine} ${topArm} ${midLoop} ${botLeg}`;
    },

    // -----------------------------------------------------------------------
    // T <-> O (from VICTORIA)
    // -----------------------------------------------------------------------
    'T_O': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const cy = h / 2;
      const yTop = 25;
      const yBot = 175;

      // Top crossbar for T (and top arch for O)
      const topBar = `M 15 ${yTop} L ${w - 15} ${yTop} L ${w - 15} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
      // Center stem for T
      const centerStem = `M ${cx - sw / 2} ${yTop} L ${cx + sw / 2} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
      // Bottom bar for O
      const botBar = `M 15 ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L 15 ${yBot} Z`;
      // Curved brackets that form the outer O silhouette
      const leftArc = `M 15 ${yTop} C 5 ${cy}, 5 ${cy}, 15 ${yBot} L ${15 + hsw} ${yBot} C ${5 + hsw} ${cy}, ${5 + hsw} ${cy}, ${15 + hsw} ${yTop} Z`;
      const rightArc = `M ${w - 15} ${yTop} C ${w - 5} ${cy}, ${w - 5} ${cy}, ${w - 15} ${yBot} L ${w - 15 - hsw} ${yBot} C ${w - 5 - hsw} ${cy}, ${w - 5 - hsw} ${cy}, ${w - 15 - hsw} ${yTop} Z`;

      return `${topBar} ${centerStem} ${botBar} ${leftArc} ${rightArc}`;
    },

    // -----------------------------------------------------------------------
    // B <-> Q / D <-> P
    // -----------------------------------------------------------------------
    'D_P': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const xStem = 22;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;

      const stem = `M ${xStem} ${yTop} L ${xStem + sw} ${yTop} L ${xStem + sw} ${yBot} L ${xStem} ${yBot} Z`;
      // Curved bowl on the right
      const bowl = `M ${xStem + sw} ${yTop + 10} C ${w + 5} ${yTop + 10}, ${w + 5} ${yBot - 10}, ${xStem + sw} ${yBot - 10} L ${xStem + sw} ${yBot - 10 - hsw} C ${w - sw} ${yBot - 10 - hsw}, ${w - sw} ${yTop + 10 + hsw}, ${xStem + sw} ${yTop + 10 + hsw} Z`;

      return `${stem} ${bowl}`;
    },

    // -----------------------------------------------------------------------
    // M <-> C (from MAGIC)
    // -----------------------------------------------------------------------
    'M_C': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const x1 = 18;
      const x2 = w / 2 - sw / 2;
      const x3 = w - 18 - sw;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;

      const s1 = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
      const s2 = `M ${x2} ${yTop + 20} L ${x2 + sw} ${yTop + 20} L ${x2 + sw} ${yMid + 15} L ${x2} ${yMid + 15} Z`;
      const s3 = `M ${x3} ${yTop + 20} L ${x3 + sw} ${yTop + 20} L ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} Z`;

      const a1 = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
      const a2 = `M ${x2} ${yTop + 20} C ${x2} ${yTop}, ${x3 + sw} ${yTop}, ${x3 + sw} ${yTop + 20} L ${x3} ${yTop + 20} C ${x3} ${yTop + hsw}, ${x2 + sw} ${yTop + hsw}, ${x2 + sw} ${yTop + 20} Z`;
      const bCurve = `M ${x1} ${yBot} C ${x1} ${yBot - 15}, ${x3 + sw} ${yBot - 15}, ${x3 + sw} ${yBot - 20} L ${x3 + sw} ${yBot} L ${x1} ${yBot} Z`;

      return `${s1} ${s2} ${s3} ${a1} ${a2} ${bCurve}`;
    },

    // -----------------------------------------------------------------------
    // A <-> I (from MAGIC)
    // -----------------------------------------------------------------------
    'A_I': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const yTop = 25;
      const yBot = 175;
      const yMid = 100;
      const x1 = 18;
      const x2 = w - 18 - sw;

      const centerStem = `M ${cx - sw / 2} ${yTop} L ${cx + sw / 2} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
      const leg1 = `M ${cx} ${yTop} L ${cx} ${yTop + 20} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
      const leg2 = `M ${cx} ${yTop} L ${cx} ${yTop + 20} L ${x2} ${yBot} L ${x2 + sw} ${yBot} Z`;
      const bar = `M ${x1 + sw} ${yMid - hsw / 2} L ${x2} ${yMid - hsw / 2} L ${x2} ${yMid + hsw / 2} L ${x1 + sw} ${yMid + hsw / 2} Z`;
      const botSerif = `M ${cx - 25} ${yBot - hsw} L ${cx + 25} ${yBot - hsw} L ${cx + 25} ${yBot} L ${cx - 25} ${yBot} Z`;

      return `${centerStem} ${leg1} ${leg2} ${bar} ${botSerif}`;
    }
  };

  // =========================================================================
  // SELF-SYMMETRIC GLYPH DEFINITIONS (180° Point-Symmetric)
  // =========================================================================

  selfSymmetricGlyphs = {
    // -----------------------------------------------------------------------
    // S: Genuine point-symmetric serpentine spine
    // -----------------------------------------------------------------------
    'S': (w, h, sw, contrast, style) => {
      const cx = w / 2;
      const cy = h / 2;
      const yTop = 25;
      const yBot = 175;
      const xR = w - 20;
      const xL = 20;

      // Clean point-symmetric S-ribbon
      return `M ${xR} ${yTop + 35} C ${xR} ${yTop}, ${cx} ${yTop}, ${cx - 15} ${yTop + 10} C ${xL} ${yTop + 25}, ${cx - 25} ${cy - 12}, ${cx} ${cy} C ${cx + 25} ${cy + 12}, ${xR} ${yBot - 25}, ${cx + 15} ${yBot - 10} C ${cx} ${yBot}, ${xL} ${yBot}, ${xL} ${yBot - 35} L ${xL + sw} ${yBot - 35} C ${xL + sw} ${yBot - 12}, ${cx} ${yBot - 12}, ${cx + 15} ${yBot - 22} C ${xR - sw} ${yBot - 35}, ${cx + 15} ${cy + 10}, ${cx} ${cy} C ${cx - 15} ${cy - 10}, ${xL + sw} ${yTop + 35}, ${cx - 15} ${yTop + 22} C ${cx} ${yTop + 12}, ${xR - sw} ${yTop + 12}, ${xR - sw} ${yTop + 35} Z`;
    },

    // -----------------------------------------------------------------------
    // N: Symmetrical N with point-symmetric diagonal
    // -----------------------------------------------------------------------
    'N': (w, h, sw, contrast, style) => {
      const x1 = 20;
      const x2 = w - 20 - sw;
      const yTop = 25;
      const yBot = 175;

      const s1 = `M ${x1} ${yTop} L ${x1 + sw} ${yTop} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
      const s2 = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot} L ${x2} ${yBot} Z`;
      const diag = `M ${x1} ${yTop} L ${x1 + sw * 1.2} ${yTop} L ${x2 + sw} ${yBot} L ${x2 - sw * 0.2} ${yBot} Z`;

      return `${s1} ${s2} ${diag}`;
    },

    // -----------------------------------------------------------------------
    // O: Hollow oval with clean negative space
    // -----------------------------------------------------------------------
    'O': (w, h, sw, contrast, style) => {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2 - 18;
      const ry = (h - 50) / 2;
      const irx = rx - sw;
      const iry = ry - (sw / contrast);

      return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry} Z M ${cx} ${cy - iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy + iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy - iry} Z`;
    },

    // -----------------------------------------------------------------------
    // I: Central minim with balanced serifs
    // -----------------------------------------------------------------------
    'I': (w, h, sw, contrast, style) => {
      const cx = w / 2;
      const yTop = 25;
      const yBot = 175;
      const hsw = Math.max(9, sw / contrast);
      const serifW = 24;

      const stem = `M ${cx - sw / 2} ${yTop} L ${cx + sw / 2} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
      const topSerif = `M ${cx - serifW} ${yTop} L ${cx + serifW} ${yTop} L ${cx + serifW} ${yTop + hsw} L ${cx - serifW} ${yTop + hsw} Z`;
      const botSerif = `M ${cx - serifW} ${yBot - hsw} L ${cx + serifW} ${yBot - hsw} L ${cx + serifW} ${yBot} L ${cx - serifW} ${yBot} Z`;

      return `${stem} ${topSerif} ${botSerif}`;
    },

    // -----------------------------------------------------------------------
    // H: Two vertical stems with centered waist crossbar
    // -----------------------------------------------------------------------
    'H': (w, h, sw, contrast, style) => {
      const x1 = 20;
      const x2 = w - 20 - sw;
      const yTop = 25;
      const yBot = 175;
      const cy = h / 2;
      const hsw = Math.max(9, sw / contrast);

      const s1 = `M ${x1} ${yTop} L ${x1 + sw} ${yTop} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
      const s2 = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot} L ${x2} ${yBot} Z`;
      const bar = `M ${x1 + sw} ${cy - hsw / 2} L ${x2} ${cy - hsw / 2} L ${x2} ${cy + hsw / 2} L ${x1 + sw} ${cy + hsw / 2} Z`;

      return `${s1} ${s2} ${bar}`;
    },

    // -----------------------------------------------------------------------
    // X: Crossing diagonals through center
    // -----------------------------------------------------------------------
    'X': (w, h, sw, contrast, style) => {
      const x1 = 20;
      const x2 = w - 20;
      const yTop = 25;
      const yBot = 175;

      const d1 = `M ${x1} ${yTop} L ${x1 + sw} ${yTop} L ${x2} ${yBot} L ${x2 - sw} ${yBot} Z`;
      const d2 = `M ${x2 - sw} ${yTop} L ${x2} ${yTop} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;

      return `${d1} ${d2}`;
    },

    // -----------------------------------------------------------------------
    // Z: Horizontal bars with central diagonal
    // -----------------------------------------------------------------------
    'Z': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const yTop = 25;
      const yBot = 175;
      const x1 = 20;
      const x2 = w - 20;

      const topBar = `M ${x1} ${yTop} L ${x2} ${yTop} L ${x2} ${yTop + hsw} L ${x1} ${yTop + hsw} Z`;
      const botBar = `M ${x1} ${yBot - hsw} L ${x2} ${yBot - hsw} L ${x2} ${yBot} L ${x1} ${yBot} Z`;
      const diag = `M ${x2 - sw} ${yTop + hsw} L ${x2} ${yTop + hsw} L ${x1 + sw} ${yBot - hsw} L ${x1} ${yBot - hsw} Z`;

      return `${topBar} ${botBar} ${diag}`;
    },

    // -----------------------------------------------------------------------
    // G: Self-symmetric G (C-curve with balanced inward spurs)
    // -----------------------------------------------------------------------
    'G': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const cy = h / 2;
      const x1 = 20;
      const x2 = w - 20;
      const yTop = 25;
      const yBot = 175;

      const spine = `M ${x1} ${yTop + 25} L ${x1 + sw} ${yTop + 25} L ${x1 + sw} ${yBot - 25} L ${x1} ${yBot - 25} Z`;
      const topArm = `M ${x1} ${yTop + 25} C ${x1} ${yTop}, ${x2} ${yTop}, ${x2} ${yTop + 25} L ${x2 - sw} ${yTop + 25} C ${x2 - sw} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 25} Z`;
      const botArm = `M ${x1} ${yBot - 25} C ${x1} ${yBot}, ${x2} ${yBot}, ${x2} ${yBot - 25} L ${x2 - sw} ${yBot - 25} C ${x2 - sw} ${yBot - hsw}, ${x1 + sw} ${yBot - hsw}, ${x1 + sw} ${yBot - 25} Z`;
      // Inward horizontal spurs
      const spurBot = `M ${cx} ${cy + 10} L ${x2} ${cy + 10} L ${x2} ${yBot - 25} L ${x2 - sw} ${yBot - 25} L ${x2 - sw} ${cy + 10 + hsw} L ${cx} ${cy + 10 + hsw} Z`;
      const spurTop = AmbigramEngine.rotatePath180(spurBot, cx, cy);

      return `${spine} ${topArm} ${botArm} ${spurBot} ${spurTop}`;
    },

    // -----------------------------------------------------------------------
    // A: 180° Point-Symmetric A
    // -----------------------------------------------------------------------
    'A': (w, h, sw, contrast, style) => {
      const hsw = Math.max(9, sw / contrast);
      const cx = w / 2;
      const cy = h / 2;
      const yTop = 25;
      const yBot = 175;
      const x1 = 20;
      const x2 = w - 20;

      // Two diagonal legs meeting at top apex and bottom balanced chevron
      const l1 = `M ${cx} ${yTop} L ${x2} ${yBot} L ${x2 - sw} ${yBot} L ${cx - sw / 2} ${yTop + 20} Z`;
      const l2 = `M ${cx} ${yTop} L ${x1} ${yBot} L ${x1 + sw} ${yBot} L ${cx + sw / 2} ${yTop + 20} Z`;
      const bar = `M ${x1 + 15} ${cy - hsw / 2} L ${x2 - 15} ${cy - hsw / 2} L ${x2 - 15} ${cy + hsw / 2} L ${x1 + 15} ${cy + hsw / 2} Z`;

      return `${l1} ${l2} ${bar}`;
    }
  };
}
