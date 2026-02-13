# Z-Index Hierarchy - Mockup Studio

## Stacking Order (Low to High)

### Level 0-49: Base Content
- `0` - Default page content (no z-index specified)
- `10` - Timeline elements (scrubber, handles)
- `50` - **Panel toggle buttons** (must be above panel content)

### Level 50-99: Panel UI
- `50` - Panel toggle buttons
- `60` - Panel section headers (if needed)

### Level 100-199: App Chrome
- `100` - **Top toolbar** (always visible)
- `150` - Export status indicator
- `200` - Drop overlay, timeline system

### Level 200-299: Overlays
- `200` - Drop overlay for drag-and-drop
- `200` - Timeline enhanced system

### Level 300-499: Modals & Dialogs
- `300` - **Asset browser modal**
- `400` - (reserved for future modals)

### Level 500-599: Notifications
- `500` - **Toast notifications**

### Level 600-699: System Dialogs
- `600` - **Export dialog**
- `600` - **Keyboard shortcuts overlay**

### Level 700-799: Onboarding
- `700` - **Welcome modal** (first-time user experience)

### Level 800-899: Critical Alerts
- `800` - (reserved for error dialogs, warnings)

### Level 900-999: Tooltips & Popovers
- `1000` - **Tooltips** (always on top)

## Current Implementation

| Element | Z-Index | File | Line |
|---------|---------|------|------|
| Panel toggle | 50 | panels.css | 35 |
| Timeline scrubber | 3 | timeline.css | 56 |
| Timeline handles | 2-4 | timeline.css | 37-61 |
| Top bar | 100 | toolbar.css | 12 |
| Export status | 150 | modals.css | 100 |
| Drop overlay | 200 | stage.css | 29 |
| Timeline enhanced | 200 | timeline-enhanced.css | 15 |
| Asset browser | 300 | modals.css | 3 |
| Toast container | 500 | components.css | 168 |
| Export dialog | 600 | modals.css | 179 |
| Keyboard overlay | 600 | modals.css | 234 |
| Welcome modal | 700 | modals.css | 120 |
| Tooltip | 1000 | components.css | 128 |

## Rules

1. **Never use z-index > 1000** except for tooltips/popovers
2. **Group related elements** in the same hundred range
3. **Leave gaps** between groups for future additions
4. **Document new z-index values** in this file
5. **Use CSS variables** for common z-index values (future improvement)

## Future Improvements

Consider creating CSS variables:
```css
:root {
  --z-base: 0;
  --z-panel-ui: 50;
  --z-app-chrome: 100;
  --z-overlays: 200;
  --z-modals: 300;
  --z-notifications: 500;
  --z-dialogs: 600;
  --z-onboarding: 700;
  --z-tooltips: 1000;
}
```
