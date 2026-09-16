import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url.split('?')[0];
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.js') contentType = 'text/javascript';
  if (ext === '.css') contentType = 'text/css';
  if (ext === '.svg') contentType = 'image/svg+xml';
  if (ext === '.json') contentType = 'application/json';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(8089, async () => {
  console.log('Test server running at http://localhost:8089');
  
  // Launch Chrome headless with remote debugging
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    'http://localhost:8089/index.html'
  ]);

  // Wait 1 second for Chrome to initialize
  await new Promise(r => setTimeout(r, 1200));

  try {
    const listRes = await fetch('http://localhost:9222/json');
    const tabs = await listRes.json();
    console.log('Open tabs:', tabs.map(t => ({ title: t.title, url: t.url, id: t.id })));
    
    // Connect to websocket of page
    const wsUrl = tabs[0]?.webSocketDebuggerUrl;
    if (wsUrl) {
      console.log('WebSocket Debugger URL:', wsUrl);
    }
  } catch (e) {
    console.error('Failed to fetch tabs:', e);
  }

  chrome.kill();
  server.close();
  process.exit(0);
});
