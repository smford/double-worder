import { spawn } from 'child_process';

const filePath = `file://${process.cwd()}/index.html`;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9225',
  filePath
]);

await new Promise(r => setTimeout(r, 1200));

try {
  const listRes = await fetch('http://localhost:9225/json');
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

  await send('Log.enable');
  await send('Network.enable');
  await send('Runtime.enable');
  await send('Page.enable');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Log.entryAdded') {
      console.log('[LOG ENTRY]', data.params.entry);
    }
    if (data.method === 'Network.loadingFailed') {
      console.log('[NETWORK FAILED]', data.params.requestId, data.params.errorText);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.log('[EXCEPTION]', data.params.exceptionDetails);
    }
  };

  // Reload page to catch all network events
  await send('Page.reload');

  await new Promise(r => setTimeout(r, 1500));

  ws.close();
} catch (e) {
  console.error(e);
}

chrome.kill();
process.exit(0);
