(() => {
  // js/ambigram-engine.js
  var AmbigramEngine = class _AmbigramEngine {
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
      if (!d) return "";
      return d.replace(/([A-DF-Za-df-z])|([-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/g, (match, cmd, num) => {
        if (cmd) return cmd;
        return num;
      }).replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
        const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const isRel = cmd === cmd.toLowerCase();
        const uCmd = cmd.toUpperCase();
        if (uCmd === "Z") return "Z";
        if (uCmd === "H") {
          const res = numbers.map((x) => isRel ? -x : 2 * cx - x);
          return (isRel ? "h " : "H ") + res.join(" ");
        }
        if (uCmd === "V") {
          const res = numbers.map((y) => isRel ? -y : 2 * cy - y);
          return (isRel ? "v " : "V ") + res.join(" ");
        }
        const transformed = [];
        for (let i = 0; i < numbers.length; i += 2) {
          const x = numbers[i];
          const y = numbers[i + 1];
          if (x !== void 0 && y !== void 0) {
            if (isRel) {
              transformed.push((-x).toFixed(2), (-y).toFixed(2));
            } else {
              transformed.push((2 * cx - x).toFixed(2), (2 * cy - y).toFixed(2));
            }
          }
        }
        return (isRel ? cmd : uCmd) + " " + transformed.join(" ");
      });
    }
    /**
     * Translate an SVG path string by (dx, dy)
     */
    static translatePath(d, dx, dy) {
      if (!d) return "";
      return d.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
        const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const isRel = cmd === cmd.toLowerCase();
        const uCmd = cmd.toUpperCase();
        if (uCmd === "Z" || isRel) return fullMatch;
        if (uCmd === "H") {
          return "H " + numbers.map((x) => (x + dx).toFixed(2)).join(" ");
        }
        if (uCmd === "V") {
          return "V " + numbers.map((y) => (y + dy).toFixed(2)).join(" ");
        }
        const transformed = [];
        for (let i = 0; i < numbers.length; i += 2) {
          const x = numbers[i];
          const y = numbers[i + 1];
          if (x !== void 0 && y !== void 0) {
            transformed.push((x + dx).toFixed(2), (y + dy).toFixed(2));
          }
        }
        return uCmd + " " + transformed.join(" ");
      });
    }
    /**
     * Helper to format an SVG polygon loop into an SVG path string
     */
    static polygonToPath(points, closed = true) {
      if (!points || points.length === 0) return "";
      let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i][0].toFixed(2)} ${points[i][1].toFixed(2)}`;
      }
      if (closed) d += " Z";
      return d;
    }
    /**
     * Primary ambigram generator
     */
    generate({
      text = "AMBIGRAM",
      secondaryText = "",
      style = "gothic",
      strokeWidth = 18,
      contrast = 1.8,
      letterSpacing = 14,
      slant = 0,
      flourishes = "none"
    }) {
      const clean1 = (text || "").trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, "") || "AMBIGRAM";
      const isDualWord = Boolean(secondaryText && secondaryText.trim().length > 0);
      const clean2 = isDualWord ? secondaryText.trim().toUpperCase().replace(/[^A-Z0-9\s\-]/g, "") : clean1;
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
        const translatedPath = _AmbigramEngine.translatePath(glyph.path, currentX, 0);
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
      let flourishPath = "";
      if (flourishes !== "none") {
        flourishPath = this.generateFlourishes({
          style,
          flourishType: flourishes,
          totalWidth: totalWordWidth,
          totalHeight: totalWordHeight,
          strokeWidth
        });
      }
      const combinedPaths = glyphs.map((g) => g.path).filter(Boolean);
      if (flourishPath) {
        combinedPaths.push(flourishPath);
      }
      const masterPathData = combinedPaths.join(" ");
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
          const isCenter = len % 2 === 1 && i === Math.floor(len / 2);
          pairs.push({ c1, c2, index: i, isCenter });
        }
      } else {
        const maxLen = Math.max(word1.length, word2.length);
        const padded1 = word1.padEnd(maxLen, " ");
        const padded2 = word2.padEnd(maxLen, " ");
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
        style = "gothic",
        strokeWidth = 18,
        contrast = 1.8,
        slant = 0,
        isCenter = false
      } = options;
      if (c1 === " " && c2 === " ") {
        return { width: 50, path: "" };
      }
      const width = this.getGlyphWidth(c1, c2);
      const height = this.nominalHeight;
      const cx = width / 2;
      const cy = height / 2;
      const bespokeKey = `${c1}_${c2}`;
      const invertedKey = `${c2}_${c1}`;
      let path = "";
      if (this.bespokeGlyphs[bespokeKey]) {
        path = this.bespokeGlyphs[bespokeKey](width, height, strokeWidth, contrast, style);
      } else if (this.bespokeGlyphs[invertedKey]) {
        const rawPath = this.bespokeGlyphs[invertedKey](width, height, strokeWidth, contrast, style);
        path = _AmbigramEngine.rotatePath180(rawPath, cx, cy);
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
      const narrow = /* @__PURE__ */ new Set(["I", "1", "J", "L"]);
      const wide = /* @__PURE__ */ new Set(["M", "W"]);
      if (narrow.has(c1) && narrow.has(c2)) return 75;
      if (wide.has(c1) || wide.has(c2)) return 155;
      if (narrow.has(c1) || narrow.has(c2)) return 95;
      return 120;
    }
    applySlant(pathData, slantDeg, centerY) {
      if (!pathData || slantDeg === 0) return pathData;
      const rad = slantDeg * Math.PI / 180;
      const tan = Math.tan(rad);
      return pathData.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
        const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const isRel = cmd === cmd.toLowerCase();
        const uCmd = cmd.toUpperCase();
        if (uCmd === "Z" || isRel) return fullMatch;
        const transformed = [];
        for (let i = 0; i < numbers.length; i += 2) {
          const x = numbers[i];
          const y = numbers[i + 1];
          if (x !== void 0 && y !== void 0) {
            const slantedX = x + (centerY - y) * tan;
            transformed.push(slantedX.toFixed(2), y.toFixed(2));
          }
        }
        return uCmd + " " + transformed.join(" ");
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
      if (p1.upperPath) {
        paths.push(p1.upperPath);
      }
      if (p2.upperPath) {
        const rotatedC2Upper = _AmbigramEngine.rotatePath180(p2.upperPath, cx, cy);
        paths.push(rotatedC2Upper);
      }
      const hasLeft1 = p1.stems.includes("left");
      const hasRight2 = p2.stems.includes("right");
      if (hasLeft1 && hasRight2) {
        paths.push(this.renderStem(p1.leftX, this.yTop, this.yBot, sw, style));
      } else if (hasLeft1) {
        paths.push(this.renderStem(p1.leftX, this.yTop, this.yMid + 10, sw, style));
      } else if (hasRight2) {
        paths.push(this.renderStem(p1.leftX, this.yMid - 10, this.yBot, sw, style));
      }
      const hasRight1 = p1.stems.includes("right");
      const hasLeft2 = p2.stems.includes("left");
      if (hasRight1 && hasLeft2) {
        paths.push(this.renderStem(p1.rightX, this.yTop, this.yBot, sw, style));
      } else if (hasRight1) {
        paths.push(this.renderStem(p1.rightX, this.yTop, this.yMid + 10, sw, style));
      } else if (hasLeft2) {
        paths.push(this.renderStem(p1.rightX, this.yMid - 10, this.yBot, sw, style));
      }
      const hasCenter1 = p1.stems.includes("center");
      const hasCenter2 = p2.stems.includes("center");
      if (hasCenter1 && hasCenter2) {
        paths.push(this.renderStem(cx - sw / 2, this.yTop, this.yBot, sw, style));
      } else if (hasCenter1) {
        paths.push(this.renderStem(cx - sw / 2, this.yTop, this.yMid + 10, sw, style));
      } else if (hasCenter2) {
        paths.push(this.renderStem(cx - sw / 2, this.yMid - 10, this.yBot, sw, style));
      }
      if (p1.needsWaist || p2.needsWaist) {
        const xStart = Math.min(p1.leftX, p2.leftX);
        const xEnd = Math.max(p1.rightX + sw, p2.rightX + sw);
        const barY = this.yMid - hsw / 2;
        paths.push(`M ${xStart} ${barY} L ${xEnd} ${barY} L ${xEnd} ${barY + hsw} L ${xStart} ${barY + hsw} Z`);
      }
      return paths.join(" ");
    }
    renderStem(x, y1, y2, sw, style) {
      if (style === "gothic") {
        const d = Math.min(sw * 0.75, Math.abs(y2 - y1) * 0.25);
        const pts = [
          [x, y1 + d],
          [x + sw / 2, y1],
          [x + sw, y1 + d],
          [x + sw, y2 - d],
          [x + sw / 2, y2],
          [x, y2 - d]
        ];
        return _AmbigramEngine.polygonToPath(pts);
      } else {
        const pts = [
          [x, y1],
          [x + sw, y1],
          [x + sw, y2],
          [x, y2]
        ];
        return _AmbigramEngine.polygonToPath(pts);
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
        upperPath: "",
        needsWaist: false,
        leftX,
        rightX
      };
      switch (ch) {
        case "A":
          bp.stems = ["left", "right"];
          bp.needsWaist = true;
          bp.upperPath = `M ${leftX} ${yMid} L ${cx - sw / 2} ${yTop + 15} L ${cx} ${yTop} L ${cx + sw / 2} ${yTop + 15} L ${rightX + sw} ${yMid} L ${rightX} ${yMid} L ${cx} ${yTop + 20} L ${leftX + sw} ${yMid} Z`;
          break;
        case "B":
        case "P":
        case "R":
          bp.stems = ["left"];
          bp.needsWaist = true;
          bp.upperPath = `M ${leftX} ${yTop} L ${rightX} ${yTop} C ${width} ${yTop}, ${width} ${yMid}, ${rightX} ${yMid} L ${leftX} ${yMid} L ${leftX} ${yMid - hsw} L ${rightX} ${yMid - hsw} C ${width - sw} ${yMid - hsw}, ${width - sw} ${yTop + hsw}, ${rightX} ${yTop + hsw} L ${leftX} ${yTop + hsw} Z`;
          break;
        case "C":
          bp.stems = ["left"];
          bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
          break;
        case "D":
        case "O":
        case "Q":
          bp.stems = ["left", "right"];
          bp.upperPath = `M ${leftX} ${yMid} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yMid} L ${rightX} ${yMid} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yMid} Z`;
          break;
        case "E":
        case "F":
          bp.stems = ["left"];
          bp.needsWaist = true;
          bp.upperPath = `M ${leftX} ${yTop} L ${rightX + sw} ${yTop} L ${rightX + sw} ${yTop + hsw} L ${leftX} ${yTop + hsw} Z`;
          break;
        case "G":
          bp.stems = ["left"];
          bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
          break;
        case "H":
          bp.stems = ["left", "right"];
          bp.needsWaist = true;
          break;
        case "I":
        case "1":
          bp.stems = ["center"];
          bp.upperPath = `M ${cx - 24} ${yTop} L ${cx + 24} ${yTop} L ${cx + 24} ${yTop + hsw} L ${cx - 24} ${yTop + hsw} Z`;
          break;
        case "J":
        case "L":
          bp.stems = ["left"];
          bp.upperPath = `M ${leftX - 8} ${yTop} L ${leftX + sw + 12} ${yTop} L ${leftX + sw + 12} ${yTop + hsw} L ${leftX - 8} ${yTop + hsw} Z`;
          break;
        case "K":
          bp.stems = ["left"];
          bp.needsWaist = true;
          bp.upperPath = `M ${leftX + sw} ${yMid} L ${rightX + sw} ${yTop} L ${rightX} ${yTop} L ${leftX + sw} ${yMid - 15} Z`;
          break;
        case "M":
          bp.stems = ["left", "center", "right"];
          bp.upperPath = `M ${leftX} ${yTop + 20} C ${leftX} ${yTop}, ${cx} ${yTop}, ${cx} ${yTop + 20} C ${cx} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 20} L ${rightX} ${yTop + 20} C ${rightX} ${yTop + hsw}, ${cx + sw / 2} ${yTop + hsw}, ${cx} ${yTop + 25} C ${cx - sw / 2} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 20} Z`;
          break;
        case "N":
          bp.stems = ["left", "right"];
          bp.upperPath = `M ${leftX} ${yTop + 25} C ${leftX} ${yTop}, ${rightX + sw} ${yTop}, ${rightX + sw} ${yTop + 25} L ${rightX} ${yTop + 25} C ${rightX} ${yTop + hsw}, ${leftX + sw} ${yTop + hsw}, ${leftX + sw} ${yTop + 25} Z`;
          break;
        case "S":
          bp.stems = [];
          bp.upperPath = `M ${rightX + sw} ${yTop + 25} C ${rightX + sw} ${yTop}, ${cx} ${yTop}, ${cx - 15} ${yTop + 10} C ${leftX} ${yTop + 25}, ${cx - 20} ${yMid - 10}, ${cx} ${yMid} L ${cx + 10} ${yMid} C ${cx - 10} ${yMid - 15}, ${leftX + sw} ${yTop + 25}, ${cx} ${yTop + hsw} C ${rightX} ${yTop + hsw}, ${rightX} ${yTop + 25}, ${rightX + sw} ${yTop + 25} Z`;
          break;
        case "T":
          bp.stems = ["center"];
          bp.upperPath = `M 15 ${yTop} L ${width - 15} ${yTop} L ${width - 15} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
          break;
        case "U":
        case "V":
        case "W":
        case "Y":
          bp.stems = ["left", "right"];
          break;
        case "X":
          bp.stems = [];
          bp.upperPath = `M ${leftX} ${yTop} L ${cx} ${yMid} L ${cx - sw / 2} ${yMid} L ${leftX} ${yTop + hsw} Z M ${rightX + sw} ${yTop} L ${cx} ${yMid} L ${cx + sw / 2} ${yMid} L ${rightX + sw} ${yTop + hsw} Z`;
          break;
        case "Z":
          bp.stems = [];
          bp.upperPath = `M 15 ${yTop} L ${width - 15} ${yTop} L ${width - 15} ${yTop + hsw} L ${cx + 15} ${yMid} L ${cx - 15} ${yMid} L ${width - 35} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
          break;
        default:
          bp.stems = ["left", "right"];
          break;
      }
      return bp;
    }
    generateFlourishes({ style, flourishType, totalWidth, totalHeight, strokeWidth }) {
      if (flourishType === "none") return "";
      const paths = [];
      const sw = strokeWidth * 0.5;
      const margin = 20;
      const left = -margin;
      const right = totalWidth + margin;
      const topY = -12;
      const cx = totalWidth / 2;
      const cy = totalHeight / 2;
      if (flourishType === "swashes") {
        const topSwash = `M ${left} ${topY + 15} C ${left + 50} ${topY - 12}, ${cx - 60} ${topY - 15}, ${cx} ${topY - 15} C ${cx + 60} ${topY - 15}, ${right - 50} ${topY - 12}, ${right} ${topY + 15} L ${right} ${topY + 15 + sw} C ${right - 50} ${topY - 12 + sw}, ${cx + 60} ${topY - 15 + sw}, ${cx} ${topY - 15 + sw} C ${cx - 60} ${topY - 15 + sw}, ${left + 50} ${topY - 12 + sw}, ${left} ${topY + 15 + sw} Z`;
        const botSwash = _AmbigramEngine.rotatePath180(topSwash, cx, cy);
        paths.push(topSwash, botSwash);
      } else if (flourishType === "frame") {
        const bW = 35;
        const bH = 25;
        const tl = `M ${left} ${topY + bH} L ${left} ${topY} L ${left + bW} ${topY} L ${left + bW} ${topY + sw} L ${left + sw} ${topY + sw} L ${left + sw} ${topY + bH} Z`;
        const tr = `M ${right - bW} ${topY} L ${right} ${topY} L ${right} ${topY + bH} L ${right - sw} ${topY + bH} L ${right - sw} ${topY + sw} L ${right - bW} ${topY + sw} Z`;
        const bl = _AmbigramEngine.rotatePath180(tr, cx, cy);
        const br = _AmbigramEngine.rotatePath180(tl, cx, cy);
        paths.push(tl, tr, bl, br);
      } else if (flourishType === "filigree") {
        const size = strokeWidth * 1.2;
        const l1 = [
          [left - size, cy],
          [left, cy - size],
          [left + size, cy],
          [left, cy + size]
        ];
        const r1 = [
          [right - size, cy],
          [right, cy - size],
          [right + size, cy],
          [right, cy + size]
        ];
        paths.push(_AmbigramEngine.polygonToPath(l1), _AmbigramEngine.polygonToPath(r1));
      }
      return paths.join(" ");
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
      "L_T": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const xStem = 24;
        const yTop = 25;
        const yBot = 175;
        const stem = `M ${xStem} ${yTop} L ${xStem + sw} ${yTop} L ${xStem + sw} ${yBot} L ${xStem} ${yBot} Z`;
        const topArm = `M ${xStem + sw} ${yTop} L ${xStem + sw + 35} ${yTop} L ${xStem + sw + 35} ${yTop + hsw} L ${xStem + sw} ${yTop + hsw} Z`;
        const topLeft = `M ${xStem - 16} ${yTop} L ${xStem} ${yTop} L ${xStem} ${yTop + hsw} L ${xStem - 16} ${yTop + hsw} Z`;
        const botFoot = `M ${xStem + sw} ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L ${xStem} ${yBot} Z`;
        return `${stem} ${topArm} ${topLeft} ${botFoot}`;
      },
      // -----------------------------------------------------------------------
      // L <-> A: Upright L, Inverted A
      // -----------------------------------------------------------------------
      "L_A": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const cx = w / 2;
        const yTop = 25;
        const yBot = 175;
        const yMid = 100;
        const xLeft = 20;
        const xRight = w - 20 - sw;
        const stem = `M ${xLeft} ${yTop} L ${xLeft + sw} ${yTop} L ${xLeft + sw} ${yBot} L ${xLeft} ${yBot} Z`;
        const foot = `M ${xLeft + sw} ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L ${xLeft + sw} ${yBot} Z`;
        const diagA = `M ${xRight} ${yMid} L ${cx} ${yTop} L ${cx + sw} ${yTop} L ${xRight + sw} ${yMid} Z`;
        const bar = `M ${xLeft + sw} ${yMid - hsw / 2} L ${xRight} ${yMid - hsw / 2} L ${xRight} ${yMid + hsw / 2} L ${xLeft + sw} ${yMid + hsw / 2} Z`;
        return `${stem} ${foot} ${diagA} ${bar}`;
      },
      // -----------------------------------------------------------------------
      // U <-> N: Classic Blackletter Uncial pair
      // Upright: N arch on top; Inverted: U basin on top
      // -----------------------------------------------------------------------
      "U_N": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const x1 = 20;
        const x2 = w - 20 - sw;
        const yTop = 25;
        const yBot = 175;
        const stem1 = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
        const stem2 = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot - 20} L ${x2} ${yBot - 20} Z`;
        const topArch = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
        const botBasin = `M ${x1} ${yBot - 20} C ${x1} ${yBot}, ${x2 + sw} ${yBot}, ${x2 + sw} ${yBot - 20} L ${x2 + sw - hsw} ${yBot - 20} C ${x2 + sw - hsw} ${yBot - hsw}, ${x1 + hsw} ${yBot - hsw}, ${x1 + hsw} ${yBot - 20} Z`;
        return `${stem1} ${stem2} ${topArch} ${botBasin}`;
      },
      // -----------------------------------------------------------------------
      // M <-> W: 3 minims crown / valley
      // -----------------------------------------------------------------------
      "M_W": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const x1 = 16;
        const x2 = w / 2 - sw / 2;
        const x3 = w - 16 - sw;
        const yTop = 25;
        const yBot = 175;
        const s1 = `M ${x1} ${yTop + 15} L ${x1 + sw} ${yTop + 15} L ${x1 + sw} ${yBot - 15} L ${x1} ${yBot - 15} Z`;
        const s2 = `M ${x2} ${yTop + 15} L ${x2 + sw} ${yTop + 15} L ${x2 + sw} ${yBot - 15} L ${x2} ${yBot - 15} Z`;
        const s3 = `M ${x3} ${yTop + 15} L ${x3 + sw} ${yTop + 15} L ${x3 + sw} ${yBot - 15} L ${x3} ${yBot - 15} Z`;
        const a1 = `M ${x1} ${yTop + 15} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 15} L ${x2} ${yTop + 15} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 15} Z`;
        const a2 = `M ${x2} ${yTop + 15} C ${x2} ${yTop}, ${x3 + sw} ${yTop}, ${x3 + sw} ${yTop + 15} L ${x3} ${yTop + 15} C ${x3} ${yTop + hsw}, ${x2 + sw} ${yTop + hsw}, ${x2 + sw} ${yTop + 15} Z`;
        const b1 = `M ${x1} ${yBot - 15} C ${x1} ${yBot}, ${x2 + sw} ${yBot}, ${x2 + sw} ${yBot - 15} L ${x2} ${yBot - 15} C ${x2} ${yBot - hsw}, ${x1 + sw} ${yBot - hsw}, ${x1 + sw} ${yBot - 15} Z`;
        const b2 = `M ${x2} ${yBot - 15} C ${x2} ${yBot}, ${x3 + sw} ${yBot}, ${x3 + sw} ${yBot - 15} L ${x3} ${yBot - 15} C ${x3} ${yBot - hsw}, ${x2 + sw} ${yBot - hsw}, ${x2 + sw} ${yBot - 15} Z`;
        return `${s1} ${s2} ${s3} ${a1} ${a2} ${b1} ${b2}`;
      },
      // -----------------------------------------------------------------------
      // M <-> I: Prominent center minim with Gothic flanking arches
      // -----------------------------------------------------------------------
      "M_I": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const cx = w / 2;
        const x1 = 18;
        const x2 = cx - sw / 2;
        const x3 = w - 18 - sw;
        const yTop = 25;
        const yBot = 175;
        const centerStem = `M ${x2} ${yTop} L ${x2 + sw} ${yTop} L ${x2 + sw} ${yBot} L ${x2} ${yBot} Z`;
        const topSerif = `M ${cx - 28} ${yTop} L ${cx + 28} ${yTop} L ${cx + 28} ${yTop + hsw} L ${cx - 28} ${yTop + hsw} Z`;
        const botSerif = `M ${cx - 28} ${yBot - hsw} L ${cx + 28} ${yBot - hsw} L ${cx + 28} ${yBot} L ${cx - 28} ${yBot} Z`;
        const leftMinim = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot - 40} L ${x1} ${yBot - 40} Z`;
        const rightMinim = `M ${x3} ${yTop + 40} L ${x3 + sw} ${yTop + 40} L ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} Z`;
        const archL = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
        const archR = `M ${x2} ${yBot - 20} C ${x2} ${yBot}, ${x3 + sw} ${yBot}, ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} C ${x3} ${yBot - hsw}, ${x2 + sw} ${yBot - hsw}, ${x2 + sw} ${yBot - 20} Z`;
        return `${centerStem} ${topSerif} ${botSerif} ${leftMinim} ${rightMinim} ${archL} ${archR}`;
      },
      // -----------------------------------------------------------------------
      // V <-> A: Chevron Apex pair
      // -----------------------------------------------------------------------
      "V_A": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const cx = w / 2;
        const yTop = 25;
        const yBot = 175;
        const yMid = 100;
        const leg1 = `M 15 ${yTop} L ${15 + sw} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
        const leg2 = `M ${w - 15} ${yTop} L ${w - 15 - sw} ${yTop} L ${cx - sw / 2} ${yBot} L ${cx + sw / 2} ${yBot} Z`;
        const bar = `M ${cx - 24} ${yMid - hsw / 2} L ${cx + 24} ${yMid - hsw / 2} L ${cx + 24} ${yMid + hsw / 2} L ${cx - 24} ${yMid + hsw / 2} Z`;
        return `${leg1} ${leg2} ${bar}`;
      },
      // -----------------------------------------------------------------------
      // C <-> R (from VICTORIA)
      // -----------------------------------------------------------------------
      "C_R": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const xStem = 20;
        const yTop = 25;
        const yBot = 175;
        const yMid = 100;
        const spine = `M ${xStem} ${yTop + 20} L ${xStem + sw} ${yTop + 20} L ${xStem + sw} ${yBot - 20} L ${xStem} ${yBot - 20} Z`;
        const topArm = `M ${xStem} ${yTop + 20} C ${xStem} ${yTop}, ${w - 15} ${yTop}, ${w - 15} ${yTop + 25} L ${w - 15 - sw} ${yTop + 25} C ${w - 15 - sw} ${yTop + hsw}, ${xStem + sw} ${yTop + hsw}, ${xStem + sw} ${yTop + 20} Z`;
        const midLoop = `M ${xStem + sw} ${yMid - hsw} L ${w - 15} ${yMid - hsw} C ${w} ${yMid - hsw}, ${w} ${yTop + 10}, ${w - 20} ${yTop + 10} L ${w - 20} ${yTop + 10 + hsw} C ${w - sw} ${yTop + 10 + hsw}, ${w - sw} ${yMid}, ${xStem + sw} ${yMid} Z`;
        const botLeg = `M ${xStem + sw} ${yMid} L ${w - 15} ${yBot} L ${w - 15 - sw} ${yBot} L ${xStem + sw} ${yMid + 15} Z`;
        return `${spine} ${topArm} ${midLoop} ${botLeg}`;
      },
      // -----------------------------------------------------------------------
      // T <-> O (from VICTORIA)
      // -----------------------------------------------------------------------
      "T_O": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const cx = w / 2;
        const cy = h / 2;
        const yTop = 25;
        const yBot = 175;
        const topBar = `M 15 ${yTop} L ${w - 15} ${yTop} L ${w - 15} ${yTop + hsw} L 15 ${yTop + hsw} Z`;
        const centerStem = `M ${cx - sw / 2} ${yTop} L ${cx + sw / 2} ${yTop} L ${cx + sw / 2} ${yBot} L ${cx - sw / 2} ${yBot} Z`;
        const botBar = `M 15 ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L 15 ${yBot} Z`;
        const leftArc = `M 15 ${yTop} C 5 ${cy}, 5 ${cy}, 15 ${yBot} L ${15 + hsw} ${yBot} C ${5 + hsw} ${cy}, ${5 + hsw} ${cy}, ${15 + hsw} ${yTop} Z`;
        const rightArc = `M ${w - 15} ${yTop} C ${w - 5} ${cy}, ${w - 5} ${cy}, ${w - 15} ${yBot} L ${w - 15 - hsw} ${yBot} C ${w - 5 - hsw} ${cy}, ${w - 5 - hsw} ${cy}, ${w - 15 - hsw} ${yTop} Z`;
        return `${topBar} ${centerStem} ${botBar} ${leftArc} ${rightArc}`;
      },
      // -----------------------------------------------------------------------
      // B <-> Q / D <-> P
      // -----------------------------------------------------------------------
      "D_P": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const xStem = 22;
        const yTop = 25;
        const yBot = 175;
        const yMid = 100;
        const stem = `M ${xStem} ${yTop} L ${xStem + sw} ${yTop} L ${xStem + sw} ${yBot} L ${xStem} ${yBot} Z`;
        const bowl = `M ${xStem + sw} ${yTop + 10} C ${w + 5} ${yTop + 10}, ${w + 5} ${yBot - 10}, ${xStem + sw} ${yBot - 10} L ${xStem + sw} ${yBot - 10 - hsw} C ${w - sw} ${yBot - 10 - hsw}, ${w - sw} ${yTop + 10 + hsw}, ${xStem + sw} ${yTop + 10 + hsw} Z`;
        return `${stem} ${bowl}`;
      },
      // -----------------------------------------------------------------------
      // M <-> C (from MAGIC)
      // -----------------------------------------------------------------------
      "M_C": (w, h, sw, contrast, style) => {
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
      "A_I": (w, h, sw, contrast, style) => {
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
      "S": (w, h, sw, contrast, style) => {
        const cx = w / 2;
        const cy = h / 2;
        const yTop = 25;
        const yBot = 175;
        const xR = w - 20;
        const xL = 20;
        return `M ${xR} ${yTop + 35} C ${xR} ${yTop}, ${cx} ${yTop}, ${cx - 15} ${yTop + 10} C ${xL} ${yTop + 25}, ${cx - 25} ${cy - 12}, ${cx} ${cy} C ${cx + 25} ${cy + 12}, ${xR} ${yBot - 25}, ${cx + 15} ${yBot - 10} C ${cx} ${yBot}, ${xL} ${yBot}, ${xL} ${yBot - 35} L ${xL + sw} ${yBot - 35} C ${xL + sw} ${yBot - 12}, ${cx} ${yBot - 12}, ${cx + 15} ${yBot - 22} C ${xR - sw} ${yBot - 35}, ${cx + 15} ${cy + 10}, ${cx} ${cy} C ${cx - 15} ${cy - 10}, ${xL + sw} ${yTop + 35}, ${cx - 15} ${yTop + 22} C ${cx} ${yTop + 12}, ${xR - sw} ${yTop + 12}, ${xR - sw} ${yTop + 35} Z`;
      },
      // -----------------------------------------------------------------------
      // N: Symmetrical N with point-symmetric diagonal
      // -----------------------------------------------------------------------
      "N": (w, h, sw, contrast, style) => {
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
      "O": (w, h, sw, contrast, style) => {
        const cx = w / 2;
        const cy = h / 2;
        const rx = w / 2 - 18;
        const ry = (h - 50) / 2;
        const irx = rx - sw;
        const iry = ry - sw / contrast;
        return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy + ry} A ${rx} ${ry} 0 1 0 ${cx} ${cy - ry} Z M ${cx} ${cy - iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy + iry} A ${irx} ${iry} 0 1 1 ${cx} ${cy - iry} Z`;
      },
      // -----------------------------------------------------------------------
      // I: Central minim with balanced serifs
      // -----------------------------------------------------------------------
      "I": (w, h, sw, contrast, style) => {
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
      "H": (w, h, sw, contrast, style) => {
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
      "X": (w, h, sw, contrast, style) => {
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
      "Z": (w, h, sw, contrast, style) => {
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
      "G": (w, h, sw, contrast, style) => {
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
        const spurBot = `M ${cx} ${cy + 10} L ${x2} ${cy + 10} L ${x2} ${yBot - 25} L ${x2 - sw} ${yBot - 25} L ${x2 - sw} ${cy + 10 + hsw} L ${cx} ${cy + 10 + hsw} Z`;
        const spurTop = _AmbigramEngine.rotatePath180(spurBot, cx, cy);
        return `${spine} ${topArm} ${botArm} ${spurBot} ${spurTop}`;
      },
      // -----------------------------------------------------------------------
      // A: 180° Point-Symmetric A
      // -----------------------------------------------------------------------
      "A": (w, h, sw, contrast, style) => {
        const hsw = Math.max(9, sw / contrast);
        const cx = w / 2;
        const cy = h / 2;
        const yTop = 25;
        const yBot = 175;
        const x1 = 20;
        const x2 = w - 20;
        const l1 = `M ${cx} ${yTop} L ${x2} ${yBot} L ${x2 - sw} ${yBot} L ${cx - sw / 2} ${yTop + 20} Z`;
        const l2 = `M ${cx} ${yTop} L ${x1} ${yBot} L ${x1 + sw} ${yBot} L ${cx + sw / 2} ${yTop + 20} Z`;
        const bar = `M ${x1 + 15} ${cy - hsw / 2} L ${x2 - 15} ${cy - hsw / 2} L ${x2 - 15} ${cy + hsw / 2} L ${x1 + 15} ${cy + hsw / 2} Z`;
        return `${l1} ${l2} ${bar}`;
      }
    };
  };

  // js/vector-renderer.js
  var VectorRenderer = class {
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
      scaleFactor = 1,
      opticalCenter = true
    }) {
      const rawBounds = ambigramResult.bounds;
      const availWidth = Math.max(10, canvasWidth - 2 * marginMm);
      const availHeight = Math.max(10, canvasHeight - 2 * marginMm);
      const fitScaleX = availWidth / (rawBounds.width || 100);
      const fitScaleY = availHeight / (rawBounds.height || 100);
      const baseFitScale = Math.min(fitScaleX, fitScaleY) * 0.85;
      const finalScale = baseFitScale * scaleFactor;
      const scaledW = rawBounds.width * finalScale;
      const scaledH = rawBounds.height * finalScale;
      const targetCenterX = canvasWidth / 2;
      const opticalOffset = opticalCenter ? canvasHeight * -0.025 : 0;
      const targetCenterY = canvasHeight / 2 + opticalOffset;
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
      if (!rawPathData) return "";
      const { scale, originX, originY } = transform;
      return rawPathData.replace(/([MLCSTQAZVHm])([^A-DF-Za-df-z]*)/gi, (fullMatch, cmd, coordsStr) => {
        const numbers = coordsStr.trim().split(/[\s,]+/).filter(Boolean).map(Number);
        const isRel = cmd === cmd.toLowerCase();
        const uCmd = cmd.toUpperCase();
        if (uCmd === "Z" || isRel) return fullMatch;
        if (uCmd === "H") {
          return "H " + numbers.map((x) => (x * scale + originX).toFixed(2)).join(" ");
        }
        if (uCmd === "V") {
          return "V " + numbers.map((y) => (y * scale + originY).toFixed(2)).join(" ");
        }
        const transformed = [];
        for (let i = 0; i < numbers.length; i += 2) {
          const x = numbers[i];
          const y = numbers[i + 1];
          if (x !== void 0 && y !== void 0) {
            transformed.push((x * scale + originX).toFixed(2), (y * scale + originY).toFixed(2));
          }
        }
        return uCmd + " " + transformed.join(" ");
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
      theme = "dark",
      renderMode = "filled"
      // 'filled', 'outline', 'both'
    }) {
      const { width, height, unit } = canvasDimensions;
      const { centerX, centerY } = canvasTransform;
      const themeStyles = {
        dark: {
          canvasBg: "#0f172a",
          canvasBorder: "#334155",
          marginGuide: "#1e293b",
          textColor: "#f8fafc",
          cutStroke: "#f43f5e",
          guideColor: "#38bdf8"
        },
        paper: {
          canvasBg: "#ffffff",
          canvasBorder: "#cbd5e1",
          marginGuide: "#f1f5f9",
          textColor: "#0f172a",
          cutStroke: "#e11d48",
          guideColor: "#6366f1"
        },
        blueprint: {
          canvasBg: "#0b192c",
          canvasBorder: "#1e3e62",
          marginGuide: "#142942",
          textColor: "#00ffff",
          cutStroke: "#ff204e",
          guideColor: "#00d2df"
        },
        parchment: {
          canvasBg: "#fef3c7",
          canvasBorder: "#d97706",
          marginGuide: "#fde68a",
          textColor: "#451a03",
          cutStroke: "#b91c1c",
          guideColor: "#b45309"
        }
      };
      const currentTheme = themeStyles[theme] || themeStyles.dark;
      let pathStyleAttr = "";
      if (renderMode === "outline") {
        pathStyleAttr = `fill="none" stroke="${currentTheme.cutStroke}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"`;
      } else if (renderMode === "both") {
        pathStyleAttr = `fill="${currentTheme.textColor}" stroke="${currentTheme.cutStroke}" stroke-width="0.3" stroke-linecap="round" stroke-linejoin="round"`;
      } else {
        pathStyleAttr = `fill="${currentTheme.textColor}" stroke="none" fill-rule="nonzero"`;
      }
      let guidesMarkup = "";
      if (showGuides) {
        guidesMarkup = `
        <!-- Printable Margin Guide -->
        <rect x="20" y="20" width="${Math.max(1, width - 40)}" height="${Math.max(1, height - 40)}"
              fill="none" stroke="${currentTheme.guideColor}" stroke-width="0.3" stroke-dasharray="3,3" opacity="0.35" />
      `;
      }
      let pivotMarkup = "";
      if (showCenterPivot) {
        pivotMarkup = `
        <!-- Rotational 180\xB0 Center Pivot -->
        <g id="preview-pivot" opacity="0.65">
          <circle cx="${centerX}" cy="${centerY}" r="4" fill="none" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <line x1="${centerX - 7}" y1="${centerY}" x2="${centerX + 7}" y2="${centerY}" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <line x1="${centerX}" y1="${centerY - 7}" x2="${centerX}" y2="${centerY + 7}" stroke="${currentTheme.guideColor}" stroke-width="0.4" />
          <text x="${centerX + 6}" y="${centerY - 6}" fill="${currentTheme.guideColor}" font-size="3" font-family="monospace">180\xB0 PIVOT</text>
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
      this.rotationDeg = this.rotationDeg === 0 ? 180 : 0;
      const svg = this.container.querySelector("#ambigram-canvas-svg");
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
      const svg = this.container.querySelector("#ambigram-canvas-svg");
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
      const snap = this.rotationDeg > 90 && this.rotationDeg < 270 ? 180 : 0;
      this.setRotation(snap);
    }
  };

  // js/canvas-sizes.js
  var CANVAS_SIZES = {
    "A4": {
      id: "A4",
      name: "A4 (International)",
      standard: "ISO 216",
      widthMm: 210,
      heightMm: 297,
      unit: "mm",
      description: "Standard global document size (210 \xD7 297 mm)"
    },
    "A3": {
      id: "A3",
      name: "A3 (International Poster)",
      standard: "ISO 216",
      widthMm: 297,
      heightMm: 420,
      unit: "mm",
      description: "Double A4 poster size (297 \xD7 420 mm)"
    },
    "A5": {
      id: "A5",
      name: "A5 (International Booklet)",
      standard: "ISO 216",
      widthMm: 148,
      heightMm: 210,
      unit: "mm",
      description: "Half A4 booklet size (148 \xD7 210 mm)"
    },
    "US_LETTER": {
      id: "US_LETTER",
      name: "US Letter",
      standard: "ANSI A",
      widthMm: 215.9,
      heightMm: 279.4,
      unit: "mm",
      displayInches: "8.5 \xD7 11 in",
      description: "Standard North American paper size (8.5 \xD7 11 in)"
    },
    "US_LEGAL": {
      id: "US_LEGAL",
      name: "US Legal",
      standard: "ANSI",
      widthMm: 215.9,
      heightMm: 355.6,
      unit: "mm",
      displayInches: "8.5 \xD7 14 in",
      description: "Extended North American legal size (8.5 \xD7 14 in)"
    },
    "US_TABLOID": {
      id: "US_TABLOID",
      name: "US Tabloid / Ledger",
      standard: "ANSI B",
      widthMm: 279.4,
      heightMm: 431.8,
      unit: "mm",
      displayInches: "11 \xD7 17 in",
      description: "North American ledger/poster size (11 \xD7 17 in)"
    },
    "US_JUNIOR_LEGAL": {
      id: "US_JUNIOR_LEGAL",
      name: "US Junior Legal",
      standard: "ANSI",
      widthMm: 127,
      heightMm: 203.2,
      unit: "mm",
      displayInches: "5 \xD7 8 in",
      description: "Notepad memo format (5 \xD7 8 in)"
    },
    "VINYL_12": {
      id: "VINYL_12",
      name: '12" Vinyl / Cricut Mat',
      standard: "Craft / Laser",
      widthMm: 304.8,
      heightMm: 304.8,
      unit: "mm",
      displayInches: "12 \xD7 12 in",
      description: "Standard vinyl cutter & laser square bed (12 \xD7 12 in)"
    },
    "SQUARE_300": {
      id: "SQUARE_300",
      name: "Square 300 mm",
      standard: "Metric Craft",
      widthMm: 300,
      heightMm: 300,
      unit: "mm",
      displayInches: "11.8 \xD7 11.8 in",
      description: "Metric square sheet (300 \xD7 300 mm)"
    },
    "CUSTOM": {
      id: "CUSTOM",
      name: "Custom Dimensions",
      standard: "User Defined",
      widthMm: 210,
      heightMm: 297,
      unit: "mm",
      description: "Custom user-specified width and height"
    }
  };
  function resolveCanvasDimensions({
    sizeId = "A4",
    orientation = "landscape",
    // or 'portrait'
    customWidth = 210,
    customHeight = 297,
    customUnit = "mm"
  }) {
    let baseWidth = 210;
    let baseHeight = 297;
    let unit = "mm";
    if (sizeId === "CUSTOM") {
      unit = customUnit;
      baseWidth = customWidth;
      baseHeight = customHeight;
    } else {
      const preset = CANVAS_SIZES[sizeId] || CANVAS_SIZES["A4"];
      baseWidth = preset.widthMm;
      baseHeight = preset.heightMm;
      unit = preset.unit;
    }
    let finalWidth = baseWidth;
    let finalHeight = baseHeight;
    if (orientation === "landscape") {
      finalWidth = Math.max(baseWidth, baseHeight);
      finalHeight = Math.min(baseWidth, baseHeight);
    } else {
      finalWidth = Math.min(baseWidth, baseHeight);
      finalHeight = Math.max(baseWidth, baseHeight);
    }
    return {
      width: finalWidth,
      height: finalHeight,
      unit,
      orientation,
      aspectRatio: finalWidth / finalHeight
    };
  }

  // js/exporters/svg-exporter.js
  var SvgExporter = class {
    /**
     * Export ambigram paths as a standalone SVG document
     * @param {Object} options
     * @param {string} options.pathData - Combined SVG path 'd' string
     * @param {number} options.canvasWidth - Canvas width in physical units (mm or in)
     * @param {number} options.canvasHeight - Canvas height in physical units (mm or in)
     * @param {string} [options.unit='mm'] - Unit of measurement ('mm', 'in', 'px')
     * @param {string} [options.exportMode='filled'] - 'filled', 'outline', or 'both'
     * @param {string} [options.fillColor='#111111'] - Fill color for letters
     * @param {string} [options.strokeColor='#e11d48'] - Laser cut stroke color
     * @param {boolean} [options.includeBorder=false] - Whether to include canvas border
     * @param {boolean} [options.includeCenterMark=false] - Registration mark at rotation center
     * @param {Object} [options.metadata] - Informational metadata
     * @returns {string} Clean SVG XML document
     */
    static exportToSvg({
      pathData,
      canvasWidth,
      canvasHeight,
      unit = "mm",
      exportMode = "filled",
      fillColor = "#111111",
      strokeColor = "#e11d48",
      strokeWidth = "0.1mm",
      includeBorder = false,
      includeCenterMark = false,
      metadata = {}
    }) {
      const title = metadata.title || "Ambigram Vector Export";
      const text1 = metadata.text1 || "";
      const text2 = metadata.text2 || "";
      const style = metadata.style || "Gothic Textura";
      const date = (/* @__PURE__ */ new Date()).toISOString();
      let pathAttributes = "";
      if (exportMode === "outline") {
        pathAttributes = `fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
      } else if (exportMode === "both") {
        pathAttributes = `fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
      } else {
        pathAttributes = `fill="${fillColor}" stroke="none" fill-rule="nonzero"`;
      }
      const borderElement = includeBorder ? `  <!-- Canvas Border / Sheet Edge -->
  <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="none" stroke="#94a3b8" stroke-width="0.25mm" stroke-dasharray="2,2" />
` : "";
      const centerMark = includeCenterMark ? `  <!-- Center of Rotation Pivot Mark -->
  <g id="Center-Pivot-Registration" stroke="#3b82f6" stroke-width="0.2mm" opacity="0.6">
    <line x1="${canvasWidth / 2 - 5}" y1="${canvasHeight / 2}" x2="${canvasWidth / 2 + 5}" y2="${canvasHeight / 2}" />
    <line x1="${canvasWidth / 2}" y1="${canvasHeight / 2 - 5}" x2="${canvasWidth / 2}" y2="${canvasHeight / 2 + 5}" />
    <circle cx="${canvasWidth / 2}" cy="${canvasHeight / 2}" r="3" fill="none" />
  </g>
` : "";
      return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${canvasWidth} ${canvasHeight}"
  width="${canvasWidth}${unit}"
  height="${canvasHeight}${unit}"
  version="1.1"
>
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
             xmlns:dc="http://purl.org/dc/elements/1.1/">
      <rdf:Description>
        <dc:title>${title}</dc:title>
        <dc:creator>Double-Worder Ambigram Studio</dc:creator>
        <dc:date>${date}</dc:date>
        <dc:description>Ambigram for: "${text1}" ${text2 ? `/ "${text2}"` : ""} [${style}]</dc:description>
        <dc:format>image/svg+xml</dc:format>
      </rdf:Description>
    </rdf:RDF>
  </metadata>

  <defs>
    <style type="text/css">
      .ambigram-shape {
        shape-rendering: geometricPrecision;
      }
    </style>
  </defs>

${borderElement}${centerMark}  <!-- Ambigram Vector Glyph Paths -->
  <g id="Ambigram-Layer" class="ambigram-shape">
    <path d="${pathData}" ${pathAttributes} />
  </g>
</svg>`;
    }
    /**
     * Helper to trigger a browser file download
     */
    static triggerDownload(content, filename, mimeType = "image/svg+xml") {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2e3);
    }
  };

  // js/exporters/dxf-exporter.js
  var DxfExporter = class _DxfExporter {
    /**
     * Discretize a cubic Bezier curve into points
     */
    static sampleCubicBezier(p0, p1, p2, p3, steps = 12) {
      const pts = [];
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
        const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
        pts.push([x, y]);
      }
      return pts;
    }
    /**
     * Parse standard SVG path data (M, L, C, Z, etc.) into closed coordinate loops
     * @param {string} pathData SVG path 'd' string
     * @returns {Array<Array<[number, number]>>} Array of closed point loops
     */
    static pathDataToPolygons(pathData) {
      const loops = [];
      let currentLoop = [];
      let curX = 0;
      let curY = 0;
      const tokens = pathData.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
      if (!tokens) return loops;
      let i = 0;
      let cmd = "";
      while (i < tokens.length) {
        const token = tokens[i];
        if (/^[a-df-z]$/i.test(token)) {
          cmd = token;
          i++;
        }
        switch (cmd) {
          case "M": {
            if (currentLoop.length > 2) {
              loops.push(currentLoop);
            }
            currentLoop = [];
            curX = parseFloat(tokens[i++]);
            curY = parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            cmd = "L";
            break;
          }
          case "m": {
            if (currentLoop.length > 2) {
              loops.push(currentLoop);
            }
            currentLoop = [];
            curX += parseFloat(tokens[i++]);
            curY += parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            cmd = "l";
            break;
          }
          case "L": {
            curX = parseFloat(tokens[i++]);
            curY = parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "l": {
            curX += parseFloat(tokens[i++]);
            curY += parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "H": {
            curX = parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "h": {
            curX += parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "V": {
            curY = parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "v": {
            curY += parseFloat(tokens[i++]);
            currentLoop.push([curX, curY]);
            break;
          }
          case "C": {
            const cp1x = parseFloat(tokens[i++]);
            const cp1y = parseFloat(tokens[i++]);
            const cp2x = parseFloat(tokens[i++]);
            const cp2y = parseFloat(tokens[i++]);
            const x = parseFloat(tokens[i++]);
            const y = parseFloat(tokens[i++]);
            const sampled = _DxfExporter.sampleCubicBezier(
              [curX, curY],
              [cp1x, cp1y],
              [cp2x, cp2y],
              [x, y],
              12
            );
            currentLoop.push(...sampled);
            curX = x;
            curY = y;
            break;
          }
          case "c": {
            const cp1x = curX + parseFloat(tokens[i++]);
            const cp1y = curY + parseFloat(tokens[i++]);
            const cp2x = curX + parseFloat(tokens[i++]);
            const cp2y = curY + parseFloat(tokens[i++]);
            const x = curX + parseFloat(tokens[i++]);
            const y = curY + parseFloat(tokens[i++]);
            const sampled = _DxfExporter.sampleCubicBezier(
              [curX, curY],
              [cp1x, cp1y],
              [cp2x, cp2y],
              [x, y],
              12
            );
            currentLoop.push(...sampled);
            curX = x;
            curY = y;
            break;
          }
          case "Z":
          case "z": {
            if (currentLoop.length > 2) {
              loops.push(currentLoop);
            }
            currentLoop = [];
            break;
          }
          default:
            i++;
            break;
        }
      }
      if (currentLoop.length > 2) {
        loops.push(currentLoop);
      }
      return loops;
    }
    /**
     * Generate DXF text for a collection of path strings or polygon loops
     * @param {Object} options
     * @param {Array<string>|Array<Array<[number, number]>>} options.paths - SVG path strings or arrays of points
     * @param {number} options.canvasWidth - Canvas width in physical units (e.g. mm)
     * @param {number} options.canvasHeight - Canvas height in physical units (e.g. mm)
     * @param {string} [options.unit='mm'] - 'mm' or 'in'
     * @param {string} [options.layerName='AMBIGRAM_CUT'] - Layer name for laser/CNC
     * @returns {string} Complete AutoCAD R12 DXF ASCII text
     */
    static exportToDxf({
      paths = [],
      canvasWidth = 210,
      canvasHeight = 297,
      unit = "mm",
      layerName = "AMBIGRAM_CUT"
    }) {
      const insUnits = unit === "in" ? 1 : 4;
      const lines = [];
      const push = (code, val) => {
        lines.push(code.toString().padStart(3, " "));
        lines.push(val.toString());
      };
      push(0, "SECTION");
      push(2, "HEADER");
      push(9, "$ACADVER");
      push(1, "AC1009");
      push(9, "$INSUNITS");
      push(70, insUnits);
      push(9, "$MEASUREMENT");
      push(70, unit === "in" ? 0 : 1);
      push(9, "$EXTMIN");
      push(10, "0.0");
      push(20, "0.0");
      push(30, "0.0");
      push(9, "$EXTMAX");
      push(10, canvasWidth.toFixed(4));
      push(20, canvasHeight.toFixed(4));
      push(30, "0.0");
      push(0, "ENDSEC");
      push(0, "SECTION");
      push(2, "TABLES");
      push(0, "TABLE");
      push(2, "LTYPE");
      push(70, 1);
      push(0, "LTYPE");
      push(2, "CONTINUOUS");
      push(70, 0);
      push(3, "Solid line");
      push(72, 65);
      push(73, 0);
      push(40, "0.0");
      push(0, "ENDTAB");
      push(0, "TABLE");
      push(2, "LAYER");
      push(70, 2);
      push(0, "LAYER");
      push(2, "0");
      push(70, 0);
      push(62, 7);
      push(6, "CONTINUOUS");
      push(0, "LAYER");
      push(2, layerName);
      push(70, 0);
      push(62, 1);
      push(6, "CONTINUOUS");
      push(0, "ENDTAB");
      push(0, "ENDSEC");
      push(0, "SECTION");
      push(2, "BLOCKS");
      push(0, "ENDSEC");
      push(0, "SECTION");
      push(2, "ENTITIES");
      push(0, "POLYLINE");
      push(8, "CANVAS_BOUNDARY");
      push(66, 1);
      push(70, 1);
      push(10, "0.0");
      push(20, "0.0");
      push(30, "0.0");
      const borderCorners = [
        [0, 0],
        [canvasWidth, 0],
        [canvasWidth, canvasHeight],
        [0, canvasHeight]
      ];
      for (const [bx, by] of borderCorners) {
        push(0, "VERTEX");
        push(8, "CANVAS_BOUNDARY");
        push(10, bx.toFixed(4));
        push(20, by.toFixed(4));
        push(30, "0.0");
      }
      push(0, "SEQEND");
      push(8, "CANVAS_BOUNDARY");
      const allLoops = [];
      for (const p of paths) {
        if (typeof p === "string") {
          const extracted = _DxfExporter.pathDataToPolygons(p);
          allLoops.push(...extracted);
        } else if (Array.isArray(p)) {
          allLoops.push(p);
        }
      }
      for (const loop of allLoops) {
        if (loop.length < 2) continue;
        push(0, "POLYLINE");
        push(8, layerName);
        push(66, 1);
        push(70, 1);
        push(10, "0.0");
        push(20, "0.0");
        push(30, "0.0");
        for (const pt of loop) {
          const cadX = pt[0];
          const cadY = canvasHeight - pt[1];
          push(0, "VERTEX");
          push(8, layerName);
          push(10, cadX.toFixed(4));
          push(20, cadY.toFixed(4));
          push(30, "0.0");
        }
        push(0, "SEQEND");
        push(8, layerName);
      }
      push(0, "ENDSEC");
      push(0, "EOF");
      return lines.join("\n");
    }
  };

  // js/exporters/png-exporter.js
  var PngExporter = class _PngExporter {
    /**
     * Export SVG path / SVG string as high-resolution PNG
     * @param {Object} options
     * @param {string} options.svgString - Valid SVG string
     * @param {number} options.widthMm - Physical width in mm
     * @param {number} options.heightMm - Physical height in mm
     * @param {number} [options.dpi=300] - Output DPI
     * @param {string} [options.backgroundColor='#ffffff'] - Canvas background
     * @returns {Promise<Blob>} PNG Blob
     */
    static async exportToPngBlob({
      svgString,
      widthMm,
      heightMm,
      dpi = 300,
      backgroundColor = "#ffffff"
    }) {
      const pixelWidth = Math.round(widthMm / 25.4 * dpi);
      const pixelHeight = Math.round(heightMm / 25.4 * dpi);
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext("2d");
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);
      }
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      return new Promise((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
          URL.revokeObjectURL(url);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate PNG blob from canvas"));
            }
          }, "image/png");
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });
    }
    /**
     * Trigger PNG download directly
     */
    static async downloadPng(options, filename) {
      const blob = await _PngExporter.exportToPngBlob(options);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2e3);
    }
  };

  // js/presets.js
  var PRESETS = [
    {
      id: "illuminati",
      title: "Illuminati",
      text1: "ILLUMINATI",
      text2: "",
      style: "gothic",
      description: "The historic Angels & Demons blackletter ambigram. Rotates 180\xB0 into itself.",
      strokeWidth: 20,
      contrast: 2,
      flourishes: "swashes",
      letterSpacing: 10
    },
    {
      id: "victoria",
      title: "Victoria",
      text1: "VICTORIA",
      text2: "",
      style: "roman",
      description: "Chiseled imperial lettering with elegant balance across V-A, I-I, C-R, T-O.",
      strokeWidth: 16,
      contrast: 2.2,
      flourishes: "filigree",
      letterSpacing: 14
    },
    {
      id: "magic",
      title: "Magic",
      text1: "MAGIC",
      text2: "",
      style: "geometric",
      description: "Five-letter rotational ambigram with central self-symmetric G.",
      strokeWidth: 18,
      contrast: 1.5,
      flourishes: "frame",
      letterSpacing: 16
    },
    {
      id: "philip",
      title: "Philip",
      text1: "PHILIP",
      text2: "",
      style: "gothic",
      description: "Six-letter rotational harmony pairing P-P, H-I, I-L.",
      strokeWidth: 18,
      contrast: 1.9,
      flourishes: "swashes",
      letterSpacing: 12
    },
    {
      id: "angel-devil",
      title: "Angel / Devil",
      text1: "ANGEL",
      text2: "DEVIL",
      style: "gothic",
      description: "Dual-word ambigram: reads ANGEL right-side up and DEVIL when rotated 180\xB0!",
      strokeWidth: 20,
      contrast: 2.1,
      flourishes: "swashes",
      letterSpacing: 14
    },
    {
      id: "faith-hope",
      title: "Faith / Hope",
      text1: "FAITH",
      text2: "HOPE",
      style: "roman",
      description: "Dual-word ambigram: reads FAITH right-side up and HOPE upside-down.",
      strokeWidth: 18,
      contrast: 1.8,
      flourishes: "frame",
      letterSpacing: 12
    },
    {
      id: "swims",
      title: "SWIMS",
      text1: "SWIMS",
      text2: "",
      style: "geometric",
      description: "Natural rotational ambigram with natural S, W-M, and I symmetry.",
      strokeWidth: 16,
      contrast: 1.2,
      flourishes: "none",
      letterSpacing: 20
    },
    {
      id: "dragon",
      title: "Dragon",
      text1: "DRAGON",
      text2: "",
      style: "stencil",
      description: "Cut-ready stencil ambigram engineered for laser cutting without loose counters.",
      strokeWidth: 22,
      contrast: 1.6,
      flourishes: "frame",
      letterSpacing: 14
    }
  ];

  // js/app.js
  var AmbigramApp = class {
    constructor() {
      this.engine = new AmbigramEngine();
      this.state = {
        text: "ILLUMINATI",
        secondaryText: "",
        isDualWord: false,
        sizeId: "A4",
        orientation: "landscape",
        customWidth: 210,
        customHeight: 297,
        customUnit: "mm",
        style: "gothic",
        strokeWidth: 20,
        contrast: 2,
        letterSpacing: 10,
        slant: 0,
        flourishes: "swashes",
        theme: "dark",
        renderMode: "filled",
        showGuides: true,
        showCenterPivot: true,
        marginMm: 20,
        scaleFactor: 1,
        opticalCenter: true,
        viewMode: "single",
        // 'single' or 'split'
        exportHairline: false,
        includeBorder: false,
        includePivotMark: false
      };
      this.currentResult = null;
      this.currentCanvasDims = null;
      this.currentCanvasTransform = null;
      this.currentPositionedPath = "";
      this.initElements();
      this.loadStateFromUrl();
      this.initRenderer();
      this.setTheme(this.state.theme);
      this.bindEvents();
      this.renderPresets();
      this.update();
    }
    initElements() {
      this.elText = document.getElementById("input-text");
      this.elSecondaryText = document.getElementById("input-secondary-text");
      this.elSecondaryGroup = document.getElementById("group-secondary-text");
      this.elDualWordToggle = document.getElementById("toggle-dual-word");
      this.elCanvasSize = document.getElementById("select-canvas-size");
      this.elOrientationLandscape = document.getElementById("btn-orient-landscape");
      this.elOrientationPortrait = document.getElementById("btn-orient-portrait");
      this.elCustomSizeGroup = document.getElementById("group-custom-size");
      this.elCustomWidth = document.getElementById("input-custom-width");
      this.elCustomHeight = document.getElementById("input-custom-height");
      this.elCustomUnit = document.getElementById("select-custom-unit");
      this.elCanvasBadge = document.getElementById("canvas-dimension-badge");
      this.elStyleButtons = document.querySelectorAll("[data-style]");
      this.elStrokeWidth = document.getElementById("slider-stroke-width");
      this.elStrokeWidthVal = document.getElementById("val-stroke-width");
      this.elContrast = document.getElementById("slider-contrast");
      this.elContrastVal = document.getElementById("val-contrast");
      this.elSpacing = document.getElementById("slider-spacing");
      this.elSpacingVal = document.getElementById("val-spacing");
      this.elSlant = document.getElementById("slider-slant");
      this.elSlantVal = document.getElementById("val-slant");
      this.elFlourishes = document.getElementById("select-flourishes");
      this.elMargin = document.getElementById("slider-margin");
      this.elMarginVal = document.getElementById("val-margin");
      this.elScale = document.getElementById("slider-scale");
      this.elScaleVal = document.getElementById("val-scale");
      this.elThemeButtons = document.querySelectorAll(".theme-btn[data-theme]");
      this.elRenderMode = document.getElementById("select-render-mode");
      this.elToggleGuides = document.getElementById("toggle-guides");
      this.elTogglePivot = document.getElementById("toggle-pivot");
      this.elBtnFlip = document.getElementById("btn-flip-180");
      this.elBtnSpin = document.getElementById("btn-spin");
      this.elBtnSplit = document.getElementById("btn-split-view");
      this.elRotationBadge = document.getElementById("rotation-badge");
      this.elCanvasContainer = document.getElementById("canvas-container");
      this.elSplitSecondaryContainer = document.getElementById("canvas-container-inverted");
      this.elSplitWrapper = document.getElementById("split-canvas-wrapper");
      this.elPairsStrip = document.getElementById("letter-pairs-strip");
      this.elPresetsList = document.getElementById("presets-chips");
      this.elBtnExportSvg = document.getElementById("btn-export-svg");
      this.elBtnExportDxf = document.getElementById("btn-export-dxf");
      this.elBtnExportPng = document.getElementById("btn-export-png");
      this.elBtnCopySvg = document.getElementById("btn-copy-svg");
      this.elToast = document.getElementById("toast-notification");
    }
    initRenderer() {
      this.renderer = new VectorRenderer(this.elCanvasContainer);
      if (this.elSplitSecondaryContainer) {
        this.invertedRenderer = new VectorRenderer(this.elSplitSecondaryContainer);
        this.invertedRenderer.setRotation(180);
      }
    }
    setTheme(themeName) {
      const validThemes = ["dark", "paper", "blueprint", "parchment"];
      const theme = validThemes.includes(themeName) ? themeName : "dark";
      this.state.theme = theme;
      document.documentElement.setAttribute("data-theme", theme);
      document.body.setAttribute("data-theme", theme);
      if (this.elThemeButtons) {
        this.elThemeButtons.forEach((btn) => {
          const isMatch = btn.getAttribute("data-theme") === theme;
          btn.classList.toggle("active", isMatch);
          btn.setAttribute("aria-checked", isMatch ? "true" : "false");
        });
      }
      this.update();
    }
    loadStateFromUrl() {
      try {
        const hash = window.location.hash.slice(1);
        if (hash) {
          const params = new URLSearchParams(hash);
          if (params.has("text")) this.state.text = params.get("text");
          if (params.has("sec")) {
            this.state.secondaryText = params.get("sec");
            this.state.isDualWord = true;
          }
          if (params.has("size")) this.state.sizeId = params.get("size");
          if (params.has("orient")) this.state.orientation = params.get("orient");
          if (params.has("style")) this.state.style = params.get("style");
          if (params.has("theme")) this.state.theme = params.get("theme");
          if (params.has("flourish")) this.state.flourishes = params.get("flourish");
        }
      } catch (e) {
        console.warn("Could not parse URL hash params:", e);
      }
    }
    updateUrlHash() {
      try {
        const params = new URLSearchParams();
        params.set("text", this.state.text);
        if (this.state.isDualWord && this.state.secondaryText) {
          params.set("sec", this.state.secondaryText);
        }
        params.set("size", this.state.sizeId);
        params.set("orient", this.state.orientation);
        params.set("style", this.state.style);
        params.set("theme", this.state.theme);
        window.history.replaceState(null, "", "#" + params.toString());
      } catch (e) {
      }
    }
    bindEvents() {
      this.elText.value = this.state.text;
      this.elText.addEventListener("input", (e) => {
        this.state.text = e.target.value.slice(0, 24);
        this.update();
      });
      if (this.elSecondaryText) {
        this.elSecondaryText.value = this.state.secondaryText;
        this.elSecondaryText.addEventListener("input", (e) => {
          this.state.secondaryText = e.target.value.slice(0, 24);
          this.update();
        });
      }
      if (this.elDualWordToggle) {
        this.elDualWordToggle.checked = this.state.isDualWord;
        this.elDualWordToggle.addEventListener("change", (e) => {
          this.state.isDualWord = e.target.checked;
          this.elSecondaryGroup.style.display = this.state.isDualWord ? "block" : "none";
          this.update();
        });
        this.elSecondaryGroup.style.display = this.state.isDualWord ? "block" : "none";
      }
      this.elCanvasSize.value = this.state.sizeId;
      this.elCanvasSize.addEventListener("change", (e) => {
        this.state.sizeId = e.target.value;
        this.elCustomSizeGroup.style.display = this.state.sizeId === "CUSTOM" ? "grid" : "none";
        this.update();
      });
      this.elOrientationLandscape.addEventListener("click", () => {
        this.state.orientation = "landscape";
        this.updateOrientationUI();
        this.update();
      });
      this.elOrientationPortrait.addEventListener("click", () => {
        this.state.orientation = "portrait";
        this.updateOrientationUI();
        this.update();
      });
      this.updateOrientationUI();
      if (this.elCustomWidth) {
        this.elCustomWidth.addEventListener("input", (e) => {
          this.state.customWidth = Math.max(10, parseFloat(e.target.value) || 210);
          this.update();
        });
      }
      if (this.elCustomHeight) {
        this.elCustomHeight.addEventListener("input", (e) => {
          this.state.customHeight = Math.max(10, parseFloat(e.target.value) || 297);
          this.update();
        });
      }
      if (this.elCustomUnit) {
        this.elCustomUnit.addEventListener("change", (e) => {
          this.state.customUnit = e.target.value;
          this.update();
        });
      }
      this.elStyleButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          this.state.style = btn.getAttribute("data-style");
          this.elStyleButtons.forEach((b) => b.classList.toggle("active", b === btn));
          this.update();
        });
      });
      const bindSlider = (slider, valDisplay, key, unit = "") => {
        if (!slider) return;
        slider.value = this.state[key];
        if (valDisplay) valDisplay.textContent = this.state[key] + unit;
        slider.addEventListener("input", (e) => {
          this.state[key] = parseFloat(e.target.value);
          if (valDisplay) valDisplay.textContent = this.state[key] + unit;
          this.update();
        });
      };
      bindSlider(this.elStrokeWidth, this.elStrokeWidthVal, "strokeWidth");
      bindSlider(this.elContrast, this.elContrastVal, "contrast", "x");
      bindSlider(this.elSpacing, this.elSpacingVal, "letterSpacing", "px");
      bindSlider(this.elSlant, this.elSlantVal, "slant", "\xB0");
      bindSlider(this.elMargin, this.elMarginVal, "marginMm", "mm");
      bindSlider(this.elScale, this.elScaleVal, "scaleFactor", "x");
      if (this.elFlourishes) {
        this.elFlourishes.value = this.state.flourishes;
        this.elFlourishes.addEventListener("change", (e) => {
          this.state.flourishes = e.target.value;
          this.update();
        });
      }
      if (this.elRenderMode) {
        this.elRenderMode.value = this.state.renderMode;
        this.elRenderMode.addEventListener("change", (e) => {
          this.state.renderMode = e.target.value;
          this.update();
        });
      }
      if (this.elToggleGuides) {
        this.elToggleGuides.checked = this.state.showGuides;
        this.elToggleGuides.addEventListener("change", (e) => {
          this.state.showGuides = e.target.checked;
          this.update();
        });
      }
      if (this.elTogglePivot) {
        this.elTogglePivot.checked = this.state.showCenterPivot;
        this.elTogglePivot.addEventListener("change", (e) => {
          this.state.showCenterPivot = e.target.checked;
          this.update();
        });
      }
      if (this.elThemeButtons) {
        this.elThemeButtons.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const targetTheme = btn.getAttribute("data-theme");
            this.setTheme(targetTheme);
            this.showToast(`Switched to ${targetTheme.charAt(0).toUpperCase() + targetTheme.slice(1)} theme`);
          });
        });
      }
      this.elBtnFlip.addEventListener("click", () => {
        const newAngle = this.renderer.toggleFlip();
        this.updateRotationBadge(newAngle);
      });
      this.elBtnSpin.addEventListener("click", () => {
        const isSpinning = this.renderer.toggleContinuousSpin();
        this.elBtnSpin.classList.toggle("active-spin", isSpinning);
        this.elBtnSpin.setAttribute("aria-pressed", isSpinning);
        this.updateRotationBadge(this.renderer.rotationDeg);
      });
      if (this.elBtnSplit) {
        this.elBtnSplit.addEventListener("click", () => {
          this.state.viewMode = this.state.viewMode === "single" ? "split" : "single";
          this.elBtnSplit.classList.toggle("active", this.state.viewMode === "split");
          if (this.elSplitWrapper) {
            this.elSplitWrapper.classList.toggle("split-active", this.state.viewMode === "split");
          }
          this.update();
        });
      }
      this.elBtnExportSvg.addEventListener("click", () => this.handleExportSvg());
      this.elBtnExportDxf.addEventListener("click", () => this.handleExportDxf());
      if (this.elBtnExportPng) {
        this.elBtnExportPng.addEventListener("click", () => this.handleExportPng());
      }
      if (this.elBtnCopySvg) {
        this.elBtnCopySvg.addEventListener("click", () => this.handleCopySvg());
      }
      window.addEventListener("keydown", (e) => {
        if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
          return;
        }
        if (e.code === "Space" || e.key.toLowerCase() === "r") {
          e.preventDefault();
          const angle = this.renderer.toggleFlip();
          this.updateRotationBadge(angle);
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          this.elBtnSpin.click();
        }
      });
    }
    updateOrientationUI() {
      this.elOrientationLandscape.classList.toggle("active", this.state.orientation === "landscape");
      this.elOrientationPortrait.classList.toggle("active", this.state.orientation === "portrait");
    }
    updateRotationBadge(angle) {
      if (!this.elRotationBadge) return;
      const normAngle = Math.round(angle) % 360;
      if (normAngle === 0) {
        this.elRotationBadge.textContent = "0\xB0 (Upright)";
        this.elRotationBadge.className = "badge badge-upright";
      } else if (normAngle === 180) {
        this.elRotationBadge.textContent = "180\xB0 (Inverted)";
        this.elRotationBadge.className = "badge badge-inverted";
      } else {
        this.elRotationBadge.textContent = `${normAngle}\xB0`;
        this.elRotationBadge.className = "badge badge-spinning";
      }
    }
    renderPresets() {
      if (!this.elPresetsList) return;
      this.elPresetsList.innerHTML = "";
      PRESETS.forEach((preset) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "preset-chip";
        chip.innerHTML = `<span class="preset-name">${preset.title}</span><span class="preset-tag">${preset.style}</span>`;
        chip.title = preset.description;
        chip.addEventListener("click", () => {
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
        if (this.elSecondaryGroup) this.elSecondaryGroup.style.display = "block";
      } else {
        this.state.secondaryText = "";
        this.state.isDualWord = false;
        if (this.elDualWordToggle) this.elDualWordToggle.checked = false;
        if (this.elSecondaryGroup) this.elSecondaryGroup.style.display = "none";
      }
      if (preset.style) {
        this.state.style = preset.style;
        this.elStyleButtons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-style") === preset.style));
      }
      if (preset.strokeWidth) {
        this.state.strokeWidth = preset.strokeWidth;
        if (this.elStrokeWidth) this.elStrokeWidth.value = preset.strokeWidth;
        if (this.elStrokeWidthVal) this.elStrokeWidthVal.textContent = preset.strokeWidth;
      }
      if (preset.contrast) {
        this.state.contrast = preset.contrast;
        if (this.elContrast) this.elContrast.value = preset.contrast;
        if (this.elContrastVal) this.elContrastVal.textContent = preset.contrast + "x";
      }
      if (preset.flourishes) {
        this.state.flourishes = preset.flourishes;
        if (this.elFlourishes) this.elFlourishes.value = preset.flourishes;
      }
      if (preset.letterSpacing) {
        this.state.letterSpacing = preset.letterSpacing;
        if (this.elSpacing) this.elSpacing.value = preset.letterSpacing;
        if (this.elSpacingVal) this.elSpacingVal.textContent = preset.letterSpacing + "px";
      }
      this.showToast(`Applied preset: ${preset.title}`);
      this.update();
    }
    update() {
      const result = this.engine.generate({
        text: this.state.text,
        secondaryText: this.state.isDualWord ? this.state.secondaryText : "",
        style: this.state.style,
        strokeWidth: this.state.strokeWidth,
        contrast: this.state.contrast,
        letterSpacing: this.state.letterSpacing,
        slant: this.state.slant,
        flourishes: this.state.flourishes
      });
      this.currentResult = result;
      const canvasDims = resolveCanvasDimensions({
        sizeId: this.state.sizeId,
        orientation: this.state.orientation,
        customWidth: this.state.customWidth,
        customHeight: this.state.customHeight,
        customUnit: this.state.customUnit
      });
      this.currentCanvasDims = canvasDims;
      if (this.elCanvasBadge) {
        const presetInfo = CANVAS_SIZES[this.state.sizeId] || {};
        const dimLabel = `${canvasDims.width} \xD7 ${canvasDims.height} ${canvasDims.unit}`;
        const inchLabel = presetInfo.displayInches ? ` (${presetInfo.displayInches})` : "";
        this.elCanvasBadge.textContent = `${presetInfo.name || this.state.sizeId}: ${dimLabel}${inchLabel} [${this.state.orientation.toUpperCase()}]`;
      }
      const transform = this.renderer.computeCanvasTransform({
        ambigramResult: result,
        canvasWidth: canvasDims.width,
        canvasHeight: canvasDims.height,
        marginMm: this.state.marginMm,
        scaleFactor: this.state.scaleFactor,
        opticalCenter: this.state.opticalCenter
      });
      this.currentCanvasTransform = transform;
      const positionedPath = this.renderer.transformPathToCanvas(result.masterPathData, transform);
      this.currentPositionedPath = positionedPath;
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
      if (this.state.viewMode === "split" && this.invertedRenderer) {
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
      this.renderPairsStrip(result.pairs);
      this.updateUrlHash();
    }
    renderPairsStrip(pairs) {
      if (!this.elPairsStrip) return;
      this.elPairsStrip.innerHTML = "";
      pairs.forEach((p) => {
        const item = document.createElement("div");
        item.className = "pair-pill" + (p.isCenter ? " pair-center" : "");
        item.innerHTML = `
        <span class="pair-char top-char">${p.c1}</span>
        <span class="pair-arrow">\u21C5</span>
        <span class="pair-char bot-char">${p.c2}</span>
        ${p.isCenter ? '<span class="pair-tag">Center</span>' : ""}
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
      SvgExporter.triggerDownload(svgString, filename, "image/svg+xml");
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
        layerName: "AMBIGRAM_CUT"
      });
      SvgExporter.triggerDownload(dxfString, filename, "application/dxf");
      this.showToast(`DXF downloaded successfully (${filename})`);
    }
    async handleExportPng() {
      if (!this.currentPositionedPath || !this.currentCanvasDims) return;
      try {
        this.showToast("Generating 300 DPI high-resolution PNG...");
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
          backgroundColor: this.state.theme === "dark" ? "#0f172a" : "#ffffff"
        }, filename);
        this.showToast(`PNG proof downloaded (${filename})`);
      } catch (err) {
        console.error("PNG export failed:", err);
        this.showToast("Failed to generate PNG proof");
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
        this.showToast("SVG vector code copied to clipboard!");
      } catch (err) {
        const textarea = document.createElement("textarea");
        textarea.value = svgString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        this.showToast("SVG vector code copied to clipboard!");
      }
    }
    showToast(message) {
      if (!this.elToast) return;
      this.elToast.textContent = message;
      this.elToast.classList.add("visible");
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        this.elToast.classList.remove("visible");
      }, 3200);
    }
  };
  window.addEventListener("DOMContentLoaded", () => {
    window.ambigramApp = new AmbigramApp();
  });
})();
