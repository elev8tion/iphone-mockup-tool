# Automatic Distribution Updates

This project automatically updates the Mac app and Etsy versions whenever you commit code.

## How It Works

### Automatic Updates (on commit)
A **pre-commit git hook** automatically:
1. ✅ Runs `./build.sh` to compile all source files
2. 📦 Copies `mockup-player.html` to Mac app bundle
3. 🛍️ Copies `mockup-player.html` to Etsy downloadable folder
4. ➕ Stages all updated files for commit
5. ✨ Continues with your commit

**Location:** `.git/hooks/pre-commit`

### When You Commit:
```bash
git add src/
git commit -m "Add new feature"
# 🔨 Building project...
# ✅ Build successful
# 📦 Updating Mac app bundle...
# ✅ Mac app updated
# 🛍️ Updating Etsy version...
# ✅ Etsy version updated
# ✨ All versions updated and staged for commit
```

## Distribution Locations

| Version | Path |
|---------|------|
| **Main Build** | `mockup-player.html` |
| **Mac App** | `Mockup Studio.app/Contents/Resources/mockup-player.html` |
| **Etsy Download** | `MockUpStudioDnloadable/mockup-player.html` |

## Manual Updates

If you need to manually update distributions without committing:

```bash
./update-distributions.sh
```

This will:
- Build the project
- Update both Mac app and Etsy versions
- Show file sizes
- Display instructions for committing

## Disabling Auto-Updates

If you need to commit without triggering the build:

```bash
git commit --no-verify -m "Quick fix"
```

The `--no-verify` flag skips all git hooks.

## Build Process

The `build.sh` script:
1. Combines all CSS files from `src/styles/`
2. Combines all JS files from `src/js/`
3. Injects CSS and JS into `src/_body.html`
4. Outputs single `mockup-player.html` file

**Build Stats (current):**
- CSS: 3,967 lines (10 files)
- JS: 10,734 lines (19 files)
- HTML: 1,214 lines
- Total: 15,915 lines

## Troubleshooting

### Build Fails on Commit
```bash
# Check build manually
./build.sh

# If it fails, fix the error and try again
git add .
git commit -m "Your message"
```

### Hook Not Running
```bash
# Verify hook is executable
ls -la .git/hooks/pre-commit

# Make it executable if needed
chmod +x .git/hooks/pre-commit
```

### Manually Trigger Hook
```bash
# Test the hook without committing
.git/hooks/pre-commit
```

## Best Practices

1. **Always commit from project root** - The hook expects to run from the repository root
2. **Check build output** - Review build logs for warnings or errors
3. **Verify distributions** - Occasionally check that Mac app and Etsy versions are up to date
4. **Test before pushing** - Test the Mac app locally after significant changes

## File Sizes

Typical `mockup-player.html` size: **~500-600 KB**

Monitor with:
```bash
ls -lh mockup-player.html
ls -lh "Mockup Studio.app/Contents/Resources/mockup-player.html"
ls -lh "MockUpStudioDnloadable/mockup-player.html"
```

All three should be identical.
