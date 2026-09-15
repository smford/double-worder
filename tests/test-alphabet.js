import { AmbigramEngine } from '../js/ambigram-engine.js';
import { SvgExporter } from '../js/exporters/svg-exporter.js';
import { DxfExporter } from '../js/exporters/dxf-exporter.js';
import { validateDXF } from './dxf-validator.js';

const engine = new AmbigramEngine();
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

console.log('Testing all 26 single-letter self ambigrams...');
for (const char of alphabet) {
  const res = engine.generate({ text: char, style: 'gothic' });
  if (!res.masterPathData || res.masterPathData.includes('NaN')) {
    throw new Error(`Failed on letter ${char}: contains NaN or empty path`);
  }
}
console.log('All 26 self-symmetric letters passed!');

console.log('Testing 50 random letter pairs...');
for (let i = 0; i < 50; i++) {
  const c1 = alphabet[Math.floor(Math.random() * alphabet.length)];
  const c2 = alphabet[Math.floor(Math.random() * alphabet.length)];
  const res = engine.generate({ text: c1 + c2, style: 'roman' });
  if (!res.masterPathData || res.masterPathData.includes('NaN')) {
    throw new Error(`Failed on pair ${c1}-${c2}`);
  }
}
console.log('Random letter pairs test passed!');
