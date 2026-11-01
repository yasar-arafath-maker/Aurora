const fs = require('fs');
const http = require('http');

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function connectWs(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onopen = () => {
      resolve({
        ws,
        send(method, params = {}) {
          return new Promise((res, rej) => {
            const id = idCounter++;
            pending.set(id, { resolve: res, reject: rej });
            ws.send(JSON.stringify({ id, method, params }));
          });
        },
        close() {
          ws.close();
        }
      });
    };

    ws.onerror = reject;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve: res, reject: rej } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) rej(data.error);
        else res(data.result);
      }
    };
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const tabs = await getJson('http://127.0.0.1:9222/json/list');
  const pageTab = tabs.find(t => t.type === 'page' && t.webSocketDebuggerUrl);

  const client = await connectWs(pageTab.webSocketDebuggerUrl);

  // Close any modal open
  await client.send('Runtime.evaluate', {
    expression: `
      const closeBtns = document.querySelectorAll('button');
      const close = Array.from(closeBtns).find(b => b.textContent.includes('Close') || b.textContent.includes('✕') || (b.id && b.id.includes('close')));
      if (close) close.click();
      // click obstacle button
      const obs = document.querySelector('#obstacleBtn');
      if (obs) obs.click();
    `
  });
  await sleep(2000);
  const ssObs = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_obstacle_shading.png', Buffer.from(ssObs.data, 'base64'));
  console.log('Saved live_output_solarfit_obstacle_shading.png');

  // Open Layout Modal
  await client.send('Runtime.evaluate', {
    expression: `
      const layout = document.querySelector('#layoutBtn');
      if (layout) layout.click();
    `
  });
  await sleep(1500);
  const ssLay = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_layout_builder.png', Buffer.from(ssLay.data, 'base64'));
  console.log('Saved live_output_solarfit_layout_builder.png');

  client.close();
  console.log('Done capturing obstacle and layout screenshots!');
}

main().catch(console.error);
