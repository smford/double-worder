/**
 * Prototype script to test clean vector glyph generation for ambigrams
 */

// Let's test a clean, handcrafted L <-> T pair
function create_L_T(w, h, sw, hsw) {
  // Upright: L (stem on left, foot on bottom right)
  // Inverted: T (stem on right when upright -> left when flipped; top bar on bottom when upright -> top when flipped)
  // Let's analyze coordinates:
  // Stem is at x = 20 to 20 + sw
  // Upright:
  // Top of stem has a small right spur (width ~25) at y = 25
  // Bottom has a wide foot extending from x = 20 to W - 15 at y = 175
  // Inverted (180°):
  // The bottom wide foot becomes a top wide bar extending from x = 15 to W - 20 at y = 25!
  // The top small spur becomes a bottom small foot at y = 175!
  // The stem connects them!
  const xStem = 25;
  const yTop = 25;
  const yBot = 175;
  
  // Left vertical stem: from yTop to yBot
  const stem = `M ${xStem} ${yTop} L ${xStem + sw} ${yTop} L ${xStem + sw} ${yBot} L ${xStem} ${yBot} Z`;
  
  // Top right spur/arm (for T when inverted): from xStem + sw to xStem + sw + 35
  const topArm = `M ${xStem + sw} ${yTop} L ${xStem + sw + 35} ${yTop} L ${xStem + sw + 35} ${yTop + hsw} L ${xStem + sw} ${yTop + hsw} Z`;
  
  // Bottom right foot (L foot upright; becomes T left bar when flipped): from xStem + sw to w - 15
  const botFoot = `M ${xStem + sw} ${yBot - hsw} L ${w - 15} ${yBot - hsw} L ${w - 15} ${yBot} L ${xStem} ${yBot} Z`;
  
  // Top left spur (so T is balanced when flipped): from xStem - 20 to xStem
  const topLeft = `M ${xStem - 20} ${yTop} L ${xStem} ${yTop} L ${xStem} ${yTop + hsw} L ${xStem - 20} ${yTop + hsw} Z`;
  
  return `${stem} ${topArm} ${botFoot} ${topLeft}`;
}

const res = create_L_T(95, 200, 18, 12);
console.log('L_T path:', res);
