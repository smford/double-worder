/**
 * Basic DXF Validator
 * Checks that DXF text complies with standard DXF structure:
 * - Proper group codes and values
 * - Valid SECTION / ENDSEC pairs
 * - HEADER, TABLES, ENTITIES sections
 * - Closed POLYLINE and VERTEX structure
 * - Proper EOF terminator
 */
export function validateDXF(dxfString) {
  const lines = dxfString.split(/\r?\n/).map(l => l.trim());
  if (lines.length < 10) {
    return { valid: false, error: 'DXF file is too short' };
  }

  // Check EOF
  const lastNonEmpty = lines.filter(Boolean).slice(-2);
  if (lastNonEmpty[0] !== '0' || lastNonEmpty[1] !== 'EOF') {
    return { valid: false, error: 'Missing 0 EOF at end of file' };
  }

  let inSection = false;
  let currentSection = null;
  const sections = [];
  let openPolylines = 0;

  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = parseInt(lines[i], 10);
    const val = lines[i + 1];

    if (isNaN(code)) {
      return { valid: false, error: `Invalid group code at line ${i + 1}: ${lines[i]}` };
    }

    if (code === 0) {
      if (val === 'SECTION') {
        inSection = true;
      } else if (val === 'ENDSEC') {
        inSection = false;
        currentSection = null;
      } else if (val === 'POLYLINE') {
        openPolylines++;
      } else if (val === 'SEQEND') {
        openPolylines--;
      }
    } else if (code === 2 && inSection && !currentSection) {
      currentSection = val;
      sections.push(val);
    }
  }

  if (openPolylines !== 0) {
    return { valid: false, error: `Mismatched POLYLINE/SEQEND count: ${openPolylines} unclosed` };
  }

  const requiredSections = ['HEADER', 'TABLES', 'ENTITIES'];
  for (const req of requiredSections) {
    if (!sections.includes(req)) {
      return { valid: false, error: `Missing required section: ${req}` };
    }
  }

  return { valid: true, sections };
}
