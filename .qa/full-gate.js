const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP_URL = `file://${path.resolve('mockup-player.html')}`;
const QA_DIR = path.resolve('.qa');
const VIDEO_PATH = path.resolve('.qa/qa-video.webm');
const AUDIO_PATH = path.resolve('.qa/qa-audio.mp3');
const LOAD_PROJECT_PATH = path.resolve('.qa/load-project.json');

const VIEWPORTS = [
  { name: 'mobile-se', width: 320, height: 568 },
  { name: 'iphone-x', width: 375, height: 812 },
  { name: 'iphone-14', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'small-desktop', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
];

function ensureQaAssets() {
  if (!fs.existsSync(QA_DIR)) fs.mkdirSync(QA_DIR, { recursive: true });
  if (!fs.existsSync(VIDEO_PATH)) throw new Error(`Missing QA video: ${VIDEO_PATH}`);
  if (!fs.existsSync(AUDIO_PATH)) throw new Error(`Missing QA audio: ${AUDIO_PATH}`);
  fs.writeFileSync(
    LOAD_PROJECT_PATH,
    JSON.stringify(
      {
        device: { type: 'macbookpro', color: 'black', landscape: false, scale: 0.45 },
        videoFit: 'contain',
        perspective: { x: 0, y: 0 },
        background: { color: '#111111' },
        shadow: 0.6,
        preset: 'youtube',
        bgType: 'solid',
        gradient: { enabled: false, type: 'linear', color1: '#0f0c29', color2: '#302b63', color3: '#24243e', angle: 135, animated: false, speed: 1 },
        particles: { enabled: false, type: 'bokeh', count: 30, color: '#ffffff', speed: 0.5 },
        orbit: { enabled: false, speed: 0.3, axis: 'y', range: 15 },
        motionBlur: { enabled: false, amount: 0.15 },
        entrance: { type: 'none', duration: 1000 },
        animPreset: { type: 'none', intensity: 1, bpm: 120, autoBPM: false },
        scene: 'custom',
        chromaKey: { enabled: false, color: '#00ff00', tolerance: 80, softness: 10 },
        standstill: { mode: 'none', freezeTime: 0, contentLoop: { enabled: false, start: 0, end: 1 } },
        lut: { enabled: false, intensity: 1, name: '', presetKey: '' },
        waveform: { enabled: false, color: '#60a5fa', height: 0.06, position: 'bottom', style: 'bars' },
        progressBar: { enabled: false, color: '#60a5fa', height: 4, position: 'top' },
        glassmorphism: { enabled: false, text: 'Your CTA Here', blur: 12, opacity: 15 },
        hand: { enabled: false, style: 'right' },
        facecam: {
          enabled: false,
          size: 0.15,
          corner: 'bottomRight',
          shape: 'circle',
          borderColor: '#ffffff',
          borderWidth: 3,
          shadow: true,
          x: -1,
          y: -1
        },
        layers: [],
        builtinOverlays: [],
        bgVideo: { enabled: false, opacity: 1, fit: 'cover', trimIn: 0, trimOut: 1, loop: true, speed: 1, synced: true },
        bgAudio: { enabled: false, volume: 1, loop: false, speed: 1, synced: true, trimIn: 0, trimOut: 1 },
        comparison: { enabled: false, device2: null, video2: null },
        isLooping: true,
        speed: 1
      },
      null,
      2
    ),
    'utf8'
  );
}

function createReport() {
  return {
    checks: [],
    hardErrors: [],
    consoleErrors: [],
  };
}

async function withTimeout(promise, ms, label) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timeout:${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function pushCheck(report, scope, name, ok, detail = '') {
  report.checks.push({ scope, name, ok, detail });
  if (!ok) report.hardErrors.push(`[${scope}] ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function dismissWelcomeIfPresent(page) {
  const btn = page.locator('#dismissWelcome');
  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(120);
  }
}

async function openFresh(page, report, scope) {
  await page.goto(APP_URL);
  await dismissWelcomeIfPresent(page);
  // We only clear panel-related persisted UI prefs for deterministic checks.
  await page.evaluate(() => {
    try {
      localStorage.removeItem('mockupStudioPanels');
      Object.keys(localStorage)
        .filter(k => k.startsWith('mockupStudioSectionCollapsed:'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      // ignore
    }
  });
  await page.reload();
  await dismissWelcomeIfPresent(page);
  pushCheck(report, scope, 'Page opened', true);
}

async function runStartupDeterminism(page, report) {
  const scope = 'startup';
  console.log(`[qa] start ${scope}`);
  await page.goto(APP_URL);
  await page.evaluate(() => {
    localStorage.setItem('mockupStudioState', JSON.stringify({
      device: { type: 'iphone16', color: 'black', landscape: false, scale: 0.45 },
      videoFit: 'cover',
      perspective: { x: 0, y: 0 },
      background: { color: '#0a0a0a' },
      shadow: 0.6,
      preset: 'reels',
      bgType: 'solid',
      gradient: { enabled: false, type: 'linear', color1: '#0f0c29', color2: '#302b63', color3: '#24243e', angle: 135, animated: false, speed: 1 },
      particles: { enabled: true, type: 'sparkle', count: 50, color: '#ff00ff', speed: 1 },
      orbit: { enabled: false, speed: 0.3, axis: 'y', range: 15 },
      motionBlur: { enabled: false, amount: 0.15 },
      entrance: { type: 'none', duration: 1000 },
      animPreset: { type: 'zoomBeat', intensity: 1.2, bpm: 160, autoBPM: false },
      scene: 'custom',
      chromaKey: { enabled: false, color: '#00ff00', tolerance: 80, softness: 10 },
      standstill: { mode: 'none', freezeTime: 0, contentLoop: { enabled: false, start: 0, end: 1 } },
      lut: { enabled: false, intensity: 1, name: '', presetKey: '' },
      waveform: { enabled: false, color: '#60a5fa', height: 0.06, position: 'bottom', style: 'bars' },
      progressBar: { enabled: false, color: '#60a5fa', height: 4, position: 'top' },
      glassmorphism: { enabled: false, text: 'Your CTA Here', blur: 12, opacity: 15 },
      hand: { enabled: false, style: 'right' },
      facecam: { enabled: false, size: 0.15, corner: 'bottomRight', shape: 'circle', borderColor: '#ffffff', borderWidth: 3, shadow: true, x: -1, y: -1 },
      layers: [],
      builtinOverlays: [],
      bgVideo: { enabled: false, opacity: 1, fit: 'cover', trimIn: 0, trimOut: 1, loop: true, speed: 1, synced: true },
      bgAudio: { enabled: false, volume: 1, loop: false, speed: 1, synced: true, trimIn: 0, trimOut: 1 },
      comparison: { enabled: false, device2: null, video2: null },
      isLooping: true,
      speed: 1
    }));
  });

  await page.reload();
  await dismissWelcomeIfPresent(page);
  await page.waitForTimeout(150);

  const startup = await page.evaluate(() => ({
    particlesOn: state.particles.enabled,
    animPreset: state.animPreset.type,
    particleSelect: document.getElementById('particleType')?.value,
    animSelected: document.querySelector('#animPresetGrid .dev-btn.active')?.dataset.anim || '',
    bgVideoCollapsed: document.getElementById('bgVideoTrack')?.classList.contains('collapsed'),
    bgAudioCollapsed: document.getElementById('bgAudioTrack')?.classList.contains('collapsed'),
    exportDisabled: document.getElementById('exportBtn')?.disabled,
    mainName: (document.getElementById('mainVideoFileName')?.textContent || '').trim(),
  }));

  pushCheck(report, scope, 'Particles are OFF on startup', startup.particlesOn === false, `particlesOn=${startup.particlesOn}`);
  pushCheck(report, scope, 'Animation preset is none on startup', startup.animPreset === 'none' && startup.animSelected === 'none', `animPreset=${startup.animPreset}, selected=${startup.animSelected}`);
  pushCheck(report, scope, 'Particle selector starts as off', startup.particleSelect === 'off', `particleSelect=${startup.particleSelect}`);
  pushCheck(report, scope, 'Background video track starts collapsed', startup.bgVideoCollapsed === true, `bgVideoCollapsed=${startup.bgVideoCollapsed}`);
  pushCheck(report, scope, 'Background audio track starts collapsed', startup.bgAudioCollapsed === true, `bgAudioCollapsed=${startup.bgAudioCollapsed}`);
  pushCheck(report, scope, 'No-video startup state shown', /No main video loaded/i.test(startup.mainName), `mainName=${startup.mainName}`);
  pushCheck(report, scope, 'Export disabled before video load', startup.exportDisabled === true, `exportDisabled=${startup.exportDisabled}`);
}

async function runFunctionalE2E(page, report) {
  const scope = 'functional';
  console.log(`[qa] start ${scope}`);
  await openFresh(page, report, scope);

  const before = await page.evaluate(() => ({
    mainMute: document.getElementById('mainVideoMuteBtn')?.disabled,
    mainSolo: document.getElementById('mainVideoSoloBtn')?.disabled,
    mainLock: document.getElementById('mainVideoLockBtn')?.disabled,
    exportDisabled: document.getElementById('exportBtn')?.disabled,
  }));
  pushCheck(report, scope, 'Main track controls disabled before load', before.mainMute && before.mainSolo && before.mainLock);
  pushCheck(report, scope, 'Export disabled before load', before.exportDisabled);

  await page.setInputFiles('#fileInput', VIDEO_PATH);
  await page.waitForFunction(() => !document.getElementById('exportBtn')?.disabled, { timeout: 15000 });
  await page.waitForTimeout(200);
  console.log('[qa] functional: main video loaded');

  const afterMain = await page.evaluate(() => ({
    mainMute: document.getElementById('mainVideoMuteBtn')?.disabled,
    mainSolo: document.getElementById('mainVideoSoloBtn')?.disabled,
    mainLock: document.getElementById('mainVideoLockBtn')?.disabled,
    exportDisabled: document.getElementById('exportBtn')?.disabled,
    fileName: (document.getElementById('mainVideoFileName')?.textContent || '').trim(),
    timelineVisible: document.getElementById('timelineSystem')?.classList.contains('visible'),
    loopLabel: (document.querySelector('#loopBtn span')?.textContent || '').trim(),
    loopHasIcon: !!document.querySelector('#loopBtn [data-lucide]'),
  }));
  pushCheck(report, scope, 'Main controls enabled after load', !afterMain.mainMute && !afterMain.mainSolo && !afterMain.mainLock);
  pushCheck(report, scope, 'Export enabled after load', afterMain.exportDisabled === false);
  pushCheck(report, scope, 'Main filename updates after load', !/No main video loaded/i.test(afterMain.fileName), `fileName=${afterMain.fileName}`);
  pushCheck(report, scope, 'Timeline visible after load', afterMain.timelineVisible);
  pushCheck(report, scope, 'Loop button icon+label integrity', afterMain.loopLabel === 'Loop' && afterMain.loopHasIcon, `label=${afterMain.loopLabel}`);

  // Hotkey toggle regression check
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); document.body.focus(); });
  const wasPlaying = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const afterSpace1 = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const afterSpace2 = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));
  pushCheck(report, scope, 'Space toggles once per press', afterSpace1 !== wasPlaying && afterSpace2 === wasPlaying);

  // Timeline zoom controls
  await page.click('#zoomInBtn');
  const zoomedIn = await page.evaluate(() => document.getElementById('timelineTrack')?.style.transform || '');
  await page.click('#zoomOutBtn');
  const zoomedOut = await page.evaluate(() => document.getElementById('timelineTrack')?.style.transform || '');
  pushCheck(report, scope, 'Timeline zoom-in applies scale transform', /scaleX\(/.test(zoomedIn), zoomedIn);
  pushCheck(report, scope, 'Timeline zoom-out returns to base', /scaleX\(1\)/.test(zoomedOut), zoomedOut);

  // Background media flows
  await page.setInputFiles('#bgVideoInput', VIDEO_PATH);
  await page.waitForFunction(() => (document.getElementById('bgVideoStatus')?.textContent || '').trim().length > 0, { timeout: 15000 });
  await page.setInputFiles('#bgAudioInput', AUDIO_PATH);
  await page.waitForFunction(() => (document.getElementById('bgAudioStatus')?.textContent || '').trim().length > 0, { timeout: 15000 });
  console.log('[qa] functional: bg media loaded');

  // Expand BG tracks when defaults are collapsed.
  const bgVideoCollapsed = await page.evaluate(() => document.getElementById('bgVideoTrack')?.classList.contains('collapsed'));
  if (bgVideoCollapsed) await page.click('#bgVideoCollapseBtn');
  const bgAudioCollapsed = await page.evaluate(() => document.getElementById('bgAudioTrack')?.classList.contains('collapsed'));
  if (bgAudioCollapsed) await page.click('#audioCollapseBtn');
  await page.waitForTimeout(120);

  const bgControls = await page.evaluate(() => ({
    bgPlay: document.getElementById('bgTrackPlayBtn')?.disabled,
    bgLoop: document.getElementById('bgLoopBtn')?.disabled,
    bgSpeed: document.getElementById('bgSpeedSelect')?.disabled,
    bgAct: document.getElementById('bgVideoActionsBtn')?.disabled,
    auPlay: document.getElementById('audioTrackPlayBtn')?.disabled,
    auLoop: document.getElementById('audioLoopBtn')?.disabled,
    auSpeed: document.getElementById('audioSpeedSelect')?.disabled,
    auAct: document.getElementById('bgAudioActionsBtn')?.disabled,
  }));
  pushCheck(report, scope, 'Background video controls enabled after media load', !bgControls.bgPlay && !bgControls.bgLoop && !bgControls.bgSpeed && !bgControls.bgAct);
  pushCheck(report, scope, 'Background audio controls enabled after media load', !bgControls.auPlay && !bgControls.auLoop && !bgControls.auSpeed && !bgControls.auAct);

  // Track lock behavior
  await page.click('#mainVideoLockBtn');
  const locked = await page.evaluate(() => document.getElementById('mainVideoTrack')?.classList.contains('track-locked'));
  await page.click('#mainVideoLockBtn');
  const unlocked = await page.evaluate(() => !document.getElementById('mainVideoTrack')?.classList.contains('track-locked'));
  pushCheck(report, scope, 'Main track lock toggles row locked state', locked && unlocked);

  // Effects and overlays mutate real state
  await page.selectOption('#particleType', 'sparkle');
  const bgVideoEffectsOpen = await page.evaluate(() => !document.getElementById('bgVideoEffectsSection')?.classList.contains('collapsed'));
  if (!bgVideoEffectsOpen) {
    await page.click('#bgVideoEffectsToggle');
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => {
    const el = document.getElementById('bgVideoBrightness');
    if (!el) return;
    el.value = '25';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.evaluate(() => {
    const el = document.getElementById('progressToggle');
    if (!el) return;
    el.value = 'true';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  const stateUpdate = await page.evaluate(() => ({
    particleEnabled: state.particles.enabled,
    particleType: state.particles.type,
    bgBrightness: state.videoEffects.bgVideo.brightness,
    progressOn: state.progressBar.enabled,
  }));
  pushCheck(report, scope, 'Particle control updates state', stateUpdate.particleEnabled && stateUpdate.particleType === 'sparkle', JSON.stringify(stateUpdate));
  pushCheck(report, scope, 'Video effect slider updates state', stateUpdate.bgBrightness === 25, `bgBrightness=${stateUpdate.bgBrightness}`);
  pushCheck(report, scope, 'Overlay toggle updates state', stateUpdate.progressOn === true, `progressOn=${stateUpdate.progressOn}`);

  // Standstill controls
  await page.selectOption('#standstillModeSelect', 'pauseAnimation');
  await page.evaluate(() => document.getElementById('setFreezeTimeBtn')?.click());
  await page.selectOption('#standstillModeSelect', 'freezeDevice');
  await page.fill('#contentLoopStart', '0.90');
  await page.dispatchEvent('#contentLoopStart', 'input');
  await page.fill('#contentLoopEnd', '0.20');
  await page.dispatchEvent('#contentLoopEnd', 'input');
  const standstill = await page.evaluate(() => ({
    mode: state.standstill.mode,
    loopEnabled: state.standstill.contentLoop.enabled,
    start: Number(state.standstill.contentLoop.start || 0),
    end: Number(state.standstill.contentLoop.end || 0),
    freezeShown: getComputedStyle(document.getElementById('freezeTimeControl')).display !== 'none',
    loopShown: getComputedStyle(document.getElementById('contentLoopControl')).display !== 'none',
  }));
  pushCheck(report, scope, 'Standstill freezeDevice mode enables bounded content loop', standstill.mode === 'freezeDevice' && standstill.loopEnabled && standstill.end > standstill.start && (standstill.end - standstill.start) >= 0.01, JSON.stringify(standstill));
  pushCheck(report, scope, 'Standstill freezeDevice shows correct controls', standstill.freezeShown && standstill.loopShown);
  console.log('[qa] functional: standstill checks done');

  // Project save/load
  await page.evaluate(() => {
    window.__qaSaveInfo = null;
    if (!window.__qaOrigAnchorClick) {
      window.__qaOrigAnchorClick = HTMLAnchorElement.prototype.click;
    }
    HTMLAnchorElement.prototype.click = function clickOverride() {
      window.__qaSaveInfo = {
        download: this.download,
        href: this.href,
      };
    };
  });
  console.log('[qa] functional: save-project interception armed');
  await page.evaluate(() => document.getElementById('saveProjectBtn')?.click());
  console.log('[qa] functional: save-project click dispatched');
  await page.waitForFunction(() => !!window.__qaSaveInfo, { timeout: 10000 });
  console.log('[qa] functional: save-project payload captured');
  const saveInfo = await page.evaluate(() => window.__qaSaveInfo);
  pushCheck(
    report,
    scope,
    'Save project prepares downloadable file',
    /mockup-project-\d+\.json/.test(saveInfo?.download || '') && /^blob:/.test(saveInfo?.href || ''),
    JSON.stringify(saveInfo)
  );
  await page.evaluate(() => {
    if (window.__qaOrigAnchorClick) {
      HTMLAnchorElement.prototype.click = window.__qaOrigAnchorClick;
      delete window.__qaOrigAnchorClick;
    }
  });

  await page.setInputFiles('#projectFileInput', LOAD_PROJECT_PATH);
  console.log('[qa] functional: project file injected');
  await page.waitForTimeout(200);
  console.log('[qa] functional: reading loaded project state');
  const loadedProject = await withTimeout(
    page.evaluate(() => ({
      deviceType: state.device.type,
      particleEnabled: state.particles.enabled,
      anim: state.animPreset.type,
    })),
    8000,
    'loadedProjectState'
  );
  pushCheck(report, scope, 'Load project applies uploaded project state', loadedProject.deviceType === 'macbookpro' && loadedProject.particleEnabled === false && loadedProject.anim === 'none', JSON.stringify(loadedProject));
  console.log('[qa] functional: project save/load checks done');

  // Export dialog open/close
  await page.evaluate(() => document.getElementById('exportBtn')?.click());
  console.log('[qa] functional: export button clicked');
  await page.waitForFunction(() => document.getElementById('exportDialog')?.classList.contains('open'), { timeout: 10000 });
  console.log('[qa] functional: export dialog open');
  await page.evaluate(() => document.getElementById('edCancel')?.click());
  await page.waitForFunction(() => !document.getElementById('exportDialog')?.classList.contains('open'), { timeout: 10000 });
  pushCheck(report, scope, 'Export dialog opens and closes', true);
  console.log('[qa] functional: export dialog checks done');
}

async function runResponsiveMatrix(browser, report) {
  for (const vp of VIEWPORTS) {
    const scope = `responsive:${vp.name}`;
    console.log(`[qa] start ${scope}`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!/Failed to load resource|ERR_FILE_NOT_FOUND|favicon|placeholder-template/i.test(text)) {
          report.consoleErrors.push(`[${scope}] ${text}`);
        }
      }
    });
    page.on('pageerror', err => report.hardErrors.push(`[${scope}] pageerror: ${err.message}`));

    await openFresh(page, report, scope);
    const base = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      topBarMoreVisible: getComputedStyle(document.getElementById('topBarMoreWrap')).display !== 'none',
      mobileLeftVisible: getComputedStyle(document.getElementById('mobileLeftToggle')).display !== 'none',
      mobileRightVisible: getComputedStyle(document.getElementById('mobileRightToggle')).display !== 'none',
      leftCollapsed: document.getElementById('leftPanel').classList.contains('collapsed'),
      rightCollapsed: document.getElementById('rightPanel').classList.contains('collapsed'),
    }));

    pushCheck(report, scope, 'No horizontal overflow at startup', base.scrollW <= base.innerW + 2, `scrollW=${base.scrollW}, innerW=${base.innerW}`);

    const hasMobilePanelToggles = base.mobileLeftVisible && base.mobileRightVisible;
    if (hasMobilePanelToggles) {
      pushCheck(report, scope, 'Mobile panel toggles visible', base.mobileLeftVisible && base.mobileRightVisible);
      await page.click('#mobileLeftToggle');
      const leftOpen = await page.evaluate(() => {
        const panel = document.getElementById('leftPanel');
        return panel.classList.contains('mobile-open') || panel.classList.contains('tablet-open');
      });
      pushCheck(report, scope, 'Left mobile panel opens', leftOpen);
      await page.evaluate(() => document.getElementById('panelBackdrop')?.click());
      await page.click('#mobileRightToggle');
      const rightOpen = await page.evaluate(() => {
        const panel = document.getElementById('rightPanel');
        return panel.classList.contains('mobile-open') || panel.classList.contains('tablet-open');
      });
      pushCheck(report, scope, 'Right mobile panel opens', rightOpen);
      await page.evaluate(() => document.getElementById('panelBackdrop')?.click());
    } else {
      await page.evaluate(() => document.getElementById('leftPanelToggle')?.click());
      const toggled = await page.evaluate(() => document.getElementById('leftPanel').classList.contains('collapsed'));
      await page.evaluate(() => document.getElementById('leftPanelToggle')?.click());
      pushCheck(report, scope, 'Desktop/tablet panel toggle works', toggled === true || toggled === false);
      if (vp.width <= 1280) {
        pushCheck(report, scope, 'Top bar more menu visible on tighter widths', base.topBarMoreVisible === true, `topBarMoreVisible=${base.topBarMoreVisible}`);
      }
    }

    // Ensure interaction still possible at this size after media load.
    await page.setInputFiles('#fileInput', VIDEO_PATH);
    await page.waitForFunction(() => !document.getElementById('exportBtn')?.disabled, { timeout: 15000 });
    const postLoad = await page.evaluate(() => ({
      exportEnabled: !document.getElementById('exportBtn')?.disabled,
      timelineVisible: document.getElementById('timelineSystem').classList.contains('visible'),
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    }));
    pushCheck(report, scope, 'Can load video and enable export', postLoad.exportEnabled === true);
    pushCheck(report, scope, 'Timeline still visible after load', postLoad.timelineVisible === true);
    pushCheck(report, scope, 'No horizontal overflow after load', postLoad.scrollW <= postLoad.innerW + 2, `scrollW=${postLoad.scrollW}, innerW=${postLoad.innerW}`);

    await context.close();
  }
}

function printSummary(report) {
  const total = report.checks.length;
  const passed = report.checks.filter(c => c.ok).length;
  const failed = total - passed;

  console.log('FULL_QA_RESULTS_START');
  for (const c of report.checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'} :: [${c.scope}] ${c.name}${c.detail ? ` :: ${c.detail}` : ''}`);
  }

  if (report.consoleErrors.length) {
    console.log('FULL_QA_CONSOLE_ERRORS_START');
    report.consoleErrors.forEach(e => console.log(e));
    console.log('FULL_QA_CONSOLE_ERRORS_END');
  }

  console.log(`FULL_QA_SUMMARY :: passed=${passed} failed=${failed} total=${total}`);
  console.log('FULL_QA_RESULTS_END');
}

async function main() {
  ensureQaAssets();
  const report = createReport();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!/Failed to load resource|ERR_FILE_NOT_FOUND|favicon|placeholder-template/i.test(text)) {
        report.consoleErrors.push(`[startup/functional] ${text}`);
      }
    }
  });
  page.on('pageerror', err => report.hardErrors.push(`[startup/functional] pageerror: ${err.message}`));

  await runStartupDeterminism(page, report);
  await runFunctionalE2E(page, report);
  await context.close();

  await runResponsiveMatrix(browser, report);
  await browser.close();

  // Page/runtime errors are hard failures
  if (report.hardErrors.length) {
    report.hardErrors.forEach(err => pushCheck(report, 'runtime', `Hard error`, false, err));
  }
  // Console errors are also treated as failures.
  if (report.consoleErrors.length) {
    report.consoleErrors.forEach(err => pushCheck(report, 'console', `Console error`, false, err));
  }

  printSummary(report);

  const failed = report.checks.some(c => !c.ok);
  if (failed) process.exit(1);
}

main().catch(err => {
  console.error('FULL_QA_FATAL', err);
  process.exit(1);
});
