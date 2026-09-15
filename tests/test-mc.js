/**
 * Test M_C bespoke curve
 */
function create_M_C(w, h, sw, contrast) {
  const hsw = Math.max(9, sw / contrast);
  const x1 = 18;
  const x2 = w / 2 - sw / 2;
  const x3 = w - 18 - sw;
  const yTop = 25;
  const yBot = 175;
  const yMid = 100;

  // Left stem (M left minim; becomes C bottom arm when inverted)
  const s1 = `M ${x1} ${yTop + 20} L ${x1 + sw} ${yTop + 20} L ${x1 + sw} ${yBot} L ${x1} ${yBot} Z`;
  // Center minim (M center minim)
  const s2 = `M ${x2} ${yTop + 20} L ${x2 + sw} ${yTop + 20} L ${x2 + sw} ${yMid + 15} L ${x2} ${yMid + 15} Z`;
  // Right stem (M right minim; becomes C spine when inverted!)
  const s3 = `M ${x3} ${yTop + 20} L ${x3 + sw} ${yTop + 20} L ${x3 + sw} ${yBot - 20} L ${x3} ${yBot - 20} Z`;

  // Top arches for M
  const a1 = `M ${x1} ${yTop + 20} C ${x1} ${yTop}, ${x2 + sw} ${yTop}, ${x2 + sw} ${yTop + 20} L ${x2} ${yTop + 20} C ${x2} ${yTop + hsw}, ${x1 + sw} ${yTop + hsw}, ${x1 + sw} ${yTop + 20} Z`;
  const a2 = `M ${x2} ${yTop + 20} C ${x2} ${yTop}, ${x3 + sw} ${yTop}, ${x3 + sw} ${yTop + 20} L ${x3} ${yTop + 20} C ${x3} ${yTop + hsw}, ${x2 + sw} ${yTop + hsw}, ${x2 + sw} ${yTop + 20} Z`;

  // Bottom curve (becomes C top arm when inverted)
  const bCurve = `M ${x1} ${yBot} C ${x1} ${yBot - 15}, ${x3 + sw} ${yBot - 15}, ${x3 + sw} ${yBot - 20} L ${x3 + sw} ${yBot} L ${x1} ${yBot} Z`;

  return `${s1} ${s2} ${s3} ${a1} ${a2} ${bCurve}`;
}

console.log('M_C generated successfully');
