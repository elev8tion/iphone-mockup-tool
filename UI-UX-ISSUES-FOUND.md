# UI/UX Issues Found - Comprehensive Audit

## Critical Issues (Breaking Functionality)

### 1. **Panel Toggle Button Blocked by Section Header** ❌ CRITICAL
**Location:** `src/styles/panels.css` lines 34-44, 57-62
**Problem:**
- Toggle button: `position: absolute; top: 8px; right: 6px; z-index: 10`
- First panel-section: `padding: 16px` (starts at top of panel)
- Section-header: `display: flex` (full width)
- **Result:** Section header overlaps and blocks the toggle button

**Root Cause:**
```css
.panel-toggle { top: 8px; z-index: 10; }
.panel-section { padding: 16px; } /* No top offset for first section */
.section-header { display: flex; } /* Extends full width, covers toggle */
```

**Fix Required:**
1. Increase toggle z-index from 10 to 50 (above panel content)
2. Add `padding-top: 36px` to first panel-section
3. Or move toggle outside scrollable area

---

### 2. **Toggle Button Too Small for Touch Targets** ❌ CRITICAL
**Location:** `src/styles/panels.css` line 36
**Problem:**
- Current size: 20x20px
- iOS/Android guideline: 44x44px minimum
- **Result:** Difficult to tap on mobile devices

**Fix Required:**
- Increase to at least 32x32px (desktop) and 44x44px (mobile/touch)

---

### 3. **Section Header Missing Clearance for Toggle** ❌ CRITICAL
**Location:** `src/styles/panels.css` line 290-296 (section-header)
**Problem:**
- Section header starts at top of panel-section with no offset
- Overlaps toggle button positioned at `top: 8px`

**Fix Required:**
- Add `margin-top: 28px` to first `.panel-section` OR
- Add `padding-right: 32px` to first `.section-header` to avoid toggle area

---

## High Priority Issues

### 4. **Z-Index Hierarchy Not Documented** ⚠️ HIGH
**Location:** Multiple files
**Problem:** Z-index values scattered without clear hierarchy:
- Tooltip: 1000
- Welcome modal: 700
- Export/KB dialogs: 600
- Asset browser: 300
- Drop overlay: 200
- Export status: 150
- Top bar: 100
- Panel toggle: 10 (TOO LOW!)

**Fix Required:**
Create documented z-index scale:
```
0-9:    Base content
10-19:  Panel UI elements (increase toggle to 50)
100:    Top toolbar
200-299: Overlays and timeline
300-399: Modals (asset browser)
400-499: (reserved)
500-599: Notifications (toasts)
600-699: System dialogs (export, keyboard)
700-799: Onboarding (welcome modal)
800-899: (reserved)
900-999: Critical alerts
1000+:  Tooltips and popovers
```

---

### 5. **Responsive Button Text Hiding Breaks Layout** ⚠️ HIGH
**Location:** `src/styles/responsive.css` lines 25-31
**Problem:**
```css
@media (max-width: 640px) {
  .btn span { display: none; }
}
```
- Hides ALL button spans, not just toolbar buttons
- Could hide important button text in panels
- No class distinction between toolbar and panel buttons

**Fix Required:**
- Only hide text in toolbar: `.top-bar .btn span { display: none; }`
- Keep panel button text visible
- Add `.btn-icon-only` class for buttons that should show only icons

---

### 6. **Panel Overflow Issues on Small Screens** ⚠️ HIGH
**Location:** `src/styles/panels.css` line 11-12
**Problem:**
- Panel max-width: 30vw
- On 375px mobile (iPhone SE): 30vw = 112px
- Panel min-width not set, can become too narrow
- Content might overflow

**Fix Required:**
- Add `min-width: 180px` to ensure readability
- On very small screens (<400px), collapse panels by default

---

## Medium Priority Issues

### 7. **Tooltip Doesn't Reposition on Scroll** ⚠️ MEDIUM
**Location:** `src/js/ui.js` tooltip system
**Problem:**
- Tooltip position calculated once on mouseenter
- If user scrolls, tooltip stays in wrong position
- Could appear off-screen

**Fix Required:**
- Remove tooltip on scroll events
- Or recalculate position on scroll

---

### 8. **Welcome Modal Icon Sizes Inconsistent** ⚠️ MEDIUM
**Location:** `src/styles/modals.css` and `src/_body.html`
**Problem:**
- Step icons use Lucide icons with custom size
- No consistent sizing defined in CSS
- Icons might render at different sizes

**Fix Required:**
- Define explicit icon sizes in `.step-icon i[data-lucide]`
- Ensure consistency across all modals

---

### 9. **Button Hover Transform Can Cause Layout Shift** ⚠️ MEDIUM
**Location:** `src/styles/toolbar.css` lines 54-58
**Problem:**
```css
.btn:hover { transform: translateY(-1px); }
```
- On touch devices, this is ineffective (no hover)
- Can cause micro-layout shifts
- Wastes GPU on mobile

**Fix Required:**
- Disable transforms on touch devices (already in responsive.css)
- Add `will-change: transform` for GPU acceleration on desktop

---

### 10. **Skeleton Loading Doesn't Match Content Size** ⚠️ MEDIUM
**Location:** `src/js/assets.js` and `src/styles/components.css`
**Problem:**
- Fixed skeleton preview height: 120px
- Actual content might be different size
- Creates jarring layout shift when content loads

**Fix Required:**
- Match skeleton dimensions to actual content
- Use aspect-ratio CSS for consistent sizing

---

## Low Priority Issues (Polish)

### 11. **Missing Focus States for Accessibility** ⚠️ LOW
**Location:** Multiple button and interactive elements
**Problem:**
- No visible focus indicators for keyboard navigation
- Violates WCAG accessibility guidelines
- Users can't see which element is focused

**Fix Required:**
- Add `:focus-visible` styles to all interactive elements
- Use outline or box-shadow for clear focus indication

---

### 12. **Success Animation Timing Could Be Improved** ⚠️ LOW
**Location:** `src/js/export.js` and `src/styles/modals.css`
**Problem:**
- Animation shows for 2500ms
- Might be too long for fast exports
- No way to dismiss early

**Fix Required:**
- Reduce to 1800ms
- Add click to dismiss
- Or tie duration to export time (longer exports = longer celebration)

---

### 13. **Panel Section Divider Overlaps Content** ⚠️ LOW
**Location:** `src/styles/panels.css` lines 72-82
**Problem:**
```css
.panel-section:not(:last-child)::after {
  position: absolute; bottom: 0;
}
```
- Absolute positioned divider
- Could overlap with section content if content extends to bottom
- Padding not accounting for divider

**Fix Required:**
- Use border-bottom instead of ::after pseudo-element
- Or ensure padding-bottom accounts for divider

---

### 14. **Color Contrast Issues** ⚠️ LOW
**Location:** Multiple (var(--text-tertiary) = #666)
**Problem:**
- Text color #666 on dark backgrounds
- Might not meet WCAG AA contrast ratio (4.5:1)
- Affects readability

**Fix Required:**
- Test contrast ratios
- Lighten --text-tertiary to #777 or #888

---

### 15. **Loading Skeleton Animation Excessive on Low-End Devices** ⚠️ LOW
**Location:** `src/styles/components.css` skeleton animation
**Problem:**
- Continuous animation could drain battery
- Affects performance on low-end devices

**Fix Required:**
- Add `@media (prefers-reduced-motion: reduce)` check (already added!)
- Consider simpler animation

---

## Summary

**Critical Issues:** 3 (must fix immediately)
**High Priority:** 3 (fix before launch)
**Medium Priority:** 5 (fix if time permits)
**Low Priority:** 7 (polish/accessibility)

**Total Issues Found:** 18

## Recommended Fix Order

1. Fix panel toggle z-index and clearance (Critical #1, #3)
2. Increase toggle button size (Critical #2)
3. Fix z-index hierarchy (High #4)
4. Fix responsive button text (High #5)
5. Add panel min-width (High #6)
6. Fix remaining medium/low priority issues
