const { test, expect } = require('@playwright/test');
const path = require('path');

const appUrl = 'file://' + path.resolve('mockup-player.html');
const videoPath = path.resolve('.qa/qa-video.mp4');
const audioPath = path.resolve('.qa/qa-audio.mp3');

test.describe('Final manual QA checklist', () => {
  test('panel/toolbar/track functionality regression pass', async ({ page }) => {
    const softErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!/Failed to load resource|ERR_FILE_NOT_FOUND|favicon|placeholder-template/i.test(t)) {
          softErrors.push(t);
        }
      }
    });

    await page.goto(appUrl);
    await page.waitForSelector('#loadBtn');

    // Initial no-media states
    await expect(page.locator('#mainVideoMuteBtn')).toBeDisabled();
    await expect(page.locator('#mainVideoSoloBtn')).toBeDisabled();
    await expect(page.locator('#mainVideoLockBtn')).toBeDisabled();
    await expect(page.locator('#bgTrackPlayBtn')).toBeDisabled();
    await expect(page.locator('#bgLoopBtn')).toBeDisabled();
    await expect(page.locator('#audioTrackPlayBtn')).toBeDisabled();
    await expect(page.locator('#audioLoopBtn')).toBeDisabled();
    await expect(page.locator('#exportBtn')).toBeDisabled();

    // Main video load
    await page.setInputFiles('#fileInput', videoPath);
    await page.waitForFunction(() => {
      const t = document.getElementById('mainVideoFileName')?.textContent || '';
      return t && !/No main video loaded/i.test(t);
    });

    await expect(page.locator('#mainVideoMuteBtn')).toBeEnabled();
    await expect(page.locator('#mainVideoSoloBtn')).toBeEnabled();
    await expect(page.locator('#mainVideoLockBtn')).toBeEnabled();
    await expect(page.locator('#exportBtn')).toBeEnabled();

    const loopLabel = await page.locator('#loopBtn span').textContent();
    expect((loopLabel || '').trim()).toBe('Loop');
    await expect(page.locator('#loopBtn i[data-lucide]')).toHaveCount(1);

    await page.click('#loopBtn');
    await page.click('#loopBtn');
    await expect(page.locator('#loopBtn i[data-lucide]')).toHaveCount(1);
    await expect(page.locator('#loopBtn span')).toHaveText('Loop');

    // Space hotkey single-toggle
    await page.click('#stage');
    const beforePlaying = await page.locator('#masterPlayBtn').evaluate(el => el.classList.contains('playing'));
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    const after1 = await page.locator('#masterPlayBtn').evaluate(el => el.classList.contains('playing'));
    expect(after1).not.toBe(beforePlaying);
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    const after2 = await page.locator('#masterPlayBtn').evaluate(el => el.classList.contains('playing'));
    expect(after2).toBe(beforePlaying);

    // BG video load and controls
    await page.setInputFiles('#bgVideoInput', videoPath);
    await page.waitForFunction(() => (document.getElementById('bgVideoStatus')?.textContent || '').trim().length > 0);
    await expect(page.locator('#bgTrackPlayBtn')).toBeEnabled();
    await expect(page.locator('#bgLoopBtn')).toBeEnabled();
    await expect(page.locator('#bgSpeedSelect')).toBeEnabled();
    await expect(page.locator('#bgVideoActionsBtn')).toBeEnabled();
    await expect(page.locator('#bgSyncBtn')).toHaveClass(/synced/);

    // BG audio load and controls
    await page.setInputFiles('#bgAudioInput', audioPath);
    await page.waitForFunction(() => (document.getElementById('bgAudioStatus')?.textContent || '').trim().length > 0);
    await expect(page.locator('#audioTrackPlayBtn')).toBeEnabled();
    await expect(page.locator('#audioLoopBtn')).toBeEnabled();
    await expect(page.locator('#audioSpeedSelect')).toBeEnabled();
    await expect(page.locator('#bgAudioActionsBtn')).toBeEnabled();
    await expect(page.locator('#audioSyncBtn')).toHaveClass(/synced/);

    // Standstill mode checks
    await page.selectOption('#standstillModeSelect', 'pauseAnimation');
    await expect(page.locator('#freezeTimeControl')).toBeVisible();
    await expect(page.locator('#contentLoopControl')).toBeHidden();

    await page.click('#setFreezeTimeBtn');
    const freezeValue = await page.locator('#freezeTimeInput').inputValue();
    expect(Number.isFinite(parseFloat(freezeValue))).toBeTruthy();

    await page.selectOption('#standstillModeSelect', 'freezeDevice');
    await expect(page.locator('#freezeTimeControl')).toBeVisible();
    await expect(page.locator('#contentLoopControl')).toBeVisible();

    await page.fill('#contentLoopStart', '0.90');
    await page.dispatchEvent('#contentLoopStart', 'input');
    await page.fill('#contentLoopEnd', '0.20');
    await page.dispatchEvent('#contentLoopEnd', 'input');
    await page.waitForTimeout(80);

    const loopRange = await page.evaluate(() => ({
      start: Number(state.standstill?.contentLoop?.start || 0),
      end: Number(state.standstill?.contentLoop?.end || 0),
      enabled: !!state.standstill?.contentLoop?.enabled,
      mode: state.standstill?.mode
    }));
    expect(loopRange.mode).toBe('freezeDevice');
    expect(loopRange.enabled).toBeTruthy();
    expect(loopRange.end).toBeGreaterThan(loopRange.start);
    expect(loopRange.end - loopRange.start).toBeGreaterThanOrEqual(0.01);

    expect(softErrors).toEqual([]);
  });
});
