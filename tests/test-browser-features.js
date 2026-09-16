import { spawn } from 'child_process';

const filePath = `file://${process.cwd()}/index.html`;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9227',
  filePath
]);

await new Promise(r => setTimeout(r, 1200));

try {
  const listRes = await fetch('http://localhost:9227/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('double-worder') || t.title.includes('Double-Worder'));

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(resolve => ws.onopen = resolve);

  let msgId = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = msgId++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Runtime.enable');

  // Test Flip 180 button
  const flipRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.getElementById('btn-flip-180');
        btn.click();
        const badge = document.getElementById('rotation-badge')?.textContent;
        return { clicked: true, rotationBadge: badge };
      })()
    `,
    returnByValue: true
  });
  console.log('Flip 180 test:', flipRes.result.value);

  // Test Presets
  const presetRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const chips = document.querySelectorAll('.preset-chip');
        const first = chips[1]; // Victoria
        first.click();
        return {
          presetCount: chips.length,
          inputValue: document.getElementById('input-text').value,
          dimensionBadge: document.getElementById('canvas-dimension-badge')?.textContent
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Preset test:', presetRes.result.value);

  // Test SVG preview exists
  const svgRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const svg = document.getElementById('ambigram-canvas-svg');
        const path = svg?.querySelector('#preview-ambigram-paths path');
        return {
          svgExists: Boolean(svg),
          pathLength: path?.getAttribute('d')?.length || 0
        };
      })()
    `,
    returnByValue: true
  });
  console.log('SVG preview test:', svgRes.result.value);

  ws.close();
} catch (e) {
  console.error(e);
}

chrome.kill();
process.exit(0);
