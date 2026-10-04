import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSuite() {
  console.log('🚀 Starting Vite preview server...');
  const server = spawn('npm.cmd', ['run', 'preview', '--', '--port', '3000'], {
    cwd: process.cwd(),
    shell: true
  });

  server.stdout.on('data', d => console.log(`[Vite] ${d.toString().trim()}`));
  server.stderr.on('data', d => console.error(`[Vite Error] ${d.toString().trim()}`));

  await sleep(3500);

  console.log('🌐 Launching Chrome Headless with WebGL acceleration...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--enable-gpu-rasterization',
      '--disable-features=CalculateNativeWinOcclusion',
      '--window-size=1280,720'
    ]
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);
  await page.setViewport({ width: 1280, height: 720 });

  console.log('🔗 Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Wait for gameEngine to be loaded
  await page.waitForFunction(() => !!window.gameEngine && !!window.defenseScene, { timeout: 15000 });
  console.log('🎮 Game Engine initialized in browser context.');

  const results = [];

  // Helper to run a test scenario
  async function runScenario(scenarioName, options) {
    console.log(`\n--- Running Scenario: ${scenarioName} ---`);

    const result = await page.evaluate(async (name, opt) => {
      const engine = window.gameEngine;
      const scene = window.defenseScene;

      // Configure optimizations
      engine.combatSystem.useSpatialGrid = opt.useSpatialGrid ?? true;
      engine.entityMgr.useObjectPooling = opt.useObjectPooling ?? true;
      scene.useViewportCulling = opt.useViewportCulling ?? true;
      scene.useBatchRender = opt.useBatchRender ?? true;

      // Apply preset or custom counts
      if (opt.preset) {
        engine.applyBenchmarkPreset(opt.preset, opt.seed || 74921);
      } else {
        window.GlobalRNG.reset(opt.seed || 74921);
        engine.entityMgr.clearAll();
        engine.injectTowers(opt.towers || 100);
        engine.injectEnemies(opt.enemies || 5000);
        engine.injectProjectiles(opt.projectiles || 1000);
      }

      // Warmup 60 frames
      for (let i = 0; i < 60; i++) {
        await new Promise(r => requestAnimationFrame(r));
      }

      // Run 300 frames benchmark
      return new Promise(resolve => {
        engine.perfMonitor.startBenchmark(name, opt.seed || 74921, opt.frames || 300, res => {
          resolve(res);
        });
      });
    }, scenarioName, options);

    console.log(`FPS: ${result.avgFps} | P95: ${result.p95FrameTime}ms | P99: ${result.p99FrameTime}ms | >33ms: ${result.pctOver33ms}% | Sim: ${result.avgSimTime}ms | Target: ${result.avgTargetingTime}ms | Render: ${result.avgRenderTime}ms`);
    results.push(result);
    return result;
  }

  // 1. Raw Baseline (Spatial Grid OFF + Batch Render OFF) at 5,000 enemies
  await runScenario('Baseline (Spatial Grid OFF, Batch Render OFF)', {
    useSpatialGrid: false,
    useBatchRender: false,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'ASSIGNMENT',
    frames: 120
  });

  // 2. Spatial Grid ON (Batch Render ON) at 5,000 enemies
  await runScenario('Optimized (Spatial Grid ON, Batch Render ON)', {
    useSpatialGrid: true,
    useBatchRender: true,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'ASSIGNMENT',
    frames: 300
  });

  // 3. Normal Preset (100 E / 10 T / 50 P)
  await runScenario('NORMAL PRESET', {
    useSpatialGrid: true,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'NORMAL',
    frames: 300
  });

  // 4. Heavy Preset (1,000 E / 50 T / 250 P)
  await runScenario('HEAVY PRESET', {
    useSpatialGrid: true,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'HEAVY',
    frames: 300
  });

  // 5. Final Assignment Stress Test (5,000 E / 100 T / 1,000 P)
  await runScenario('ASSIGNMENT STRESS (5k Enemies)', {
    useSpatialGrid: true,
    useBatchRender: true,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'ASSIGNMENT',
    frames: 300
  });

  // 6. Extreme Stress Test (10,000 E / 200 T / 2,000 P)
  await runScenario('EXTREME STRESS (10k Enemies)', {
    useSpatialGrid: true,
    useBatchRender: true,
    useObjectPooling: true,
    useViewportCulling: true,
    preset: 'EXTREME',
    frames: 200
  });

  console.log('\n✅ All benchmark scenarios completed successfully.');

  // Save raw results
  fs.writeFileSync('benchmark-results.json', JSON.stringify(results, null, 2));

  await browser.close();
  server.kill();
  process.exit(0);
}

runSuite().catch(err => {
  console.error('Fatal benchmark error:', err);
  process.exit(1);
});
