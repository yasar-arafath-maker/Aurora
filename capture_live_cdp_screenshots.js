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

  if (!pageTab) {
    console.error('No page tab found!');
    process.exit(1);
  }

  const client = await connectWs(pageTab.webSocketDebuggerUrl);

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to SolarFit AR...');
  await client.send('Page.navigate', { url: 'http://127.0.0.1:4173/solarfit-ar.html' });
  await sleep(2000);

  // Click demo button
  await client.send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('#demoBtn');
      if (btn) btn.click();
    `
  });
  await sleep(2500);

  // 1. Toggle IR Thermal Cam
  console.log('Toggling Thermal Cam...');
  await client.send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('#thermalModeBtn');
      if (btn) btn.click();
    `
  });
  await sleep(1500);
  const ssThermal = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_thermal_cam.png', Buffer.from(ssThermal.data, 'base64'));
  console.log('Saved live_output_solarfit_thermal_cam.png');

  // Turn thermal off, turn 3D Module HUDs on
  await client.send('Runtime.evaluate', {
    expression: `
      const th = document.querySelector('#thermalModeBtn');
      if (th) th.click();
      const hud = document.querySelector('#hologramHudBtn');
      if (hud) hud.click();
    `
  });
  await sleep(1500);
  const ssHud = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_3d_huds.png', Buffer.from(ssHud.data, 'base64'));
  console.log('Saved live_output_solarfit_3d_huds.png');

  // 2. Open AI Advisor modal
  console.log('Opening AI Advisor modal...');
  await client.send('Runtime.evaluate', {
    expression: `
      const ai = document.querySelector('#aiAdvisorBtn');
      if (ai) ai.click();
    `
  });
  await sleep(1500);
  const ssAi = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_ai_advisor_modal.png', Buffer.from(ssAi.data, 'base64'));
  console.log('Saved live_output_solarfit_ai_advisor_modal.png');

  // Close AI modal and open ROI modal
  console.log('Opening ROI modal...');
  await client.send('Runtime.evaluate', {
    expression: `
      const closeBtns = document.querySelectorAll('button');
      const close = Array.from(closeBtns).find(b => b.textContent.includes('Close') || b.textContent.includes('✕') || b.id.includes('close'));
      if (close) close.click();
      const roi = document.querySelector('#roiBtn');
      if (roi) roi.click();
    `
  });
  await sleep(1500);
  const ssRoi = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('report_figures/live_output_solarfit_roi_modal.png', Buffer.from(ssRoi.data, 'base64'));
  console.log('Saved live_output_solarfit_roi_modal.png');

  client.close();
  console.log('All live feature screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
