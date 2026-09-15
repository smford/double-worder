/**
 * SVG Exporter
 * Generates standards-compliant, scalable SVG files tailored for:
 * - Professional print / typography proofing
 * - Laser cutting / vinyl plotting (with hairline cut outlines)
 * - Screen printing & digital display
 */

export class SvgExporter {
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
    unit = 'mm',
    exportMode = 'filled',
    fillColor = '#111111',
    strokeColor = '#e11d48',
    strokeWidth = '0.1mm',
    includeBorder = false,
    includeCenterMark = false,
    metadata = {}
  }) {
    const title = metadata.title || 'Ambigram Vector Export';
    const text1 = metadata.text1 || '';
    const text2 = metadata.text2 || '';
    const style = metadata.style || 'Gothic Textura';
    const date = new Date().toISOString();

    let pathAttributes = '';
    if (exportMode === 'outline') {
      pathAttributes = `fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
    } else if (exportMode === 'both') {
      pathAttributes = `fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round"`;
    } else {
      // filled default
      pathAttributes = `fill="${fillColor}" stroke="none" fill-rule="nonzero"`;
    }

    const borderElement = includeBorder
      ? `  <!-- Canvas Border / Sheet Edge -->
  <rect x="0" y="0" width="${canvasWidth}" height="${canvasHeight}" fill="none" stroke="#94a3b8" stroke-width="0.25mm" stroke-dasharray="2,2" />\n`
      : '';

    const centerMark = includeCenterMark
      ? `  <!-- Center of Rotation Pivot Mark -->
  <g id="Center-Pivot-Registration" stroke="#3b82f6" stroke-width="0.2mm" opacity="0.6">
    <line x1="${canvasWidth / 2 - 5}" y1="${canvasHeight / 2}" x2="${canvasWidth / 2 + 5}" y2="${canvasHeight / 2}" />
    <line x1="${canvasWidth / 2}" y1="${canvasHeight / 2 - 5}" x2="${canvasWidth / 2}" y2="${canvasHeight / 2 + 5}" />
    <circle cx="${canvasWidth / 2}" cy="${canvasHeight / 2}" r="3" fill="none" />
  </g>\n`
      : '';

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
        <dc:description>Ambigram for: "${text1}" ${text2 ? `/ "${text2}"` : ''} [${style}]</dc:description>
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
  static triggerDownload(content, filename, mimeType = 'image/svg+xml') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}
