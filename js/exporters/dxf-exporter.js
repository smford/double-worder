/**
 * DXF Exporter for Laser Cutting, CNC Routers, and CAD Applications
 * Generates AutoCAD R12 ASCII DXF files with closed POLYLINE loops.
 * 
 * Standards adherence:
 * - $INSUNITS set to 4 (Millimeters) or 1 (Inches)
 * - Y-coordinates inverted to match CAD standard Cartesian system (Y+ upwards, origin bottom-left)
 * - Discretizes Bezier curves into smooth linear polyline segments
 */

export class DxfExporter {
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

    // Tokenize path commands and numbers
    const tokens = pathData.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
    if (!tokens) return loops;

    let i = 0;
    let cmd = '';

    while (i < tokens.length) {
      const token = tokens[i];
      if (/^[a-df-z]$/i.test(token)) {
        cmd = token;
        i++;
      }

      switch (cmd) {
        case 'M': {
          if (currentLoop.length > 2) {
            loops.push(currentLoop);
          }
          currentLoop = [];
          curX = parseFloat(tokens[i++]);
          curY = parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          // Subsequent coordinates without command are implicit 'L'
          cmd = 'L';
          break;
        }
        case 'm': {
          if (currentLoop.length > 2) {
            loops.push(currentLoop);
          }
          currentLoop = [];
          curX += parseFloat(tokens[i++]);
          curY += parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          cmd = 'l';
          break;
        }
        case 'L': {
          curX = parseFloat(tokens[i++]);
          curY = parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'l': {
          curX += parseFloat(tokens[i++]);
          curY += parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'H': {
          curX = parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'h': {
          curX += parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'V': {
          curY = parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'v': {
          curY += parseFloat(tokens[i++]);
          currentLoop.push([curX, curY]);
          break;
        }
        case 'C': {
          const cp1x = parseFloat(tokens[i++]);
          const cp1y = parseFloat(tokens[i++]);
          const cp2x = parseFloat(tokens[i++]);
          const cp2y = parseFloat(tokens[i++]);
          const x = parseFloat(tokens[i++]);
          const y = parseFloat(tokens[i++]);
          const sampled = DxfExporter.sampleCubicBezier(
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
        case 'c': {
          const cp1x = curX + parseFloat(tokens[i++]);
          const cp1y = curY + parseFloat(tokens[i++]);
          const cp2x = curX + parseFloat(tokens[i++]);
          const cp2y = curY + parseFloat(tokens[i++]);
          const x = curX + parseFloat(tokens[i++]);
          const y = curY + parseFloat(tokens[i++]);
          const sampled = DxfExporter.sampleCubicBezier(
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
        case 'Z':
        case 'z': {
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
    unit = 'mm',
    layerName = 'AMBIGRAM_CUT'
  }) {
    // 4 = mm, 1 = inches in AutoCAD DXF standard
    const insUnits = unit === 'in' ? 1 : 4;
    const lines = [];

    const push = (code, val) => {
      lines.push(code.toString().padStart(3, ' '));
      lines.push(val.toString());
    };

    // 1. HEADER SECTION
    push(0, 'SECTION');
    push(2, 'HEADER');
    push(9, '$ACADVER');
    push(1, 'AC1009'); // AutoCAD R12 format for universal CAM compatibility
    push(9, '$INSUNITS');
    push(70, insUnits);
    push(9, '$MEASUREMENT');
    push(70, unit === 'in' ? 0 : 1);
    push(9, '$EXTMIN');
    push(10, '0.0');
    push(20, '0.0');
    push(30, '0.0');
    push(9, '$EXTMAX');
    push(10, canvasWidth.toFixed(4));
    push(20, canvasHeight.toFixed(4));
    push(30, '0.0');
    push(0, 'ENDSEC');

    // 2. TABLES SECTION
    push(0, 'SECTION');
    push(2, 'TABLES');

    // Linetype table
    push(0, 'TABLE');
    push(2, 'LTYPE');
    push(70, 1);
    push(0, 'LTYPE');
    push(2, 'CONTINUOUS');
    push(70, 0);
    push(3, 'Solid line');
    push(72, 65);
    push(73, 0);
    push(40, '0.0');
    push(0, 'ENDTAB');

    // Layer table
    push(0, 'TABLE');
    push(2, 'LAYER');
    push(70, 2);
    // Default layer 0
    push(0, 'LAYER');
    push(2, '0');
    push(70, 0);
    push(62, 7); // Color 7 = white/black
    push(6, 'CONTINUOUS');
    // Cut layer
    push(0, 'LAYER');
    push(2, layerName);
    push(70, 0);
    push(62, 1); // Color 1 = Red (laser cut standard)
    push(6, 'CONTINUOUS');
    push(0, 'ENDTAB');

    push(0, 'ENDSEC');

    // 3. BLOCKS SECTION
    push(0, 'SECTION');
    push(2, 'BLOCKS');
    push(0, 'ENDSEC');

    // 4. ENTITIES SECTION
    push(0, 'SECTION');
    push(2, 'ENTITIES');

    // Optional border entity around the selected canvas dimensions
    // User can choose or CAM software can use as boundary
    push(0, 'POLYLINE');
    push(8, 'CANVAS_BOUNDARY');
    push(66, 1);
    push(70, 1); // Closed polyline
    push(10, '0.0');
    push(20, '0.0');
    push(30, '0.0');

    const borderCorners = [
      [0, 0],
      [canvasWidth, 0],
      [canvasWidth, canvasHeight],
      [0, canvasHeight]
    ];
    for (const [bx, by] of borderCorners) {
      push(0, 'VERTEX');
      push(8, 'CANVAS_BOUNDARY');
      push(10, bx.toFixed(4));
      push(20, by.toFixed(4));
      push(30, '0.0');
    }
    push(0, 'SEQEND');
    push(8, 'CANVAS_BOUNDARY');

    // Extract all polygon loops
    const allLoops = [];
    for (const p of paths) {
      if (typeof p === 'string') {
        const extracted = DxfExporter.pathDataToPolygons(p);
        allLoops.push(...extracted);
      } else if (Array.isArray(p)) {
        allLoops.push(p);
      }
    }

    for (const loop of allLoops) {
      if (loop.length < 2) continue;

      push(0, 'POLYLINE');
      push(8, layerName);
      push(66, 1); // Vertices follow
      push(70, 1); // Closed polyline
      push(10, '0.0');
      push(20, '0.0');
      push(30, '0.0');

      for (const pt of loop) {
        // CAD Cartesian flip: Y = canvasHeight - SVG_Y
        const cadX = pt[0];
        const cadY = canvasHeight - pt[1];

        push(0, 'VERTEX');
        push(8, layerName);
        push(10, cadX.toFixed(4));
        push(20, cadY.toFixed(4));
        push(30, '0.0');
      }

      push(0, 'SEQEND');
      push(8, layerName);
    }

    push(0, 'ENDSEC');

    // 5. END OF FILE
    push(0, 'EOF');

    return lines.join('\n');
  }
}
