/**
 * Test scratch script to verify vector path math and coordinate transformations
 */

function rotatePoint180(x, y, cx, cy) {
  return [2 * cx - x, 2 * cy - y];
}

console.log('Center (70, 100):');
console.log('Top left (20, 20) ->', rotatePoint180(20, 20, 70, 100));
console.log('Bottom right (120, 180) ->', rotatePoint180(120, 180, 70, 100));
