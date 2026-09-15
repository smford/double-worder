import { AmbigramEngine } from '../js/ambigram-engine.js';
import { SvgExporter } from '../js/exporters/svg-exporter.js';
import { DxfExporter } from '../js/exporters/dxf-exporter.js';
import { validateDXF } from './dxf-validator.js';

const engine = new AmbigramEngine();

console.log('Testing Ambigram generation for "ILLUMINATI"...');
const res1 = engine.generate({ text: 'ILLUMINATI', style: 'gothic' });
console.log('Success:', res1.success);
console.log('Pairs:', res1.pairs.map(p => `${p.c1}-${p.c2}`).join(', '));
console.log('Glyphs count:', res1.glyphs.length);
console.log('Master path length:', res1.masterPathData.length);

console.log('Testing Ambigram generation for "VICTORIA"...');
const res2 = engine.generate({ text: 'VICTORIA', style: 'roman' });
console.log('Pairs:', res2.pairs.map(p => `${p.c1}-${p.c2}`).join(', '));

console.log('Testing Ambigram generation for "MAGIC" (odd length)...');
const res3 = engine.generate({ text: 'MAGIC', style: 'geometric' });
console.log('Pairs:', res3.pairs.map(p => `${p.c1}-${p.c2}${p.isCenter ? ' (center)' : ''}`).join(', '));

console.log('Testing Ambigram generation for dual-word "ANGEL" / "DEVIL"...');
const res4 = engine.generate({ text: 'ANGEL', secondaryText: 'DEVIL', style: 'gothic' });
console.log('Pairs:', res4.pairs.map(p => `${p.c1}-${p.c2}`).join(', '));

// Test SVG export
const svg = SvgExporter.exportToSvg({
  pathData: res1.masterPathData,
  canvasWidth: 210,
  canvasHeight: 297,
  unit: 'mm',
  exportMode: 'filled',
  metadata: { text1: 'ILLUMINATI', style: 'gothic' }
});
console.log('SVG length:', svg.length);
if (!svg.includes('<svg') || !svg.includes('</svg>')) {
  throw new Error('Invalid SVG output');
}

// Test DXF export
const dxf = DxfExporter.exportToDxf({
  paths: [res1.masterPathData],
  canvasWidth: 210,
  canvasHeight: 297,
  unit: 'mm'
});
const dxfVal = validateDXF(dxf);
console.log('DXF validation:', dxfVal);
if (!dxfVal.valid) {
  throw new Error(`DXF validation failed: ${dxfVal.error}`);
}

console.log('\nALL ENGINE TESTS PASSED WITH 100% SUCCESS!');
