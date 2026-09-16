import { spawn } from 'child_process';

const filePath = `file://${process.cwd()}/index.html`;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9224',
  filePath
]);

await new Promise(r => setTimeout(r, 1200));

try {
  const listRes = await fetch('http://localhost:9224/json');
  const tabs = await listRes.json();
  const tab = tabs.find(t => t.url.includes('double-worder') || t.title.includes('Double-Worder'));
  if (!tab) {
    console.error('No tab found!');
    process.exit(1);
  }

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

  // Enable Console & Runtime
  await send('Console.enable');
  await send('Runtime.enable');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Console.messageAdded') {
      console.log('[BROWSER CONSOLE]', data.params.message);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER LOG]', data.params.type, data.params.args.map(a => a.value));
    }
    if (data.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', data.params.exceptionDetails);
    }
  };

  // Evaluate if window.ambigramApp exists
  const res1 = await send('Runtime.evaluate', { expression: 'typeof window.ambigramApp' });
  console.log('window.ambigramApp type:', res1.result.value);

  // Check initial body data-theme
  const res2 = await send('Runtime.evaluate', { expression: 'document.body.getAttribute("data-theme")' });
  console.log('Initial body data-theme:', res2.result.value);

  // Check paper button exists
  const res3 = await send('Runtime.evaluate', { expression: 'Boolean(document.querySelector(".theme-btn[data-theme=\\\"paper\\\"]"))' });
  console.log('Paper button exists:', res3.result.value);

  // Click the Paper button!
  const res4 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('.theme-btn[data-theme="paper"]');
        if (btn) {
          btn.click();
          return {
            clicked: true,
            bodyTheme: document.body.getAttribute('data-theme'),
            htmlTheme: document.documentElement.getAttribute('data-theme'),
            btnActive: btn.classList.contains('active'),
            appStateTheme: window.ambigramApp ? window.ambigramApp.state.theme : null,
            bodyBg: getComputedStyle(document.body).backgroundColor,
            sidebarBg: getComputedStyle(document.querySelector('.sidebar')).backgroundColor,
            toastText: document.getElementById('toast-notification')?.textContent
          };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('After clicking Paper button:', res4.result.value);

  // Click Blueprint button
  const res5 = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('.theme-btn[data-theme="blueprint"]');
        if (btn) {
          btn.click();
          return {
            clicked: true,
            bodyTheme: document.body.getAttribute('data-theme'),
            bodyBg: getComputedStyle(document.body).backgroundColor,
            sidebarBg: getComputedStyle(document.querySelector('.sidebar')).backgroundColor
          };
        }
        return { clicked: false };
      })()
    `,
    returnByValue: true
  });
  console.log('After clicking Blueprint button:', res5.result.value);

  ws.close();
} catch (err) {
  console.error('Error during CDP test:', err);
}

chrome.kill();
process.exit(0);
