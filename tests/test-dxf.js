import { DxfExporter } from '../js/exporters/dxf-exporter.js';
import { validateDXF } from './dxf-validator.js';

// Test a simple path representing a letter outline
const samplePath = "M 10 10 L 50 10 C 60 10 70 20 70 30 L 70 80 L 10 80 Z";

const dxf = DxfExporter.exportToDxf({
  paths: [samplePath],
  canvasWidth: 210,
  canvasHeight: 297,
  unit: 'mm',
  layerName: 'AMBIGRAM_CUT'
});

const result = validateDXF(dxf);
console.log('Validation Result:', result);
if (!result.valid) {
  console.error('DXF Validation failed:', result.error);
  process.exit(1);
} else {
  console.log('DXF structure is 100% valid!');
}
