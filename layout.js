/**
 * Layout Management
 */
const Layout = {
    render() {
        const workspace = document.getElementById('workspace');
        workspace.innerHTML = '';
        const el = this.renderNode(State.layout);
        if (el) workspace.appendChild(el);
        this.initPanels();
        this.initResizers();
    },
    
    renderNode(node) {
        if (!node) return null;
        
        if (node.type === 'h' || node.type === 'v') {
            // Filter valid children
            const validChildren = node.children.filter(c => 
                c.type === 'panel' ? c.tabs && c.tabs.length > 0 : true
            );
            
            if (validChildren.length === 0) return null;
            if (validChildren.length === 1) return this.renderNode(validChildren[0]);
            
            const container = document.createElement('div');
            container.className = node.type === 'h' ? 'dock-h' : 'dock-v';
            
            validChildren.forEach((child, i) => {
                // Add resizer before each child except first
                if (i > 0) {
                    const resizer = document.createElement('div');
                    resizer.className = `resizer ${node.type === 'h' ? 'resizer-h' : 'resizer-v'}`;
                    resizer.dataset.idx = i;
                    container.appendChild(resizer);
                }
                
                const childEl = this.renderNode(child);
                if (childEl) {
                    if (child.size) {
                        childEl.style[node.type === 'h' ? 'width' : 'height'] = child.size + 'px';
                        childEl.style.flexShrink = '0';
                    } else {
                        childEl.style.flex = '1';
                    }
                    container.appendChild(childEl);
                }
            });
            
            return container;
        }
        
        if (node.type === 'panel') {
            return this.renderPanel(node);
        }
        
        return null;
    },
    
    renderPanel(node) {
        if (!node.tabs || node.tabs.length === 0) return null;
        
        const panel = document.createElement('div');
        panel.className = 'panel';
        
        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.className = 'tab-bar';
        
        node.tabs.forEach(id => {
            const def = State.panels[id];
            if (!def) return;
            
            const tab = document.createElement('div');
            tab.className = `tab${node.active === id ? ' active' : ''}`;
            tab.dataset.id = id;
            tab.innerHTML = `<span>${def.icon}</span>${def.title}`;
            tab.addEventListener('click', () => {
                if (!Drag.isDragging) this.activateTab(panel, id);
            });
            tabBar.appendChild(tab);
        });
        
        // Tab actions
        const actions = document.createElement('div');
        actions.className = 'tab-actions';
        actions.innerHTML = '<button class="tab-btn" onclick="Layout.maximize(this)">⤢</button>';
        tabBar.appendChild(actions);
        
        panel.appendChild(tabBar);
        
        // Panel contents
        node.tabs.forEach(id => {
            const content = document.createElement('div');
            content.className = `panel-content${node.active === id ? ' active' : ''}`;
            content.dataset.id = id;
            content.innerHTML = this.getContent(id);
            panel.appendChild(content);
        });
        
        return panel;
    },
    
    getContent(id) {
        const contents = {
            papers: `
                <div class="search-area">
                    <input class="search-input" id="search" placeholder="Search papers...">
                    <select class="sort-select" id="sort">
                        <option value="score-desc">⭐ Highest Rated</option>
                        <option value="score-asc">⭐ Lowest Rated</option>
                        <option value="date-desc">📅 Newest</option>
                        <option value="date-asc">📅 Oldest</option>
                    </select>
                </div>
                <div class="filter-tabs" id="filter-tabs"></div>
                <div class="papers-list" id="papers-list"></div>
                <div class="papers-footer">
                    <button class="paper-btn add-paper-btn" id="btn-add">➕ Add Paper</button>
                </div>
            `,
            pdf: `
                <div class="pdf-placeholder" id="pdf-ph">
                    <div class="pdf-placeholder-icon">📄</div>
                    <p>Select a paper and click "PDF"<br>or upload your own</p>
                    <div class="upload-zone" id="upload-zone">
                        <input type="file" id="pdf-file" accept=".pdf">
                        <div class="upload-text">
                            <strong>Click to upload</strong> or drag & drop<br>
                            PDF files only
                        </div>
                    </div>
                </div>
                <div class="pdf-toolbar" id="pdf-bar">
                    <div class="pdf-title" id="pdf-title"></div>
                    <div class="pdf-links">
                        <a href="#" id="pdf-link" target="_blank">Open ↗</a>
                        <button class="paper-btn" id="pdf-close">✕</button>
                    </div>
                </div>
                <iframe class="pdf-frame" id="pdf-frame"></iframe>
            `,
            chat: `
                <div class="chat-context" id="chat-ctx">
                    <span class="status-dot"></span>Select a paper to start
                </div>
                <div class="chat-messages" id="chat-msgs">
                    <div class="message ai">
                        <div class="message-avatar">🤖</div>
                        <div class="message-content">Hi! Select a paper or upload a PDF. I'll help you understand it.</div>
                    </div>
                </div>
                <div class="chat-input-area">
                    <div class="quick-actions">
                        <button class="quick-btn" data-q="Summarize this paper">Summarize</button>
                        <button class="quick-btn" data-q="What's the key contribution?">Key point</button>
                        <button class="quick-btn" data-q="Explain the method">Method</button>
                        <button class="quick-btn" data-q="What are the results?">Results</button>
                    </div>
                    <div class="chat-input-row">
                        <textarea class="chat-input" id="chat-in" rows="1" placeholder="Ask about this paper..."></textarea>
                        <button class="chat-send" id="chat-send">Send</button>
                    </div>
                </div>
            `,
            whiteboard: `
                <div class="wb-toolbar">
                    <button class="wb-tool active" data-t="pen">✏️ Pen</button>
                    <button class="wb-tool" data-t="eraser">🧹 Eraser</button>
                    <button class="wb-tool" id="wb-clear">🗑️ Clear</button>
                    <div class="wb-separator"></div>
                    <button class="color-btn active" data-c="#ffffff" style="background:#ffffff"></button>
                    <button class="color-btn" data-c="#58a6ff" style="background:#58a6ff"></button>
                    <button class="color-btn" data-c="#f0883e" style="background:#f0883e"></button>
                    <button class="color-btn" data-c="#238636" style="background:#238636"></button>
                    <button class="color-btn" data-c="#da3633" style="background:#da3633"></button>
                    <div class="wb-spacer"></div>
                    <button class="wb-tool" id="wb-ai">🤖 Ask AI</button>
                </div>
                <div class="canvas-container">
                    <canvas class="whiteboard-canvas" id="canvas"></canvas>
                </div>
            `,
            notes: `<textarea class="notes-textarea" id="notes" placeholder="Your notes, equations, ideas..."></textarea>`
        };
        return contents[id] || '<div class="empty-state">Unknown panel</div>';
    },
    
    activateTab(panel, id) {
        panel.querySelectorAll('.tab').forEach(t => 
            t.classList.toggle('active', t.dataset.id === id)
        );
        panel.querySelectorAll('.panel-content').forEach(c => 
            c.classList.toggle('active', c.dataset.id === id)
        );
        this.updateState();
        if (id === 'whiteboard') setTimeout(() => Whiteboard.resize(), 50);
    },
    
    maximize(btn) {
        const panel = btn.closest('.panel');
        panel.classList.toggle('maximized');
        panel.style.cssText = panel.classList.contains('maximized') 
            ? 'position:fixed;inset:48px 0 0 0;z-index:200;' 
            : '';
        setTimeout(() => Whiteboard.resize(), 50);
    },
    
    updateState() {
        const walk = (el) => {
            if (el.classList.contains('panel')) {
                const tabs = [...el.querySelectorAll('.tab-bar > .tab')].map(t => t.dataset.id);
                const active = el.querySelector('.tab.active')?.dataset.id || tabs[0];
                const size = parseInt(el.style.width) || parseInt(el.style.height) || null;
                return { type: 'panel', tabs, active, size };
            }
            if (el.classList.contains('dock-h') || el.classList.contains('dock-v')) {
                const type = el.classList.contains('dock-h') ? 'h' : 'v';
                const children = [...el.children]
                    .filter(c => !c.classList.contains('resizer'))
                    .map(walk)
                    .filter(Boolean);
                return { type, children };
            }
            return null;
        };
        
        const workspace = document.getElementById('workspace');
        if (workspace.firstChild) {
            State.layout = walk(workspace.firstChild);
            State.saveLayout();
        }
    },
    
    initPanels() {
        Papers.init();
        PDF.init();
        Chat.init();
        Whiteboard.init();
        Notes.init();
    },
    
    initResizers() {
        let active = null;
        let startPos = 0;
        let startSizes = [];
        let siblings = [];
        let isVertical = false;
        
        document.querySelectorAll('.resizer').forEach(r => {
            r.addEventListener('mousedown', (e) => {
                e.preventDefault();
                active = r;
                isVertical = r.classList.contains('resizer-v');
                startPos = isVertical ? e.clientY : e.clientX;
                
                const parent = r.parentElement;
                siblings = [...parent.children].filter(c => !c.classList.contains('resizer'));
                const idx = parseInt(r.dataset.idx);
                
                startSizes = [
                    isVertical ? siblings[idx - 1].offsetHeight : siblings[idx - 1].offsetWidth,
                    isVertical ? siblings[idx].offsetHeight : siblings[idx].offsetWidth
                ];
                
                r.classList.add('active');
                document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
                document.body.style.userSelect = 'none';
            });
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!active) return;
            
            const idx = parseInt(active.dataset.idx);
            const delta = (isVertical ? e.clientY : e.clientX) - startPos;
            const newSize1 = Math.max(150, startSizes[0] + delta);
            const newSize2 = Math.max(150, startSizes[1] - delta);
            
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
        
        document.addEventListener('mouseup', () => {
            if (active) {
                active.classList.remove('active');
                active = null;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                this.updateState();
                Whiteboard.resize();
            }
        });
    },
    
    // Layout manipulation methods
    removeTab(tabId) {
        const remove = (node) => {
            if (node.type === 'panel') {
                const idx = node.tabs.indexOf(tabId);
                if (idx > -1) {
                    node.tabs.splice(idx, 1);
                    if (node.active === tabId) {
                        node.active = node.tabs[0] || null;
                    }
                }
            } else if (node.children) {
                node.children.forEach(remove);
            }
        };
        remove(State.layout);
    },
    
    addTab(tabId, targetTabs) {
        const add = (node) => {
            if (node.type === 'panel' && targetTabs.some(t => node.tabs.includes(t))) {
                if (!node.tabs.includes(tabId)) {
                    node.tabs.push(tabId);
                    node.active = tabId;
                }
                return true;
            }
            if (node.children) {
                for (let c of node.children) {
                    if (add(c)) return true;
                }
            }
            return false;
        };
        add(State.layout);
    },
    
    split(tabId, targetTabs, zone) {
        const newPanel = { type: 'panel', tabs: [tabId], active: tabId, size: 300 };
        
        const doSplit = (node, parent, index) => {
            if (node.type === 'panel' && targetTabs.some(t => node.tabs.includes(t))) {
                const direction = (zone === 'left' || zone === 'right') ? 'h' : 'v';
                const newNode = {
                    type: direction,
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
                    if (doSplit(node.children[i], node, i)) return true;
                }
            }
            return false;
        };
        
        doSplit(State.layout, null, 0);
    },
    
    cleanup() {
        const clean = (node, parent, index) => {
            if (node.children) {
                // Clean children first
                for (let i = node.children.length - 1; i >= 0; i--) {
                    clean(node.children[i], node, i);
                }
                
                // Remove empty children
                node.children = node.children.filter(c => 
                    c.type === 'panel' ? c.tabs && c.tabs.length > 0 : c.children && c.children.length > 0
                );
                
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
        };
        
        clean(State.layout, null, 0);
        
        // If root is empty, reset
        if (State.layout.type === 'panel' && (!State.layout.tabs || State.layout.tabs.length === 0)) {
            State.resetLayout();
        }
    }
};
