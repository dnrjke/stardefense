import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

const PORTRAIT_DEVICE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
};

const LANDSCAPE_DEVICE = {
  viewport: { width: 844, height: 390 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
};

test.describe('MPB Portrait Debug', () => {

  test('portrait: DisplayMode detects mobilePortrait', async ({ browser }) => {
    const ctx = await browser.newContext(PORTRAIT_DEVICE);
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const mode = await page.evaluate(() => {
      return (window as any).__displayMode?.mode
        ?? document.documentElement.style.getPropertyValue('--sd-top-h');
    });
    console.log('Portrait DisplayMode:', mode);

    const cssVars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        topH: s.getPropertyValue('--sd-top-h'),
        botBtnFs: s.getPropertyValue('--sd-bot-btn-fs'),
        infoW: s.getPropertyValue('--sd-info-w'),
      };
    });
    console.log('Portrait CSS vars:', cssVars);

    await page.screenshot({ path: 'tests/screenshots/portrait-mapselect.png', fullPage: false });
    await ctx.close();
  });

  test('portrait: canvas rotation applied', async ({ browser }) => {
    const ctx = await browser.newContext(PORTRAIT_DEVICE);
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const canvasInfo = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (!c) return { found: false };
      const style = c.style;
      const rect = c.getBoundingClientRect();
      return {
        found: true,
        display: style.display,
        transform: style.transform,
        width: style.width,
        height: style.height,
        rectW: Math.round(rect.width),
        rectH: Math.round(rect.height),
      };
    });
    console.log('Canvas info:', canvasInfo);

    await page.screenshot({ path: 'tests/screenshots/portrait-canvas.png', fullPage: false });
    await ctx.close();
  });

  test('portrait: start game and check grid symmetry', async ({ browser }) => {
    const ctx = await browser.newContext(PORTRAIT_DEVICE);
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click the 1-1 map node (first unlocked)
    const mapNode = page.locator('text=1-1').first();
    console.log('Map node count:', await mapNode.count());
    await mapNode.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'tests/screenshots/portrait-selected.png', fullPage: false });

    const startBtn = page.locator('button:has-text("START")');
    console.log('START btn count:', await startBtn.count());
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await page.waitForTimeout(3000);

      const cameraInfo = await page.evaluate(() => {
        const scene = (window as any).__scene;
        if (!scene?.activeCamera) return { found: false };
        const cam = scene.activeCamera;
        return {
          found: true,
          alpha: cam.alpha,
          beta: cam.beta,
          radius: cam.radius,
          targetX: cam.target?.x,
          targetZ: cam.target?.z,
        };
      });
      console.log('Camera info:', cameraInfo);

      const canvasInfo = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        const rect = c.getBoundingClientRect();
        return {
          transform: c.style.transform,
          styleW: c.style.width,
          styleH: c.style.height,
          rectW: Math.round(rect.width),
          rectH: Math.round(rect.height),
          display: c.style.display,
        };
      });
      console.log('Canvas in gameplay:', canvasInfo);

      await page.screenshot({ path: 'tests/screenshots/portrait-gameplay.png', fullPage: false });
    } else {
      console.log('START button not found — page HTML snippet:');
      const html = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
      console.log(html);
    }

    await ctx.close();
  });

  test('landscape: reference screenshot', async ({ browser }) => {
    const ctx = await browser.newContext(LANDSCAPE_DEVICE);
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const mapNode = page.locator('text=1-1').first();
    await mapNode.click();
    await page.waitForTimeout(500);

    const startBtn = page.locator('button:has-text("START")');
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'tests/screenshots/landscape-gameplay.png', fullPage: false });
    }

    await ctx.close();
  });

  test('portrait: edge column picking', async ({ browser }) => {
    const ctx = await browser.newContext(PORTRAIT_DEVICE);
    const page = await ctx.newPage();
    page.on('console', msg => {
      if (msg.text().includes('[pick]')) console.log('  ' + msg.text());
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await page.locator('text=1-1').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("START")').click();
    await page.waitForTimeout(2000);

    // Select tower from palette
    await page.locator('button:has-text("태양")').click();
    await page.waitForTimeout(300);

    // Use worldToScreen to find exact screen positions of edge tiles
    const tilePositions = await page.evaluate(() => {
      const scene = (window as any).__scene;
      if (!scene) return null;
      const { worldToScreen } = (window as any).__screenProjection ?? {};
      // Compute screen positions using tileToWorld logic
      // map1_1: 16 cols, 10 rows
      const cols = 16, rows = 10;
      const positions: Record<string, { x: number; y: number }> = {};
      for (const [label, row, col] of [
        ['left-top', 0, 0], ['left-mid', 5, 0], ['left-bot', 9, 0],
        ['right-top', 0, 15], ['right-mid', 5, 15], ['right-bot', 9, 15],
        ['center', 5, 8],
        ['portrait-left', 9, 8],   // 세로 좌측 끝 = 가로 하단, col 중앙
        ['portrait-right', 0, 8],  // 세로 우측 끝 = 가로 상단, col 중앙
      ] as [string, number, number][]) {
        const wx = col - cols / 2 + 0.5;
        const wz = -(row - rows / 2 + 0.5);
        // Manual worldToScreen
        const engine = scene.getEngine();
        const cam = scene.activeCamera;
        const worldPos = new (window as any).BABYLON.Vector3(wx, 0, wz);
        const projected = (window as any).BABYLON.Vector3.Project(
          worldPos,
          (window as any).BABYLON.Matrix.Identity(),
          scene.getTransformMatrix(),
          cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
        );
        const dpr = engine.getHardwareScalingLevel();
        const rect = engine.getRenderingCanvas().getBoundingClientRect();
        const lx = projected.x * dpr;
        const ly = projected.y * dpr;
        // Apply CSS rotation correction
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const origW = rect.height;
        const origH = rect.width;
        const dx = lx - origW / 2;
        const dy = ly - origH / 2;
        positions[label] = { x: Math.round(cx + (-dy)), y: Math.round(cy + dx) };
      }
      return positions;
    });
    console.log('Tile screen positions:', tilePositions);

    if (tilePositions) {
      // 세로 좌측 끝 = 가로 하단 = row 9, col 8
      const pLeft = tilePositions['portrait-left'];
      console.log(`Clicking portrait LEFT edge (row9,col8) at (${pLeft.x}, ${pLeft.y})`);
      await page.mouse.click(pLeft.x, pLeft.y);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/portrait-pick-left.png' });

      // Dismiss radial menu
      await page.mouse.click(195, 200);
      await page.waitForTimeout(500);

      // 세로 우측 끝 = 가로 상단 = row 0, col 8
      const pRight = tilePositions['portrait-right'];
      console.log(`Clicking portrait RIGHT edge (row0,col8) at (${pRight.x}, ${pRight.y})`);
      await page.mouse.click(pRight.x, pRight.y);
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'tests/screenshots/portrait-pick-right.png' });
    }

    await ctx.close();
  });

  test('rotation: portrait → landscape → portrait', async ({ browser }) => {
    // Start in portrait
    const ctx = await browser.newContext(PORTRAIT_DEVICE);
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const mapNode = page.locator('text=1-1').first();
    await mapNode.click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("START")').click();
    await page.waitForTimeout(2000);

    const getState = () => page.evaluate(() => {
      const c = document.querySelector('canvas');
      const dm = (window as any).__displayMode;
      return {
        mode: dm?.mode,
        rotation: dm?.rotation,
        transform: c?.style.transform,
        styleW: c?.style.width,
        styleH: c?.style.height,
      };
    });

    const s1 = await getState();
    console.log('1) Portrait initial:', s1);
    await page.screenshot({ path: 'tests/screenshots/rotate-1-portrait.png' });

    // Rotate to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    const s2 = await getState();
    console.log('2) After landscape rotate:', s2);
    await page.screenshot({ path: 'tests/screenshots/rotate-2-landscape.png' });

    // Rotate back to portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const s3 = await getState();
    console.log('3) Back to portrait:', s3);
    await page.screenshot({ path: 'tests/screenshots/rotate-3-portrait.png' });

    await ctx.close();
  });
});
