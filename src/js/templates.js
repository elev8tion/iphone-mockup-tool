// Complete template preview and application system

function attachTemplateEvents() {
    // Preview buttons
    document.querySelectorAll('.preview-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateItem = e.target.closest('.template-item');
            const templateId = templateItem.dataset.templateId;
            showTemplatePreview(templateId);
        });
    });
    
    // Use template buttons
    document.querySelectorAll('.use-template').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const templateItem = e.target.closest('.template-item');
            const templateId = templateItem.dataset.templateId;
            applyTemplate(templateId);
        });
    });
}

// Wire previews to existing Full Preset grid without changing click-to-apply
function attachFullPresetPreviewEvents() {
    const grid = document.getElementById('fullPresetGrid');
    if (!grid) return;
    grid.querySelectorAll('.preset-card').forEach(card => {
        // Right-click (context menu) to preview a preset
        card.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const key = card.dataset.fp;
            const nameEl = card.querySelector('.pc-name');
            const displayName = nameEl ? nameEl.textContent : key;
            showPresetPreview(key, displayName);
        });
        // Shift+Click to preview (keeps normal click to apply intact)
        card.addEventListener('click', (e) => {
            if (e.shiftKey) {
                e.preventDefault();
                const key = card.dataset.fp;
                const nameEl = card.querySelector('.pc-name');
                const displayName = nameEl ? nameEl.textContent : key;
                showPresetPreview(key, displayName);
            }
        });
    });
}

function showPresetPreview(presetKey, displayName) {
    try {
        if (typeof FULL_PRESETS === 'undefined' || !FULL_PRESETS[presetKey]) {
            // Fallback to generic template preview if available
            if (typeof showTemplatePreview === 'function') showTemplatePreview(presetKey);
            return;
        }
        const fp = FULL_PRESETS[presetKey];
        const presetLabel = fp.preset || 'custom';
        let aspect = '';
        try {
            const p = (typeof PRESETS !== 'undefined' && PRESETS[presetLabel]) ? PRESETS[presetLabel] : null;
            aspect = p ? `${p.w}×${p.h}` : presetLabel;
        } catch (_) { aspect = presetLabel; }
        const effects = [];
        if (fp.lut) effects.push(`LUT: ${fp.lut}`);
        if (fp.overlays && fp.overlays.length) effects.push(`Overlays: ${fp.overlays.join(', ')}`);
        if (fp.particles && fp.particles.enabled) effects.push(`Particles: ${fp.particles.type}`);
        if (fp.animPreset && fp.animPreset !== 'none') effects.push(`Anim: ${fp.animPreset}`);

        // Build a light-weight modal reusing the preview UI
        const modal = document.createElement('div');
        modal.className = 'template-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${displayName}</h3>
                    <button class="modal-close">×</button>
                </div>
                <div class="modal-body">
                    <img src="assets/placeholder-template.jpg" alt="${displayName}" onerror="this.style.display='none'">
                    <div class="template-details">
                        <p><strong>Aspect:</strong> ${aspect}</p>
                        <p><strong>Device:</strong> ${fp.device?.type || 'mixed'}</p>
                        <p><strong>Effects:</strong> ${effects.length ? effects.join(' · ') : 'None'}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" id="closePresetPreview">Close</button>
                    <button class="btn btn-primary" id="applyPresetPreview">Apply Preset</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const handleEsc = (e) => { if (e.key === 'Escape') close(); };
        const close = () => { document.removeEventListener('keydown', handleEsc); modal.style.opacity='0'; setTimeout(()=>modal.remove(),300); };
        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('#closePresetPreview').addEventListener('click', close);
        modal.querySelector('#applyPresetPreview').addEventListener('click', () => { close(); if (typeof applyFullPreset === 'function') { applyFullPreset(presetKey); showNotification(`Preset "${displayName}" applied`, 'success'); } });
        document.addEventListener('keydown', handleEsc);
        setTimeout(()=> modal.style.opacity='1', 10);
    } catch (err) {
        console.warn('Preset preview failed:', err);
    }
}

function showTemplatePreview(templateId) {
    // Find template
    let template = null;
    for (const category of Object.values(templateLibrary.categories)) {
        template = category.find(t => t.id === templateId);
        if (template) break;
    }
    
    if (!template) return;
    
    // Create preview modal
    const modal = document.createElement('div');
    modal.className = 'template-preview-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${template.name}</h3>
                <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
                <img src="${template.preview}" alt="${template.name}" 
                     onerror="this.src='assets/placeholder-template.jpg'">
                <div class="template-details">
                    <p><strong>Description:</strong> ${template.description}</p>
                    <p><strong>Aspect Ratio:</strong> ${template.config.aspectRatio}</p>
                    <p><strong>Duration:</strong> ${template.config.duration} seconds</p>
                    <p><strong>Effects Included:</strong> ${template.config.effects.join(', ')}</p>
                    <p><strong>Devices:</strong> ${template.config.devices || 1}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" id="closePreview">Close</button>
                <button class="btn btn-primary" id="applyPreview">Apply Template</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners for modal
    const handleEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    const closeModal = () => {
        document.removeEventListener('keydown', handleEsc);
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('#closePreview').addEventListener('click', closeModal);
    modal.querySelector('#applyPreview').addEventListener('click', () => {
        closeModal();
        applyTemplate(templateId);
    });
    
    // Close on ESC key
    document.addEventListener('keydown', handleEsc);
    
    // Add fade-in animation
    setTimeout(() => modal.style.opacity = '1', 10);
}

function applyTemplate(templateId) {
    // Find template
    let template = null;
    for (const category of Object.values(templateLibrary.categories)) {
        template = category.find(t => t.id === templateId);
        if (template) break;
    }
    
    if (!template) {
        // Fallback: treat templateId as a full preset key
        if (typeof FULL_PRESETS !== 'undefined' && FULL_PRESETS[templateId] && typeof applyFullPreset === 'function') {
            applyFullPreset(templateId);
            showNotification(`Preset "${templateId}" applied`, 'success');
            return;
        }
        console.error('Template not found:', templateId);
        return;
    }
    
    // Show loading state
    showNotification(`Applying "${template.name}" template...`, 'info');
    
    // Apply template configuration
    try {
        // 1. Set aspect ratio
        if (template.config.aspectRatio) {
            const [width, height] = template.config.aspectRatio.split(':').map(Number);
            if (window.setAspectRatio) {
                window.setAspectRatio(width, height);
            }
        }
        
        // 2. Add devices based on template
        if (template.config.devices && window.addDevice) {
            // Clear existing devices first
            if (window.clearDevices) {
                window.clearDevices();
            }
            
            // Add specified number of devices
            for (let i = 0; i < template.config.devices; i++) {
                window.addDevice('iphone-15'); // Default device
            }
        }
        
        // 3. Apply effects
        if (template.config.effects && window.applyEffects) {
            template.config.effects.forEach(effectName => {
                window.applyEffects(effectName);
            });
        }
        
        // 4. Set timeline duration
        if (template.config.duration && window.setTimelineDuration) {
            window.setTimelineDuration(template.config.duration);
        }
        
        // 5. Close left panel after applying
        const leftPanel = document.getElementById('leftPanel');
        const leftPanelToggle = document.getElementById('leftPanelToggle');
        const panelBackdrop = document.getElementById('panelBackdrop');
        if (leftPanel) {
            // Close overlay states on mobile/tablet
            leftPanel.classList.remove('mobile-open', 'tablet-open');
            // Collapse on desktop
            leftPanel.classList.add('collapsed');
            if (leftPanelToggle) leftPanelToggle.textContent = '»';
            if (typeof savePanelState === 'function') savePanelState();
        }
        if (panelBackdrop) panelBackdrop.classList.remove('visible');
        
        // Show success message
        showNotification(`"${template.name}" template applied successfully!`, 'success');
        
    } catch (error) {
        console.error('Error applying template:', error);
        showNotification('Failed to apply template. Please try again.', 'error');
    }
}

// Auto-attach events when DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { attachTemplateEvents(); attachFullPresetPreviewEvents(); });
    } else {
        attachTemplateEvents();
        attachFullPresetPreviewEvents();
    }
}

// Helper function for notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
