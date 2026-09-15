import fs from 'fs';
import { AmbigramEngine } from '../js/ambigram-engine.js';
import { SvgExporter } from '../js/exporters/svg-exporter.js';

const engine = new AmbigramEngine();

const words = ['ILLUMINATI', 'VICTORIA', 'MAGIC', 'SWIMS'];
let html = `<!DOCTYPE html><html><head><title>Visual Verification</title><style>
  body { background: #0b1120; color: #fff; font-family: sans-serif; padding: 20px; }
  .card { margin-bottom: 40px; background: #1e293b; padding: 20px; border-radius: 10px; }
  .grid { display: flex; gap: 20px; }
  .box { flex: 1; text-align: center; }
  svg { max-width: 100%; height: 180px; background: #fff; border-radius: 6px; }
</style></head><body><h1>Ambigram Visual Inspection Proofs</h1>`;

for (const word of words) {
  const res = engine.generate({ text: word, style: 'gothic' });
  const svgUpright = SvgExporter.exportToSvg({
    pathData: res.masterPathData,
    canvasWidth: res.bounds.width + 40,
    canvasHeight: res.bounds.height + 40,
    unit: 'px',
    exportMode: 'filled',
    fillColor: '#000000'
  });

  // Inverted: rotate 180deg
  const svgInverted = svgUpright.replace('<svg', '<svg style="transform: rotate(180deg);"');

  html += `
    <div class="card">
      <h2>"${word}" [${res.style}]</h2>
      <div class="grid">
        <div class="box"><h3>Upright (0°)</h3>${svgUpright}</div>
        <div class="box"><h3>Inverted (180°)</h3>${svgInverted}</div>
      </div>
    </div>
  `;
}

html += `</body></html>`;
fs.writeFileSync('tests/visual-proof.html', html);
console.log('Visual proof written to tests/visual-proof.html');
