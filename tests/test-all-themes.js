import { spawn } from 'child_process';

const filePath = `file://${process.cwd()}/index.html`;

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  '--remote-debugging-port=9226',
  filePath
]);

await new Promise(r => setTimeout(r, 1200));

try {
  const listRes = await fetch('http://localhost:9226/json');
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

  const themes = ['paper', 'blueprint', 'parchment', 'dark'];
  for (const t of themes) {
    const res = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.theme-btn[data-theme="${t}"]');
          btn.click();
          return {
            theme: "${t}",
            bodyTheme: document.body.getAttribute('data-theme'),
            htmlTheme: document.documentElement.getAttribute('data-theme'),
            btnActive: btn.classList.contains('active'),
            bodyBg: getComputedStyle(document.body).backgroundColor,
            sidebarBg: getComputedStyle(document.querySelector('.sidebar')).backgroundColor,
            toast: document.getElementById('toast-notification')?.textContent
          };
        })()
      `,
      returnByValue: true
    });
    console.log(`Theme test [${t}]:`, res.result.value);
  }

  ws.close();
} catch (e) {
  console.error(e);
}

chrome.kill();
process.exit(0);
