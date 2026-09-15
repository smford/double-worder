/**
 * Architectural test script for the new Ambigram Letterform System
 */

import fs from 'fs';

// Helper to rotate points 180 degrees
function rot(x, y, cx = 60, cy = 100) {
  return [2 * cx - x, 2 * cy - y];
}

console.log('Rotated (20, 25):', rot(20, 25));
console.log('Rotated (100, 175):', rot(100, 175));
