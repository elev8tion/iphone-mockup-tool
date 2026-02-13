# Light Theme Implementation Specification - Mockup Studio

## Overview

This document maps out all the requirements, color transformations, and components needed to implement a light theme for Mockup Studio alongside the existing dark theme.

---

## Color Palette Mapping

### Current Dark Theme → Light Theme

| Element | Dark Theme | Light Theme | Purpose |
|---------|-----------|-------------|---------|
| **Backgrounds** |
| App Background | `#0a0a0a` | `#f5f5f7` | Main canvas background |
| Panel Background | `rgba(18, 18, 18, 0.7)` | `rgba(255, 255, 255, 0.85)` | Sidebar panels |
| Elevated Surface | `#1a1a1a` | `#ffffff` | Cards, modals, elevated elements |
| Hover Background | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.05)` | Hover states |
| Active Background | `rgba(255, 255, 255, 0.12)` | `rgba(0, 0, 0, 0.08)` | Active/selected states |
| **Text Colors** |
| Primary Text | `#e0e0e0` | `#1d1d1f` | Main headings, labels |
| Secondary Text | `#a0a0a0` | `#6e6e73` | Descriptions, secondary info |
| Tertiary Text | `#666666` | `#86868b` | Placeholder, disabled text |
| **Accents** |
| Primary Accent | `#60a5fa` (blue) | `#0071e3` (darker blue) | Primary actions |
| Secondary Accent | `#a78bfa` (purple) | `#8e5cdb` (darker purple) | Secondary actions |
| Success | `#4ade80` (green) | `#28a745` (darker green) | Success states |
| Warning | `#fbbf24` (yellow) | `#f59e0b` (amber) | Warning states |
| Error | `#ef4444` (red) | `#dc2626` (darker red) | Error states |
| **Borders & Dividers** |
| Glass Border | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.1)` | Subtle borders |
| Strong Border | `rgba(255, 255, 255, 0.12)` | `rgba(0, 0, 0, 0.15)` | Emphasized borders |
| Divider | `rgba(255, 255, 255, 0.04)` | `rgba(0, 0, 0, 0.06)` | Section dividers |
| **Shadows** |
| Small Shadow | `rgba(0, 0, 0, 0.2)` | `rgba(0, 0, 0, 0.1)` | Button elevation |
| Medium Shadow | `rgba(0, 0, 0, 0.3)` | `rgba(0, 0, 0, 0.15)` | Panel elevation |
| Large Shadow | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.2)` | Modal overlay |

---

## CSS Variables Structure

### Base Structure (src/styles/base.css)

```css
/* Dark Theme (Default) */
:root {
  /* Backgrounds */
  --bg-app: #0a0a0a;
  --bg-panel: rgba(18, 18, 18, 0.7);
  --bg-elevated: #1a1a1a;
  --bg-hover: rgba(255, 255, 255, 0.08);
  --bg-active: rgba(255, 255, 255, 0.12);

  /* Text */
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --text-tertiary: #666666;

  /* Accents */
  --accent-primary: #60a5fa;
  --accent-secondary: #a78bfa;
  --accent-success: #4ade80;
  --accent-warning: #fbbf24;
  --accent-error: #ef4444;

  /* Borders & Glass */
  --glass-bg: rgba(18, 18, 18, 0.7);
  --glass-border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.12);
  --divider: rgba(255, 255, 255, 0.04);

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

  /* Component-specific */
  --input-bg: rgba(255, 255, 255, 0.07);
  --input-border: rgba(255, 255, 255, 0.1);
  --button-bg: rgba(255, 255, 255, 0.07);
  --button-border: rgba(255, 255, 255, 0.1);
  --card-bg: rgba(255, 255, 255, 0.03);
  --card-border: rgba(255, 255, 255, 0.06);
}

/* Light Theme Override */
:root[data-theme="light"],
.light-theme {
  /* Backgrounds */
  --bg-app: #f5f5f7;
  --bg-panel: rgba(255, 255, 255, 0.85);
  --bg-elevated: #ffffff;
  --bg-hover: rgba(0, 0, 0, 0.05);
  --bg-active: rgba(0, 0, 0, 0.08);

  /* Text */
  --text-primary: #1d1d1f;
  --text-secondary: #6e6e73;
  --text-tertiary: #86868b;

  /* Accents */
  --accent-primary: #0071e3;
  --accent-secondary: #8e5cdb;
  --accent-success: #28a745;
  --accent-warning: #f59e0b;
  --accent-error: #dc2626;

  /* Borders & Glass */
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(0, 0, 0, 0.1);
  --border-strong: rgba(0, 0, 0, 0.15);
  --divider: rgba(0, 0, 0, 0.06);

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.2);

  /* Component-specific */
  --input-bg: rgba(0, 0, 0, 0.04);
  --input-border: rgba(0, 0, 0, 0.15);
  --button-bg: rgba(0, 0, 0, 0.04);
  --button-border: rgba(0, 0, 0, 0.12);
  --card-bg: rgba(0, 0, 0, 0.02);
  --card-border: rgba(0, 0, 0, 0.1);
}
```

---

## Components Requiring Updates

### 1. Panels (src/styles/panels.css)

**Current Issues:**
- Hardcoded `background: var(--glass-bg)` (already using variables ✓)
- Hardcoded `backdrop-filter: blur(24px) saturate(180%)`
- Panel header background needs light theme variant

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .panel {
  backdrop-filter: blur(20px) saturate(120%);
}

:root[data-theme="light"] .panel-header {
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
```

---

### 2. Toolbar (src/styles/toolbar.css)

**Current Issues:**
- Top bar background needs light variant
- Button styles need contrast adjustment
- Separator visibility

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .top-bar {
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.05);
}

:root[data-theme="light"] .logo {
  /* Gradient already works, may need slight adjustment */
  background: linear-gradient(135deg, #0071e3, #8e5cdb);
}

:root[data-theme="light"] .sep {
  background: rgba(0, 0, 0, 0.1);
}
```

---

### 3. Buttons (src/styles/components.css)

**Current Issues:**
- Button backgrounds too dark for light theme
- Hover states need reversal
- Active states need adjustment

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:root[data-theme="light"] .btn-primary {
  /* Keep gradient, adjust opacity */
  background: linear-gradient(135deg, #0071e3, #8e5cdb);
}
```

---

### 4. Cards & Presets (src/styles/panels.css)

**Current Issues:**
- Preset cards need light backgrounds
- Active states need higher contrast
- Hover effects need adjustment

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .preset-card {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

:root[data-theme="light"] .preset-card:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

:root[data-theme="light"] .preset-card.active {
  background: linear-gradient(135deg, rgba(0, 113, 227, 0.08), rgba(142, 92, 219, 0.08));
  border-color: rgba(0, 113, 227, 0.3);
}
```

---

### 5. Inputs & Controls (src/styles/components.css)

**Current Issues:**
- Range sliders need light styling
- Color pickers border
- Select/input backgrounds

**Light Theme Adjustments:**
```css
:root[data-theme="light"] input[type="range"] {
  background: rgba(0, 0, 0, 0.1);
}

:root[data-theme="light"] input[type="range"]::-webkit-slider-thumb {
  background: var(--accent-primary);
  box-shadow: 0 2px 8px rgba(0, 113, 227, 0.3);
}

:root[data-theme="light"] .top-bar select,
:root[data-theme="light"] .top-bar input[type="number"],
:root[data-theme="light"] .prop-row select,
:root[data-theme="light"] .prop-row input {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
}
```

---

### 6. Modals & Overlays (src/styles/modals.css)

**Current Issues:**
- Modal backgrounds need light variant
- Backdrop opacity adjustment
- Dialog shadows

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .welcome-overlay,
:root[data-theme="light"] .kb-overlay {
  background: rgba(255, 255, 255, 0.8);
}

:root[data-theme="light"] .welcome-card,
:root[data-theme="light"] .export-dialog {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}
```

---

### 7. Timeline (src/styles/timeline.css)

**Current Issues:**
- Timeline bar background
- Clip borders and backgrounds
- Playhead color
- Scrubber visibility

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .timeline-bar {
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

:root[data-theme="light"] .timeline-clip {
  background: rgba(0, 113, 227, 0.12);
  border: 1px solid rgba(0, 113, 227, 0.3);
}

:root[data-theme="light"] .timeline-playhead {
  background: var(--accent-error);
}
```

---

### 8. Canvas & Stage (src/styles/stage.css)

**Current Issues:**
- Canvas background (may want to keep dark or make configurable)
- Drop prompt visibility
- Canvas controls

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .stage {
  /* Keep dark or make it match theme */
  background: #f0f0f0; /* Lighter neutral */
}

:root[data-theme="light"] .canvas-prompt {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed rgba(0, 0, 0, 0.2);
}

:root[data-theme="light"] .canvas-prompt svg {
  fill: var(--text-tertiary);
}
```

---

### 9. Tooltips (src/styles/components.css)

**Current Issues:**
- Tooltip background needs light variant
- Arrow color
- Text contrast

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .tooltip {
  background: rgba(0, 0, 0, 0.9);
  /* Keep dark for readability - common pattern */
  color: #fff;
  border: none;
}

:root[data-theme="light"] .tooltip-arrow {
  border-bottom-color: rgba(0, 0, 0, 0.9);
}
```

---

### 10. Asset Browser (src/styles/modals.css)

**Current Issues:**
- Browser background
- Sidebar navigation
- File item hover states
- Search input styling

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .asset-browser {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.12);
}

:root[data-theme="light"] .ab-sidebar {
  background: rgba(0, 0, 0, 0.02);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

:root[data-theme="light"] .ab-folder:hover,
:root[data-theme="light"] .ab-file:hover {
  background: rgba(0, 0, 0, 0.05);
}

:root[data-theme="light"] .ab-search {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
}
```

---

### 11. Toast Notifications (src/styles/components.css)

**Current Issues:**
- Toast background
- Success/error variants
- Icon colors

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .toast {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
}

:root[data-theme="light"] .toast.success {
  border-left: 3px solid var(--accent-success);
}

:root[data-theme="light"] .toast.error {
  border-left: 3px solid var(--accent-error);
}
```

---

### 12. Loading Skeletons (src/styles/components.css)

**Current Issues:**
- Skeleton gradient needs light variant
- Animation shimmer

**Light Theme Adjustments:**
```css
:root[data-theme="light"] .skeleton {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
}
```

---

## Implementation Strategy

### Phase 1: Foundation (2-3 hours)

1. **Update CSS Variables in base.css**
   - Add all color variables to :root
   - Create :root[data-theme="light"] override block
   - Test variable switching

2. **Create Theme Toggle Component**
   - Add toggle button to toolbar
   - Position: Right side, before Export button
   - Icon: Sun (☀️) for light theme, Moon (🌙) for dark theme
   - Store preference in localStorage

3. **Add Theme Switching Logic (ui.js)**
   ```javascript
   // Theme management
   const currentTheme = localStorage.getItem('mockupStudioTheme') || 'dark';
   document.documentElement.setAttribute('data-theme', currentTheme);

   function toggleTheme() {
     const current = document.documentElement.getAttribute('data-theme');
     const newTheme = current === 'dark' ? 'light' : 'dark';
     document.documentElement.setAttribute('data-theme', newTheme);
     localStorage.setItem('mockupStudioTheme', newTheme);
     updateThemeIcon(newTheme);
   }

   function updateThemeIcon(theme) {
     const icon = document.getElementById('themeToggleIcon');
     icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
     lucide.createIcons();
   }
   ```

---

### Phase 2: Component Updates (4-5 hours)

1. **Update Panels & Toolbar**
   - Add light theme overrides to panels.css
   - Update toolbar.css with light variants
   - Test panel visibility and contrast

2. **Update All Buttons & Controls**
   - Add light theme button styles
   - Update input/select styling
   - Test all interactive states (hover, active, disabled)

3. **Update Cards & Lists**
   - Preset cards light styling
   - Device buttons light styling
   - Layer list light styling

4. **Update Modals & Dialogs**
   - Welcome modal light variant
   - Export dialog light variant
   - Asset browser light variant

---

### Phase 3: Polish & Edge Cases (2-3 hours)

1. **Timeline & Playback**
   - Timeline bar light styling
   - Clip styling in light mode
   - Playhead visibility

2. **Canvas & Stage**
   - Decision: Keep canvas dark or make it theme-aware?
   - Drop prompt styling
   - Canvas controls

3. **Tooltips & Feedback**
   - Toast notifications
   - Tooltips (may keep dark for contrast)
   - Loading states

4. **Responsive Overrides**
   - Test light theme at all breakpoints
   - Ensure mobile panels work in light mode
   - Check backdrop visibility

---

### Phase 4: Testing & Refinement (2 hours)

1. **Contrast Testing**
   - WCAG AA compliance check (4.5:1 for text)
   - Test all text/background combinations
   - Adjust colors for accessibility

2. **Visual Testing**
   - Compare against design references (Figma, Linear, Notion light themes)
   - Check glassmorphism effect in light mode
   - Verify all shadows are visible but subtle

3. **Functional Testing**
   - Theme toggle works smoothly
   - Preference persists across sessions
   - No flash of wrong theme on load (FOUT)

---

## HTML Changes Required

### Toolbar Theme Toggle Button

**Location:** src/_body.html, in .top-bar after "Assets" button

```html
<!-- Theme Toggle -->
<button class="btn" id="themeToggleBtn" title="Toggle theme">
  <i data-lucide="sun" id="themeToggleIcon"></i>
</button>
```

---

## JavaScript Changes Required

### ui.js Additions

```javascript
// ============================================================
// THEME MANAGEMENT
// ============================================================

// Initialize theme
const savedTheme = localStorage.getItem('mockupStudioTheme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// Theme toggle button
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeToggleIcon = document.getElementById('themeToggleIcon');

if (themeToggleBtn) {
  // Set initial icon
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';

    // Apply theme
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mockupStudioTheme', newTheme);

    // Update icon
    updateThemeIcon(newTheme);

    // Optional: Show toast
    showToast(`Switched to ${newTheme} theme`, 'success');
  });
}

function updateThemeIcon(theme) {
  if (themeToggleIcon) {
    themeToggleIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}
```

---

## Design References

### Industry Examples

**Light Theme Leaders:**
- **Linear** - Clean, minimal, excellent contrast
- **Figma** - Soft grays, subtle borders, good glassmorphism
- **Notion** - Warm whites, subtle shadows, approachable
- **Apple Human Interface** - Pure white, crisp borders, strong hierarchy
- **Vercel** - Crisp white, strong shadows, modern

**Key Patterns to Follow:**
1. Don't use pure white (#ffffff) for backgrounds - use warm grays (#f5f5f7)
2. Use darker accent colors for better contrast
3. Softer shadows (10-15% opacity vs 30-50% in dark)
4. Higher border contrast (10-15% vs 6-8% in dark)
5. Keep tooltips dark for readability (industry standard)

---

## Accessibility Requirements

### Contrast Ratios (WCAG AA)

| Element Type | Min Ratio | Example |
|--------------|-----------|---------|
| Body text (11-12px) | 4.5:1 | `#1d1d1f` on `#f5f5f7` = 14.2:1 ✓ |
| Large text (18px+) | 3:1 | `#6e6e73` on `#ffffff` = 6.8:1 ✓ |
| UI Components | 3:1 | Borders, icons, controls |
| Active states | 3:1 | Selected, focused elements |

### Tools for Testing:
- Chrome DevTools > Accessibility tab
- WebAIM Contrast Checker
- Figma Contrast plugin

---

## Estimated Implementation Time

| Phase | Task | Time |
|-------|------|------|
| 1 | CSS Variables + Toggle Component | 2-3 hours |
| 2 | Component Updates | 4-5 hours |
| 3 | Polish & Edge Cases | 2-3 hours |
| 4 | Testing & Refinement | 2 hours |
| **Total** | | **10-13 hours** |

---

## Optional Enhancements

### System Theme Detection

```javascript
// Detect OS theme preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Auto-set on first visit
if (!localStorage.getItem('mockupStudioTheme')) {
  const autoTheme = prefersDark.matches ? 'dark' : 'light';
  localStorage.setItem('mockupStudioTheme', autoTheme);
  document.documentElement.setAttribute('data-theme', autoTheme);
}

// Listen for OS theme changes
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('mockupStudioTheme')) {
    const newTheme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
  }
});
```

### Smooth Theme Transition

```css
/* Add to base.css */
:root {
  transition: background-color 0.3s ease, color 0.3s ease;
}

* {
  transition: background-color 0.3s ease,
              border-color 0.3s ease,
              color 0.3s ease;
}
```

### Theme Variants

Future expansion:
- **High Contrast Light** - For accessibility
- **High Contrast Dark** - For accessibility
- **Sepia/Warm** - Reduced blue light
- **Nord/Dracula/Solarized** - Popular community themes

---

## Success Criteria

✅ Light theme fully functional with no visual bugs
✅ All text meets WCAG AA contrast ratios
✅ Theme preference persists across sessions
✅ Toggle button accessible via keyboard (Tab + Enter)
✅ No flash of wrong theme on page load
✅ All components maintain visual hierarchy in light mode
✅ Glassmorphism effects work in both themes
✅ Shadows visible but subtle in light mode
✅ Works at all responsive breakpoints
✅ No performance impact from theme switching

---

## File Checklist

### Files to Modify

- [ ] `src/styles/base.css` - Add CSS variables, theme overrides
- [ ] `src/styles/panels.css` - Light panel styling
- [ ] `src/styles/toolbar.css` - Light toolbar styling
- [ ] `src/styles/components.css` - Light button/input/card styling
- [ ] `src/styles/modals.css` - Light modal/dialog styling
- [ ] `src/styles/timeline.css` - Light timeline styling
- [ ] `src/styles/stage.css` - Light canvas styling (optional)
- [ ] `src/_body.html` - Add theme toggle button
- [ ] `src/js/ui.js` - Add theme switching logic

### Files to Test

- [ ] `mockup-player.html` - Built output works in both themes
- [ ] All responsive breakpoints (375px, 768px, 1024px, 1366px, 1920px)
- [ ] All modals and overlays
- [ ] All interactive states (hover, active, focus, disabled)
- [ ] Theme persistence across page reloads

---

## Conclusion

Implementing a light theme will:
- Improve accessibility for users who prefer light backgrounds
- Match OS theme preferences (macOS/Windows)
- Increase appeal for professional/creative users
- Follow modern web app standards
- Provide user choice and customization

**Recommended next step:** Start with Phase 1 (Foundation) to set up the infrastructure, then progressively enhance each component category in Phase 2.
