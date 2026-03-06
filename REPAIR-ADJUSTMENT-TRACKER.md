# Mockup Studio Repair and Adjustment Tracker

Last updated: 2026-03-06 (Release sign-off pass)

## Scope
- Stabilize high-risk runtime issues first.
- Reduce regression risk in timeline/audio systems.
- Add lightweight validation so fixes stay fixed.

## Task Checklist
- [x] `P0` Fix MP4 export UI getting stuck if `Mp4Muxer` is unavailable.
- [x] `P1` Fix saved-state restore block structure in `applyStateToUI`.
- [x] `P1` Refactor timeline clip trim drag handlers to avoid global listener accumulation.
- [x] `P1` Fix background video mute/solo to control render stack visibility correctly.
- [x] `P1` Wire background audio effect chain initialization on media load.
- [x] `P2` Remove duplicate background-audio effect handlers from `timeline-enhanced.js` (single owner).
- [x] `P2` Add lightweight smoke verification script/checklist for build + syntax + key flows.

## UX + Functionality Wave 2
- [x] `P1` Make video effect controls real by applying effects in canvas render path (main + background tracks).
- [x] `P1` Remove duplicate video-effect/toggle handlers from `timeline-enhanced.js` to avoid conflicting UI behavior.
- [x] `P1` Make track lock buttons functional (content becomes non-editable while locked).
- [x] `P1` Wire effect-panel mute/solo buttons to real track controls.
- [x] `P2` Implement timeline zoom `+/-` controls.
- [x] `P2` Improve toolbar feedback for no-video actions (thumbnail/export).
- [x] `P2` Sync main timeline filename display when video loads.
- [x] `P2` Disable unsupported advanced effect stack options to avoid fake controls.

## UX + Functionality Wave 3
- [x] `P1` Fix background video effect stack panel id mapping so list updates correctly.
- [x] `P1` Wire track lock controls with explicit track ids and locked-state behavior.
- [x] `P2` Add collapsible section controls across side panels to reduce cognitive load.
- [x] `P2` Improve toolbar behavior on narrower desktop widths (single-row horizontal scroll instead of wrapping clutter).

## UX + Functionality Wave 4
- [x] `P1` Add panel filters (left/right) for faster navigation through dense controls.
- [x] `P1` Add video-dependent disabled states for controls that need a loaded main video.
- [x] `P2` Improve empty-state guidance in main track header ("No main video loaded").
- [x] `P2` Add disabled button styling consistency for clearer affordance.

## UX + Functionality Wave 5
- [x] `P1` Add responsive top-bar "More" menu to reduce mid-width toolbar clutter.
- [x] `P1` Add quick section chips inside panel filters for faster jumps.
- [x] `P1` Apply smarter first-run default collapsed states (core open, secondary collapsed).
- [x] `P2` Add light-theme polish for new filter/quick-nav/more-menu UI.

## UX + Functionality Wave 6
- [x] `P1` Fix standstill mode gaps: wire `pauseAnimation`, correctly freeze animation time, and enable content-loop behavior for `freezeDevice`.
- [x] `P1` Fix toolbar loop button UX regression (preserve icon/label structure instead of replacing button text).
- [x] `P1` Disable background track header controls when no media is loaded to avoid fake/inert controls.
- [x] `P1` Persist and restore background track control state (loop/speed/sync/trim + standstill fields) in auto-save.
- [x] `P2` Add disabled visual affordance for timeline track controls and dropdown actions.

## UX + Functionality Wave 7
- [x] `P1` Fix duplicate Space hotkey handling between `ui.js` and `timeline-enhanced.js` that could cancel playback toggle.
- [x] `P1` Prevent global playback hotkeys from firing while focus is on buttons/menu actions.
- [x] `P1` Disable main-track mute/solo/lock controls when no main video is loaded.
- [x] `P2` Re-run full build + smoke verification after hotkey/control-state fixes.

## Release Sign-Off
- [x] JS syntax checks pass (`node --check` across modules).
- [x] Bundled build generation passes (`./build.sh`).
- [x] Smoke checks pass (`./smoke-check.sh`).
- [x] UI id wiring audit passes with only expected dynamic targets (`bgAudioEQGraph`, `bgVideoEffectStack`, `mainVideoEffectStack`).
- [x] No known blocker remains in panel/toolbar/track functionality scope.

## Final Manual QA Pass
- [x] Run browser-level checklist with media load flows (main video, bg video, bg audio), toolbar states, track controls, and standstill modes.
- [x] Validate keyboard behavior for playback (`Space`) with no double-toggle regression.
- [x] Validate no hard page/runtime errors during checklist run.
- [x] Fix discovered startup blocker: timeline zoom initialization referencing `timelineTrack` before `render.js` declaration.
- [x] Rebuild and re-run smoke checks after startup-order fix.

## Commit Plan
1. Core behavior fixes + timeline/standstill/state persistence:
   - `src/js/render.js`
   - `src/js/state.js`
   - `src/js/timeline-enhanced.js`
   - `src/js/timeline.js`
   - `src/js/ui.js`
   - `src/js/export.js`
   - `src/js/effect-ui.js`
2. UX and visual affordance updates:
   - `src/_body.html`
   - `src/styles/panels.css`
   - `src/styles/timeline-enhanced.css`
   - `src/styles/toolbar.css`
3. Docs, tooling, and bundle output:
   - `REPAIR-ADJUSTMENT-TRACKER.md`
   - `smoke-check.sh`
   - `mockup-player.html`
- 4. Final QA/startup-order hardening:
   - `src/js/timeline.js`

## Change Log
- 2026-03-06: Tracker created and implementation started.
- 2026-03-06: Completed P0 + core P1 stabilization fixes (export fallback, state restore, timeline drag listener scope, mute/solo mapping, bgAudio chain init).
- 2026-03-06: Completed P2 cleanup tasks (deduplicated bg-audio effect handlers, added `smoke-check.sh`).
- 2026-03-06: Completed UX + functionality Wave 2 (real canvas effects pipeline, lock/mute/solo behavior cleanup, timeline zoom, no-video feedback, unsupported option gating).
- 2026-03-06: Completed UX + functionality Wave 3 (panel section collapsing, toolbar density behavior, effect stack id mapping cleanup).
- 2026-03-06: Completed UX + functionality Wave 4 (panel filters, disabled-state affordance, clearer no-video guidance).
- 2026-03-06: Completed UX + functionality Wave 5 (responsive top-bar overflow menu, quick-nav chips, smarter default section collapse behavior).
- 2026-03-06: Completed UX + functionality Wave 6 (standstill mode functional fixes, toolbar loop control integrity, disabled-state gating for unloaded track controls, and persistence for bg track/standstill settings).
- 2026-03-06: Completed UX + functionality Wave 7 (hotkey conflict resolution, button-focus hotkey guards, and main-track disabled-state gating with passing smoke/build checks).
- 2026-03-06: Release sign-off pass completed (build + smoke + control wiring audit re-verified).
- 2026-03-06: Final manual QA pass completed; fixed startup `timelineTrack` initialization-order blocker in `timeline.js`; smoke checks re-verified.
