/**
 * Layout Management
 * Handles the dock layout rendering and manipulation
 */

const Layout = {
    /**
     * Render the entire layout
     */
    render() {
        const workspace = document.getElementById('workspace');
        workspace.innerHTML = '';
        
        const rendered = this.renderNode(State.layout);
        if (rendered) {
            workspace.appendChild(rendered);
        }
        
        // Initialize panel contents after rendering
        Panels.initAll();
        this.initResizers();
    },
    
    /**
     * Render a single layout node (recursive)
     */
    renderNode(node) {
        if (!node) return null;
        
        if (node.type === 'horizontal' || node.type === 'vertical') {
            return this.renderDockArea(node);
        } else if (node.type === 'panel') {
            return this.renderPanel(node);
        }
        
        return null;
    },
    
    /**
     * Render a dock area (horizontal or vertical container)
     */
    renderDockArea(node) {
        // Filter out empty panels
        const validChildren = node.children.filter(child => {
            if (child.type === 'panel') {
                return child.tabs && child.tabs.length > 0;
            }
            return true;
        });
        
        // If empty, return null
        if (validChildren.length === 0) return null;
        
        // If only one child, just render that child
        if (validChildren.length === 1) {
            const child = this.renderNode(validChildren[0]);
            if (child && node.size) {
                if (node.type === 'horizontal') {
                    child.style.width = node.size + 'px';
                } else {
                    child.style.height = node.size + 'px';
                }
            }
            return child;
        }
        
        // Create container
        const container = document.createElement('div');
        container.className = node.type === 'horizontal' ? 'dock-horizontal' : 'dock-vertical';
        
        // Render children with resizers between them
        validChildren.forEach((child, index) => {
            // Add resizer before each child except first
            if (index > 0) {
                const resizer = document.createElement('div');
                resizer.className = `resizer ${node.type === 'horizontal' ? 'resizer-h' : 'resizer-v'}`;
                resizer.dataset.index = index;
                container.appendChild(resizer);
            }
            
            // Render child
            const childEl = this.renderNode(child);
            if (childEl) {
                // Apply size
                if (child.size) {
                    if (node.type === 'horizontal') {
                        childEl.style.width = child.size + 'px';
                        childEl.style.flexShrink = '0';
                    } else {
                        childEl.style.height = child.size + 'px';
                        childEl.style.flexShrink = '0';
                    }
                } else {
                    childEl.style.flex = '1';
                }
                container.appendChild(childEl);
            }
        });
        
        return container;
    },
    
    /**
     * Render a panel (tab container)
     */
    renderPanel(node) {
        if (!node.tabs || node.tabs.length === 0) return null;
        
        const panel = document.createElement('div');
        panel.className = 'panel';
        
        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';
        
        node.tabs.forEach(tabId => {
            const def = State.panelDefs[tabId];
            if (!def) return;
            
            const tab = document.createElement('div');
            tab.className = `tab ${node.activeTab === tabId ? 'active' : ''}`;
            tab.dataset.panelId = tabId;
            tab.innerHTML = `<span class="tab-icon">${def.icon}</span>${def.title}`;
            
            tab.addEventListener('click', () => {
                if (!DragDrop.isDragging) {
                    this.activateTab(panel, tabId);
                }
            });
            
            tabBar.appendChild(tab);
        });
        
        // Tab actions
        const actions = document.createElement('div');
        actions.className = 'tab-actions';
        actions.innerHTML = `
            <button class="tab-btn" data-tooltip="Maximize" onclick="Layout.toggleMaximize(this)">⤢</button>
        `;
        tabBar.appendChild(actions);
        
        panel.appendChild(tabBar);
        
        // Panel contents
        node.tabs.forEach(tabId => {
            const content = document.createElement('div');
            content.className = `panel-content ${node.activeTab === tabId ? 'active' : ''}`;
            content.dataset.panelId = tabId;
            content.innerHTML = Panels.getContent(tabId);
            panel.appendChild(content);
        });
        
        return panel;
    },
    
    /**
     * Activate a tab in a panel
     */
    activateTab(panelEl, tabId) {
        // Update tab states
        panelEl.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panelId === tabId);
        });
        
        // Update content visibility
        panelEl.querySelectorAll('.panel-content').forEach(content => {
            content.classList.toggle('active', content.dataset.panelId === tabId);
        });
        
        // Update layout state
        this.updateState();
        
        // Special handling for whiteboard
        if (tabId === 'whiteboard') {
            setTimeout(() => Whiteboard.resize(), 50);
        }
    },
    
    /**
     * Toggle panel maximize
     */
    toggleMaximize(btn) {
        const panel = btn.closest('.panel');
        panel.classList.toggle('maximized');
        
        if (panel.classList.contains('maximized')) {
            panel.style.cssText = 'position: fixed; inset: 48px 0 0 0; z-index: 200;';
        } else {
            panel.style.cssText = '';
        }
        
        setTimeout(() => Whiteboard.resize(), 50);
    },
    
    /**
     * Update layout state from DOM
     */
    updateState() {
        const workspace = document.getElementById('workspace');
        if (!workspace.firstChild) return;
        
        State.layout = this.walkDOM(workspace.firstChild);
        State.saveLayout();
    },
    
    /**
     * Walk DOM and build layout state
     */
    walkDOM(el) {
        if (el.classList.contains('panel')) {
            const tabs = Array.from(el.querySelectorAll('.tab-bar > .tab'))
                .map(t => t.dataset.panelId);
            const activeTab = el.querySelector('.tab.active')?.dataset.panelId || tabs[0];
            const size = parseInt(el.style.width) || parseInt(el.style.height) || null;
            
            return { type: 'panel', tabs, activeTab, size };
        } else if (el.classList.contains('dock-horizontal') || el.classList.contains('dock-vertical')) {
            const isHorizontal = el.classList.contains('dock-horizontal');
            const children = Array.from(el.children)
                .filter(c => !c.classList.contains('resizer'))
                .map(c => this.walkDOM(c))
                .filter(Boolean);
            
            return {
                type: isHorizontal ? 'horizontal' : 'vertical',
                children,
                size: parseInt(el.style.width) || parseInt(el.style.height) || null
            };
        }
        return null;
    },
    
    /**
     * Initialize resizers
     */
    initResizers() {
        let activeResizer = null;
        let startPos = 0;
        let startSizes = [];
        let siblings = [];
        let isVertical = false;
        
        // Mouse down on resizer
        document.querySelectorAll('.resizer').forEach(resizer => {
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                activeResizer = resizer;
                isVertical = resizer.classList.contains('resizer-v');
                startPos = isVertical ? e.clientY : e.clientX;
                
                const parent = resizer.parentElement;
                siblings = Array.from(parent.children).filter(c => !c.classList.contains('resizer'));
                const idx = parseInt(resizer.dataset.index);
                
                startSizes = [
                    isVertical ? siblings[idx - 1].offsetHeight : siblings[idx - 1].offsetWidth,
                    isVertical ? siblings[idx].offsetHeight : siblings[idx].offsetWidth
                ];
                
                resizer.classList.add('active');
                document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
                document.body.style.userSelect = 'none';
            });
        });
        
        // Mouse move
        document.addEventListener('mousemove', (e) => {
            if (!activeResizer) return;
            
            const idx = parseInt(activeResizer.dataset.index);
            const delta = (isVertical ? e.clientY : e.clientX) - startPos;
            const minSize = 150;
            
            const newSize1 = Math.max(minSize, startSizes[0] + delta);
            const newSize2 = Math.max(minSize, startSizes[1] - delta);
            
            if (isVertical) {
                siblings[idx - 1].style.height = newSize1 + 'px';
                siblings[idx - 1].style.flex = 'none';
                siblings[idx].style.height = newSize2 + 'px';
                siblings[idx].style.flex = 'none';
            } else {
                siblings[idx - 1].style.width = newSize1 + 'px';
                siblings[idx - 1].style.flex = 'none';
                siblings[idx].style.width = newSize2 + 'px';
                siblings[idx].style.flex = 'none';
            }
        });
        
        // Mouse up
        document.addEventListener('mouseup', () => {
            if (activeResizer) {
                activeResizer.classList.remove('active');
                activeResizer = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                this.updateState();
                Whiteboard.resize();
            }
        });
    },
    
    /**
     * Remove a tab from layout state
     */
    removeTab(tabId) {
        function remove(node) {
            if (node.type === 'panel') {
                const idx = node.tabs.indexOf(tabId);
                if (idx > -1) {
                    node.tabs.splice(idx, 1);
                    if (node.activeTab === tabId) {
                        node.activeTab = node.tabs[0] || null;
                    }
                }
            } else if (node.children) {
                node.children.forEach(remove);
            }
        }
        remove(State.layout);
    },
    
    /**
     * Add a tab to a panel
     */
    addTabToPanel(tabId, targetTabs) {
        function add(node) {
            if (node.type === 'panel' && targetTabs.some(t => node.tabs.includes(t))) {
                if (!node.tabs.includes(tabId)) {
                    node.tabs.push(tabId);
                    node.activeTab = tabId;
                }
                return true;
            }
            if (node.children) {
                for (let c of node.children) {
                    if (add(c)) return true;
                }
            }
            return false;
        }
        add(State.layout);
    },
    
    /**
     * Split a panel
     */
    splitPanel(tabId, targetTabs, zone) {
        const newPanel = { type: 'panel', tabs: [tabId], activeTab: tabId, size: 300 };
        
        function split(node, parent, index) {
            if (node.type === 'panel' && targetTabs.some(t => node.tabs.includes(t))) {
                const direction = (zone === 'left' || zone === 'right') ? 'horizontal' : 'vertical';
                const newNode = {
                    type: direction,
                    size: node.size,
                    children: (zone === 'left' || zone === 'top')
                        ? [newPanel, { ...node, size: null }]
                        : [{ ...node, size: null }, newPanel]
                };
                
                if (parent) {
                    parent.children[index] = newNode;
                } else {
                    Object.assign(State.layout, newNode);
                }
                return true;
            }
            if (node.children) {
                for (let i = 0; i < node.children.length; i++) {
                    if (split(node.children[i], node, i)) return true;
                }
            }
            return false;
        }
        split(State.layout, null, 0);
    },
    
    /**
     * Clean up empty panels from layout
     */
    cleanup() {
        function clean(node, parent, index) {
            if (node.children) {
                // Clean children first
                for (let i = node.children.length - 1; i >= 0; i--) {
                    clean(node.children[i], node, i);
                }
                
                // Remove empty children
                node.children = node.children.filter(c => {
                    if (c.type === 'panel') return c.tabs && c.tabs.length > 0;
                    if (c.children) return c.children.length > 0;
                    return true;
                });
                
                // Collapse single-child containers
                if (node.children.length === 1) {
                    const child = node.children[0];
                    if (parent) {
                        parent.children[index] = { ...child, size: node.size || child.size };
                    } else {
                        Object.assign(State.layout, child);
                    }
                }
            }
        }
        clean(State.layout, null, 0);
        
        // Final check - if root is empty
        if (State.layout.type === 'panel' && (!State.layout.tabs || State.layout.tabs.length === 0)) {
            State.resetLayout();
        }
    }
};
