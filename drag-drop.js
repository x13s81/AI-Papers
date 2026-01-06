/**
 * Drag & Drop
 * Handles tab dragging and panel reorganization
 */

const DragDrop = {
    isDragging: false,
    draggedTabId: null,
    sourcePanel: null,
    
    /**
     * Initialize drag & drop
     */
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
            this.draggedTabId = tab.dataset.panelId;
            this.sourcePanel = tab.closest('.panel');
            
            // Show preview
            preview.textContent = tab.textContent;
            preview.style.display = 'block';
            preview.style.left = e.clientX + 12 + 'px';
            preview.style.top = e.clientY + 12 + 'px';
            
            tab.classList.add('dragging');
        });
        
        // Mouse move - update preview and indicator
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            // Update preview position
            preview.style.left = e.clientX + 12 + 'px';
            preview.style.top = e.clientY + 12 + 'px';
            
            // Find panel under cursor
            const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
            const targetPanel = elemUnder?.closest('.panel');
            
            if (targetPanel && targetPanel !== this.sourcePanel) {
                this.showDropIndicator(targetPanel, e.clientX, e.clientY);
            } else {
                indicator.style.display = 'none'; indicator.textContent = '';
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
                const targetTabs = indicator.dataset.targetTabs.split(',');
                
                // Perform the layout change
                Layout.removeTab(this.draggedTabId);
                
                if (zone === 'center') {
                    Layout.addTabToPanel(this.draggedTabId, targetTabs);
                } else {
                    Layout.splitPanel(this.draggedTabId, targetTabs, zone);
                }
                
                Layout.cleanup();
                State.saveLayout();
                Layout.render();
            }
            
            // Reset state
            indicator.style.display = 'none'; indicator.textContent = '';
            this.isDragging = false;
            this.draggedTabId = null;
            this.sourcePanel = null;
        });
    },
    
    /**
     * Show drop indicator for a target panel
     * Uses proportional zones (25% edges) for easier vertical/horizontal splits
     */
    showDropIndicator(panel, mouseX, mouseY) {
        const indicator = document.getElementById('drop-indicator');
        const rect = panel.getBoundingClientRect();
        
        // Calculate relative position (0-1)
        const relX = (mouseX - rect.left) / rect.width;
        const relY = (mouseY - rect.top) / rect.height;
        
        // Tab bar is the top 40px
        const tabBarHeight = 40;
        const inTabBar = mouseY < rect.top + tabBarHeight;
        
        // Use 25% edges for drop zones - proportional to panel size
        const edgeRatio = 0.25;
        let zone = 'center';
        
        if (inTabBar) {
            zone = 'center'; // Drop in tab bar = merge as tab
        } else if (relX < edgeRatio) {
            zone = 'left';
        } else if (relX > 1 - edgeRatio) {
            zone = 'right';
        } else if (relY < edgeRatio + (tabBarHeight / rect.height)) {
            zone = 'top';
        } else if (relY > 1 - edgeRatio) {
            zone = 'bottom';
        } else {
            zone = 'center';
        }
        
        // Position indicator with padding
        indicator.style.display = 'flex';
        const pad = 4;
        
        switch (zone) {
            case 'center':
                indicator.style.left = rect.left + pad + 'px';
                indicator.style.top = rect.top + pad + 'px';
                indicator.style.width = rect.width - pad * 2 + 'px';
                indicator.style.height = tabBarHeight - pad + 'px';
                break;
            case 'left':
                indicator.style.left = rect.left + pad + 'px';
                indicator.style.top = rect.top + pad + 'px';
                indicator.style.width = rect.width * 0.5 - pad + 'px';
                indicator.style.height = rect.height - pad * 2 + 'px';
                break;
            case 'right':
                indicator.style.left = rect.left + rect.width * 0.5 + 'px';
                indicator.style.top = rect.top + pad + 'px';
                indicator.style.width = rect.width * 0.5 - pad + 'px';
                indicator.style.height = rect.height - pad * 2 + 'px';
                break;
            case 'top':
                indicator.style.left = rect.left + pad + 'px';
                indicator.style.top = rect.top + pad + 'px';
                indicator.style.width = rect.width - pad * 2 + 'px';
                indicator.style.height = rect.height * 0.5 - pad + 'px';
                break;
            case 'bottom':
                indicator.style.left = rect.left + pad + 'px';
                indicator.style.top = rect.top + rect.height * 0.5 + 'px';
                indicator.style.width = rect.width - pad * 2 + 'px';
                indicator.style.height = rect.height * 0.5 - pad + 'px';
                break;
        }
        
        // Store zone and target info
        indicator.dataset.zone = zone;
        indicator.dataset.targetTabs = Array.from(panel.querySelectorAll('.tab'))
            .map(t => t.dataset.panelId)
            .join(',');
        
        // Show zone label
        indicator.textContent = this.getZoneLabel(zone);
    },
    
    /**
     * Get label for drop zone
     */
    getZoneLabel(zone) {
        const labels = {
            center: '➕ Add as tab',
            left: '◀ Split left',
            right: 'Split right ▶',
            top: '▲ Split top',
            bottom: 'Split bottom ▼'
        };
        return labels[zone] || '';
    }
};
