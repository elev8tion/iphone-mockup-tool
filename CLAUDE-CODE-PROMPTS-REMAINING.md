# Remaining Claude Code CLI Prompts

---

## 1 — Real Audio Beat Detection for Animation Presets

```
In mockup-player.html, the animation presets (zoomBeat, velocityEdit, bounceIn, glitch, etc.) claim to sync to BPM but they use a simple fixed-interval metronome: `beatInterval = 60 / preset.bpm` and `beatPhase = (t % beatInterval) / beatInterval`. This means they pulse at a fixed rate regardless of actual audio content. I need real audio-reactive beat detection.

Here is exactly what exists right now and where:

AUDIO INFRASTRUCTURE ALREADY IN PLACE:
- setupAudioAnalyser() at ~line 3397 creates an AnalyserNode with fftSize=128, connected to srcVideo. It stores the analyser in `audioAnalyser` and the data buffer in `analyserData`.
- drawWaveform() at ~line 3407 calls audioAnalyser.getByteFrequencyData(analyserData) and draws frequency bars. This proves the audio pipeline works.
- There are TWO separate AudioContext systems: one in setupAudioAnalyser() (local `actx` variable) and one in the export code (`audioCtx` global at line 5447). These need to be unified.

ANIMATION SYSTEM:
- getAnimPresetTransform(time) at ~line 3461 is the function that returns {zoom, panX, panY, rotation} for each frame. Every preset case (zoomBeat, velocityEdit, bounceIn, glitch, shake, cinematicPan, smoothSlide) uses `beatInterval = 60 / preset.bpm` for timing.
- drawGlitchEffect() at ~line 3537 also uses the same BPM math for its RGB split timing.
- The presets are called from the render loop at ~line 2661: `const animT = getAnimPresetTransform(hasVideo ? t : performance.now() * 0.001)`

UI CONTROLS:
- BPM slider: `<input type="range" id="animBPM" min="60" max="200" value="120">` at line 1089
- Intensity slider: `<input type="range" id="animIntensity" min="10" max="200" value="100">` at line 1088
- The BPM value is stored in state.animPreset.bpm

MODULAR SOURCE (if editing src/ files instead):
- src/js/effects.js contains getAnimPresetTransform() and drawGlitchEffect()
- src/js/render.js contains the render loop that calls them
- src/js/utils.js contains utility functions

HERE IS WHAT I WANT IMPLEMENTED:

1. CREATE A BEAT DETECTOR MODULE — Add a BeatDetector class/object that:
   - Uses the EXISTING audioAnalyser (or unifies the two AudioContext instances into one shared one)
   - Performs onset detection using spectral energy analysis:
     - On each animation frame, call analyser.getByteFrequencyData()
     - Split the frequency data into 3 bands: low (kick drum, 0-300Hz), mid (snare, 300-2000Hz), high (hi-hat, 2000Hz+)
     - Track a rolling average energy for each band (exponential moving average, ~300ms window)
     - A "beat" fires when the current energy exceeds the rolling average by a threshold multiplier (e.g., 1.4x for kicks, 1.3x for snares)
     - Maintain a `lastBeatTime` timestamp and enforce a minimum beat interval (~200ms) to prevent double-triggers
   - Expose these properties updated every frame:
     - `isBeat` (boolean — true on the frame a beat is detected)
     - `beatIntensity` (0-1 float — how strong the current beat is relative to threshold)
     - `energy` (0-1 float — current overall energy, smoothed)
     - `kickBeat`, `snareBeat`, `hihatBeat` (booleans for band-specific beats)
     - `timeSinceLastBeat` (seconds since most recent beat)
     - `estimatedBPM` (auto-detected from beat intervals, rolling average of last 8 beats)
   - Call the detector's update() method once per frame from the render loop

2. ADD A "SYNC MODE" TOGGLE — In the Animation Presets section of the left panel (near the BPM slider at line 1089), add:
   - A toggle button: "Auto BPM" — when ON, it listens to the audio and auto-detects BPM, overriding the manual slider
   - When Auto BPM is ON:
     - The BPM slider becomes read-only and displays the detected BPM
     - The animBPMVal span updates live with the detected value
   - When Auto BPM is OFF:
     - Manual BPM slider works as before (unchanged behavior)
   - Store this in state.animPreset.autoBPM (boolean, default false)

3. MODIFY getAnimPresetTransform() — When autoBPM is ON, replace the fixed-interval math with beat-reactive values:
   - Instead of `const beatPhase = (t % beatInterval) / beatInterval`, use:
     - `const beatPhase = detector.timeSinceLastBeat / (60 / detector.estimatedBPM)` clamped to 0-1
   - For zoomBeat: pulse zoom on actual detected beats using detector.beatIntensity as the amplitude
   - For velocityEdit: trigger the speed ramp on kick beats
   - For bounceIn: trigger elastic bounce on each detected beat
   - For glitch: trigger RGB split on detected snare/hi-hat beats
   - For shake: intensity scales with detector.energy
   - For cinematicPan and smoothSlide: these are slow continuous motions, so just use the estimatedBPM for their cycle math (same as current but with auto BPM)
   - When autoBPM is OFF, keep the existing math exactly as-is

4. MODIFY drawGlitchEffect() — When autoBPM is ON, trigger the RGB split on actual snareBeat detection instead of the fixed halfBeat interval.

5. UNIFY AudioContext — The codebase has two separate AudioContexts:
   - One in setupAudioAnalyser() at line 3397 (local variable `actx`)
   - One in the export system at line 5447 (global `audioCtx`)
   These should be unified into a single shared AudioContext. MediaElementSource can only be created once per element, so this needs careful handling. Create a shared `getAudioContext()` function that returns the singleton. The analyser should be a node in the same graph.

6. AUTO-SETUP — When any animation preset other than "none" is selected AND a video with audio is loaded, automatically call setupAudioAnalyser() if not already initialized. Currently it requires the waveform toggle to be turned on first.

IMPORTANT CONSTRAINTS:
- Do NOT break the manual BPM mode. When autoBPM is OFF, everything must work exactly as before.
- Do NOT add any external libraries. Use only Web Audio API (AnalyserNode, getByteFrequencyData).
- The beat detector must be lightweight — it runs every frame at 60fps. No heavy allocations, no FFT beyond what AnalyserNode already does.
- Keep the BPM slider functional as a fallback — if audio analysis fails or there's no audio, silently fall back to manual BPM.
- Update BOTH mockup-player.html AND the corresponding src/js/ files (effects.js for the presets, utils.js or a new beat-detector.js for the detector, ui.js for the toggle wiring, render.js if the render loop needs changes).
- After editing the src/ files, also update mockup-player.html to match (or note that ./build.sh needs to be run).
```

---

## 2 — Git LFS for Binary Assets

```
Set up Git LFS for this repository to handle large binary files properly. Currently frame.png (139KB) and screen_mask.png (22KB) are committed directly, and the assets/ folder (2.7GB) is gitignored. Future contributors cloning the repo shouldn't have to download binaries inline.

Do the following:

1. Initialize Git LFS in this repo:
   git lfs install

2. Create a .gitattributes file that tracks these patterns with LFS:
   *.png filter=lfs diff=lfs merge=lfs -text
   *.jpg filter=lfs diff=lfs merge=lfs -text
   *.jpeg filter=lfs diff=lfs merge=lfs -text
   *.webp filter=lfs diff=lfs merge=lfs -text
   *.gif filter=lfs diff=lfs merge=lfs -text
   *.mp4 filter=lfs diff=lfs merge=lfs -text
   *.mov filter=lfs diff=lfs merge=lfs -text
   *.webm filter=lfs diff=lfs merge=lfs -text
   *.cube filter=lfs diff=lfs merge=lfs -text

3. Migrate the existing committed PNGs (frame.png, screen_mask.png) to LFS:
   git lfs migrate import --include="*.png" --everything

   NOTE: This rewrites git history. Since there's only a handful of commits and this is a personal project, that's fine. But warn me before running it so I know to force-push afterward.

4. Verify the migration worked:
   git lfs ls-files

5. Update README.md to add a "Setup" section noting:
   - This repo uses Git LFS for binary files
   - Run `git lfs install` before cloning
   - Or clone with: `git lfs clone <url>`

6. Do NOT add the assets/ folder to LFS tracking — it's intentionally gitignored because it's 2.7GB of third-party content. LFS is just for the project's own binary outputs (frames, masks, screenshots).

7. Commit the .gitattributes file with message: "Add Git LFS tracking for binary assets"

IMPORTANT: Do NOT run the `git lfs migrate import` command without telling me first. Just set up the .gitattributes and let me know what the migrate command will do so I can approve it. The migration rewrites history and requires a force-push.
```
