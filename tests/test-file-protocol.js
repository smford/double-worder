import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const filePath = `file://${process.cwd()}/index.html`;
console.log('Testing URL:', filePath);

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9223',
  filePath
]);

await new Promise(r => setTimeout(r, 1200));

try {
  const listRes = await fetch('http://localhost:9223/json');
  const tabs = await listRes.json();
  const doubleWorderTab = tabs.find(t => t.url.includes('double-worder') || t.title.includes('Double-Worder'));
  console.log('Found Tab:', doubleWorderTab);
} catch (e) {
  console.error('Failed to fetch tabs:', e);
}

chrome.kill();
process.exit(0);
