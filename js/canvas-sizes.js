/**
 * Paper and Sheet Dimensions
 * Standard International (ISO 216), US ANSI/North American, and Vinyl / Laser cutter formats.
 */

export const CANVAS_SIZES = {
  'A4': {
    id: 'A4',
    name: 'A4 (International)',
    standard: 'ISO 216',
    widthMm: 210,
    heightMm: 297,
    unit: 'mm',
    description: 'Standard global document size (210 × 297 mm)'
  },
  'A3': {
    id: 'A3',
    name: 'A3 (International Poster)',
    standard: 'ISO 216',
    widthMm: 297,
    heightMm: 420,
    unit: 'mm',
    description: 'Double A4 poster size (297 × 420 mm)'
  },
  'A5': {
    id: 'A5',
    name: 'A5 (International Booklet)',
    standard: 'ISO 216',
    widthMm: 148,
    heightMm: 210,
    unit: 'mm',
    description: 'Half A4 booklet size (148 × 210 mm)'
  },
  'US_LETTER': {
    id: 'US_LETTER',
    name: 'US Letter',
    standard: 'ANSI A',
    widthMm: 215.9,
    heightMm: 279.4,
    unit: 'mm',
    displayInches: '8.5 × 11 in',
    description: 'Standard North American paper size (8.5 × 11 in)'
  },
  'US_LEGAL': {
    id: 'US_LEGAL',
    name: 'US Legal',
    standard: 'ANSI',
    widthMm: 215.9,
    heightMm: 355.6,
    unit: 'mm',
    displayInches: '8.5 × 14 in',
    description: 'Extended North American legal size (8.5 × 14 in)'
  },
  'US_TABLOID': {
    id: 'US_TABLOID',
    name: 'US Tabloid / Ledger',
    standard: 'ANSI B',
    widthMm: 279.4,
    heightMm: 431.8,
    unit: 'mm',
    displayInches: '11 × 17 in',
    description: 'North American ledger/poster size (11 × 17 in)'
  },
  'US_JUNIOR_LEGAL': {
    id: 'US_JUNIOR_LEGAL',
    name: 'US Junior Legal',
    standard: 'ANSI',
    widthMm: 127,
    heightMm: 203.2,
    unit: 'mm',
    displayInches: '5 × 8 in',
    description: 'Notepad memo format (5 × 8 in)'
  },
  'VINYL_12': {
    id: 'VINYL_12',
    name: '12" Vinyl / Cricut Mat',
    standard: 'Craft / Laser',
    widthMm: 304.8,
    heightMm: 304.8,
    unit: 'mm',
    displayInches: '12 × 12 in',
    description: 'Standard vinyl cutter & laser square bed (12 × 12 in)'
  },
  'SQUARE_300': {
    id: 'SQUARE_300',
    name: 'Square 300 mm',
    standard: 'Metric Craft',
    widthMm: 300,
    heightMm: 300,
    unit: 'mm',
    displayInches: '11.8 × 11.8 in',
    description: 'Metric square sheet (300 × 300 mm)'
  },
  'CUSTOM': {
    id: 'CUSTOM',
    name: 'Custom Dimensions',
    standard: 'User Defined',
    widthMm: 210,
    heightMm: 297,
    unit: 'mm',
    description: 'Custom user-specified width and height'
  }
};

/**
 * Get resolved dimensions based on sizeId, orientation, and custom dimensions
 */
export function resolveCanvasDimensions({
  sizeId = 'A4',
  orientation = 'landscape', // or 'portrait'
  customWidth = 210,
  customHeight = 297,
  customUnit = 'mm'
}) {
  let baseWidth = 210;
  let baseHeight = 297;
  let unit = 'mm';

  if (sizeId === 'CUSTOM') {
    unit = customUnit;
    baseWidth = customWidth;
    baseHeight = customHeight;
  } else {
    const preset = CANVAS_SIZES[sizeId] || CANVAS_SIZES['A4'];
    baseWidth = preset.widthMm;
    baseHeight = preset.heightMm;
    unit = preset.unit;
  }

  // Ensure orientation matches
  let finalWidth = baseWidth;
  let finalHeight = baseHeight;

  if (orientation === 'landscape') {
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
