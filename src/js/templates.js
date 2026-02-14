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
    const closeModal = () => {
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
    const handleEsc = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleEsc);
    
    // Remove event listener when modal closes
    modal.addEventListener('remove', () => {
        document.removeEventListener('keydown', handleEsc);
    });
    
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
        if (leftPanel) {
            leftPanel.classList.remove('open');
        }
        
        // Show success message
        showNotification(`"${template.name}" template applied successfully!`, 'success');
        
    } catch (error) {
        console.error('Error applying template:', error);
        showNotification('Failed to apply template. Please try again.', 'error');
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

