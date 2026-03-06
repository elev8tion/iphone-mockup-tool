const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const appPath = path.resolve('mockup-player.html');
  const videoPath = path.resolve('.qa/qa-video.webm');
  const audioPath = path.resolve('.qa/qa-audio.mp3');
  const url = 'file://' + appPath;

  const results = [];
  const hardErrors = [];
  const softConsoleErrors = [];

  function check(condition, name) {
    const ok = !!condition;
    results.push({ name, ok });
    if (!ok) hardErrors.push(name);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await context.newPage();

  page.on('pageerror', (err) => hardErrors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!/Failed to load resource|ERR_FILE_NOT_FOUND|favicon|placeholder-template/i.test(t)) {
        softConsoleErrors.push(t);
      }
    }
  });

  await page.goto(url);
  await page.waitForSelector('#loadBtn');
  if (await page.locator('#dismissWelcome').isVisible().catch(() => false)) {
    await page.click('#dismissWelcome');
    await page.waitForTimeout(100);
  }

  const initial = await page.evaluate(() => ({
    mainMute: document.getElementById('mainVideoMuteBtn')?.disabled,
    mainSolo: document.getElementById('mainVideoSoloBtn')?.disabled,
    mainLock: document.getElementById('mainVideoLockBtn')?.disabled,
    bgPlay: document.getElementById('bgTrackPlayBtn')?.disabled,
    bgLoop: document.getElementById('bgLoopBtn')?.disabled,
    audioPlay: document.getElementById('audioTrackPlayBtn')?.disabled,
    audioLoop: document.getElementById('audioLoopBtn')?.disabled,
    exportDisabled: document.getElementById('exportBtn')?.disabled,
  }));

  check(initial.mainMute && initial.mainSolo && initial.mainLock, 'Initial: main track controls disabled');
  check(initial.bgPlay && initial.bgLoop, 'Initial: bg video controls disabled');
  check(initial.audioPlay && initial.audioLoop, 'Initial: bg audio controls disabled');
  check(initial.exportDisabled, 'Initial: export disabled');

  await page.setInputFiles('#fileInput', videoPath);
  await page.waitForFunction(() => {
    const t = document.getElementById('mainVideoFileName')?.textContent || '';
    return t && !/No main video loaded/i.test(t);
  });

  const postMain = await page.evaluate(() => ({
    mainMute: document.getElementById('mainVideoMuteBtn')?.disabled,
    mainSolo: document.getElementById('mainVideoSoloBtn')?.disabled,
    mainLock: document.getElementById('mainVideoLockBtn')?.disabled,
    exportDisabled: document.getElementById('exportBtn')?.disabled,
    loopLabel: document.querySelector('#loopBtn span')?.textContent?.trim(),
    loopIcon: !!document.querySelector('#loopBtn [data-lucide]'),
    timelineVisible: document.getElementById('timelineSystem')?.classList.contains('visible')
  }));

  check(!postMain.mainMute && !postMain.mainSolo && !postMain.mainLock, 'Main video load: main controls enabled');
  check(!postMain.exportDisabled, 'Main video load: export enabled');
  check(postMain.loopLabel === 'Loop' && postMain.loopIcon, 'Loop button structure intact after load');
  check(postMain.timelineVisible, 'Main video load: timeline visible');

  await page.click('#loopBtn');
  await page.click('#loopBtn');
  const postLoopToggle = await page.evaluate(() => ({
    label: document.querySelector('#loopBtn span')?.textContent?.trim(),
    icon: !!document.querySelector('#loopBtn [data-lucide]')
  }));
  check(postLoopToggle.label === 'Loop' && postLoopToggle.icon, 'Loop button structure intact after toggles');

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.body.focus();
  });
  const beforePlay = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const afterFirst = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  const afterSecond = await page.evaluate(() => document.getElementById('masterPlayBtn')?.classList.contains('playing'));

  check(afterFirst !== beforePlay, 'Hotkey: first Space toggles playback once');
  check(afterSecond === beforePlay, 'Hotkey: second Space restores prior playback state');

  await page.setInputFiles('#bgVideoInput', videoPath);
  await page.waitForFunction(() => (document.getElementById('bgVideoStatus')?.textContent || '').trim().length > 0);
  const postBgVideo = await page.evaluate(() => ({
    playDisabled: document.getElementById('bgTrackPlayBtn')?.disabled,
    loopDisabled: document.getElementById('bgLoopBtn')?.disabled,
    speedDisabled: document.getElementById('bgSpeedSelect')?.disabled,
    actionDisabled: document.getElementById('bgVideoActionsBtn')?.disabled,
    synced: document.getElementById('bgSyncBtn')?.classList.contains('synced')
  }));

  check(!postBgVideo.playDisabled && !postBgVideo.loopDisabled && !postBgVideo.speedDisabled && !postBgVideo.actionDisabled, 'BG video load: controls enabled');
  check(postBgVideo.synced, 'BG video load: sync active by default');

  await page.setInputFiles('#bgAudioInput', audioPath);
  await page.waitForFunction(() => (document.getElementById('bgAudioStatus')?.textContent || '').trim().length > 0);
  const postBgAudio = await page.evaluate(() => ({
    playDisabled: document.getElementById('audioTrackPlayBtn')?.disabled,
    loopDisabled: document.getElementById('audioLoopBtn')?.disabled,
    speedDisabled: document.getElementById('audioSpeedSelect')?.disabled,
    actionDisabled: document.getElementById('bgAudioActionsBtn')?.disabled,
    synced: document.getElementById('audioSyncBtn')?.classList.contains('synced')
  }));

  check(!postBgAudio.playDisabled && !postBgAudio.loopDisabled && !postBgAudio.speedDisabled && !postBgAudio.actionDisabled, 'BG audio load: controls enabled');
  check(postBgAudio.synced, 'BG audio load: sync active by default');

  await page.selectOption('#standstillModeSelect', 'pauseAnimation');
  await page.waitForTimeout(80);
  const pauseMode = await page.evaluate(() => ({
    mode: state.standstill?.mode,
    freezeVisible: getComputedStyle(document.getElementById('freezeTimeControl')).display !== 'none',
    loopVisible: getComputedStyle(document.getElementById('contentLoopControl')).display !== 'none'
  }));
  check(pauseMode.mode === 'pauseAnimation', 'Standstill: pauseAnimation mode set');
  check(pauseMode.freezeVisible && !pauseMode.loopVisible, 'Standstill: pauseAnimation control visibility correct');

  await page.click('#setFreezeTimeBtn');
  await page.waitForTimeout(80);
  const freezeVal = await page.evaluate(() => parseFloat(document.getElementById('freezeTimeInput')?.value || 'NaN'));
  check(Number.isFinite(freezeVal) && freezeVal >= 0, 'Standstill: freeze time set to valid value');

  await page.selectOption('#standstillModeSelect', 'freezeDevice');
  await page.fill('#contentLoopStart', '0.90');
  await page.dispatchEvent('#contentLoopStart', 'input');
  await page.fill('#contentLoopEnd', '0.20');
  await page.dispatchEvent('#contentLoopEnd', 'input');
  await page.waitForTimeout(80);

  const freezeDevice = await page.evaluate(() => ({
    mode: state.standstill?.mode,
    loopEnabled: !!state.standstill?.contentLoop?.enabled,
    start: Number(state.standstill?.contentLoop?.start || 0),
    end: Number(state.standstill?.contentLoop?.end || 0),
    freezeVisible: getComputedStyle(document.getElementById('freezeTimeControl')).display !== 'none',
    loopVisible: getComputedStyle(document.getElementById('contentLoopControl')).display !== 'none'
  }));

  check(freezeDevice.mode === 'freezeDevice' && freezeDevice.loopEnabled, 'Standstill: freezeDevice mode enables content loop');
  check(freezeDevice.freezeVisible && freezeDevice.loopVisible, 'Standstill: freezeDevice control visibility correct');
  check(freezeDevice.end > freezeDevice.start && (freezeDevice.end - freezeDevice.start) >= 0.01, 'Standstill: loop range clamp valid');

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log('QA_RESULTS_START');
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} :: ${r.name}`);
  if (softConsoleErrors.length) {
    console.log('SOFT_CONSOLE_ERRORS_START');
    for (const e of softConsoleErrors) console.log(e);
    console.log('SOFT_CONSOLE_ERRORS_END');
  }
  console.log(`QA_SUMMARY :: passed=${passed} failed=${failed}`);
  console.log('QA_RESULTS_END');

  await browser.close();

  if (failed > 0 || hardErrors.length > 0 || softConsoleErrors.length > 0) {
    if (hardErrors.length) {
      console.error('HARD_ERRORS_START');
      for (const e of hardErrors) console.error(e);
      console.error('HARD_ERRORS_END');
    }
    process.exit(1);
  }
})();
