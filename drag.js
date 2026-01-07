/**
 * Drag & Drop
 */
const Drag = {
    isDragging: false,
    draggedId: null,
    sourcePanel: null,
    
    init() {
        const workspace = document.getElementById('workspace');
        const preview = document.getElementById('drag-preview');
        const indicator = document.getElementById('drop-indicator');
        
        // Mouse down - start drag
        workspace.addEventListener('mousedown', (e) => {
            const tab = e.target.closest('.tab');
            if (!tab || e.target.closest('.tab-actions')) return;
            
            e.preventDefault();
            
            this.isDragging = true;
            this.draggedId = tab.dataset.id;
            this.sourcePanel = tab.closest('.panel');
            
            // Show preview
            preview.textContent = tab.textContent;
            preview.style.display = 'block';
            preview.style.left = (e.clientX + 12) + 'px';
            preview.style.top = (e.clientY + 12) + 'px';
            
            tab.classList.add('dragging');
        });
        
        // Mouse move - update preview and indicator
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            // Update preview position
            preview.style.left = (e.clientX + 12) + 'px';
            preview.style.top = (e.clientY + 12) + 'px';
            
            // Find panel under cursor
            const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
            const targetPanel = elemUnder?.closest('.panel');
            
            if (targetPanel && targetPanel !== this.sourcePanel) {
                this.showIndicator(targetPanel, e.clientX, e.clientY);
            } else {
                indicator.style.display = 'none';
                indicator.textContent = '';
            }
        });
        
        // Mouse up - complete drop
        document.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            
            // Hide preview
            preview.style.display = 'none';
            
            // Remove dragging class
            document.querySelectorAll('.tab.dragging').forEach(t => {
                t.classList.remove('dragging');
            });
            
            // Process drop if indicator is showing
            if (indicator.style.display === 'flex') {
                const zone = indicator.dataset.zone;
                const targetTabs = indicator.dataset.target.split(',');
                
                // Perform layout changes
                Layout.removeTab(this.draggedId);
                
                if (zone === 'center') {
                    Layout.addTab(this.draggedId, targetTabs);
                } else {
                    Layout.split(this.draggedId, targetTabs, zone);
                }
                
                Layout.cleanup();
                State.saveLayout();
                Layout.render();
            }
            
            // Reset
            indicator.style.display = 'none';
            indicator.textContent = '';
            this.isDragging = false;
            this.draggedId = null;
            this.sourcePanel = null;
        });
    },
    
    showIndicator(panel, mouseX, mouseY) {
        const indicator = document.getElementById('drop-indicator');
        const rect = panel.getBoundingClientRect();
        
        // Calculate relative position (0-1)
        const relX = (mouseX - rect.left) / rect.width;
        const relY = (mouseY - rect.top) / rect.height;
        
        // Tab bar is top 40px
        const inTabBar = mouseY < rect.top + 40;
        
        // 25% edge zones
        const edge = 0.25;
        let zone = 'center';
        
        if (inTabBar) {
            zone = 'center';
        } else if (relX < edge) {
            zone = 'left';
        } else if (relX > 1 - edge) {
            zone = 'right';
        } else if (relY < edge + (40 / rect.height)) {
            zone = 'top';
        } else if (relY > 1 - edge) {
            zone = 'bottom';
        }
        
        // Position indicator
        indicator.style.display = 'flex';
        const pad = 4;
        
        switch (zone) {
            case 'center':
                indicator.style.left = (rect.left + pad) + 'px';
                indicator.style.top = (rect.top + pad) + 'px';
                indicator.style.width = (rect.width - pad * 2) + 'px';
                indicator.style.height = '36px';
                break;
            case 'left':
                indicator.style.left = (rect.left + pad) + 'px';
                indicator.style.top = (rect.top + pad) + 'px';
                indicator.style.width = (rect.width * 0.5 - pad) + 'px';
                indicator.style.height = (rect.height - pad * 2) + 'px';
                break;
            case 'right':
                indicator.style.left = (rect.left + rect.width * 0.5) + 'px';
                indicator.style.top = (rect.top + pad) + 'px';
                indicator.style.width = (rect.width * 0.5 - pad) + 'px';
                indicator.style.height = (rect.height - pad * 2) + 'px';
                break;
            case 'top':
                indicator.style.left = (rect.left + pad) + 'px';
                indicator.style.top = (rect.top + pad) + 'px';
                indicator.style.width = (rect.width - pad * 2) + 'px';
                indicator.style.height = (rect.height * 0.5 - pad) + 'px';
                break;
            case 'bottom':
                indicator.style.left = (rect.left + pad) + 'px';
                indicator.style.top = (rect.top + rect.height * 0.5) + 'px';
                indicator.style.width = (rect.width - pad * 2) + 'px';
                indicator.style.height = (rect.height * 0.5 - pad) + 'px';
                break;
        }
        
        // Store data
        indicator.dataset.zone = zone;
        indicator.dataset.target = [...panel.querySelectorAll('.tab')].map(t => t.dataset.id).join(',');
        
        // Show label
        const labels = {
            center: '➕ Add as tab',
            left: '◀ Split left',
            right: 'Split right ▶',
            top: '▲ Split top',
            bottom: 'Split bottom ▼'
        };
        indicator.textContent = labels[zone] || '';
    }
};
