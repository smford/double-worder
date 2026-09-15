/**
 * PNG Exporter
 * Renders the SVG vector ambigram to a high-resolution raster image (300 DPI)
 * using HTML5 Canvas for instant proofing, sharing, and print-ready bitmaps.
 */

export class PngExporter {
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
    backgroundColor = '#ffffff'
  }) {
    // 1 mm = 1 / 25.4 inches
    const pixelWidth = Math.round((widthMm / 25.4) * dpi);
    const pixelHeight = Math.round((heightMm / 25.4) * dpi);

    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');

    // Fill background
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    }

    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
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
            reject(new Error('Failed to generate PNG blob from canvas'));
          }
        }, 'image/png');
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
    const blob = await PngExporter.exportToPngBlob(options);
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
