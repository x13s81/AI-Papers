const Layout = {
    render() {
        const ws = document.getElementById('workspace');
        ws.innerHTML = '';
        const el = this.renderNode(State.layout);
        if (el) ws.appendChild(el);
        this.initPanels();
        this.initResizers();
        this.updateDock();
    },
    
    renderNode(n) {
        if (!n) return null;
        if (n.type === 'h' || n.type === 'v') {
            const valid = n.children.filter(c => c.type === 'panel' ? c.tabs && c.tabs.length > 0 : true);
            if (!valid.length) return null;
            if (valid.length === 1) return this.renderNode(valid[0]);
            const div = document.createElement('div');
            div.className = n.type === 'h' ? 'dock-h' : 'dock-v';
            valid.forEach((c, i) => {
                if (i > 0) {
                    const r = document.createElement('div');
                    r.className = `resizer ${n.type === 'h' ? 'resizer-h' : 'resizer-v'}`;
                    r.dataset.idx = i;
                    div.appendChild(r);
                }
                const el = this.renderNode(c);
                if (el) {
                    if (c.size) { el.style[n.type === 'h' ? 'width' : 'height'] = c.size + 'px'; el.style.flexShrink = '0'; }
                    else { el.style.flex = '1'; }
                    div.appendChild(el);
                }
            });
            return div;
        }
        if (n.type === 'panel') return this.renderPanel(n);
        return null;
    },
    
    renderPanel(n) {
        if (!n.tabs || !n.tabs.length) return null;
        const p = document.createElement('div');
        p.className = 'panel';
        const bar = document.createElement('div');
        bar.className = 'tab-bar';
        n.tabs.forEach(id => {
            const def = State.panels[id];
            if (!def) return;
            const t = document.createElement('div');
            t.className = 'tab' + (n.active === id ? ' active' : '');
            t.dataset.id = id;
            t.innerHTML = `<span>${def.icon}</span>${def.title}<span class="tab-close" data-close="${id}">✕</span>`;
            t.onclick = (e) => { 
                if (e.target.dataset.close) {
                    e.stopPropagation();
                    this.closeTab(id);
                    return;
                }
                if (!Drag.isDragging) this.activateTab(p, id); 
            };
            bar.appendChild(t);
        });
        const acts = document.createElement('div');
        acts.className = 'tab-actions';
        acts.innerHTML = '<button class="tab-btn" onclick="Layout.maximize(this)">⤢</button>';
        bar.appendChild(acts);
        p.appendChild(bar);
        n.tabs.forEach(id => {
            const c = document.createElement('div');
            c.className = 'panel-content' + (n.active === id ? ' active' : '');
            c.dataset.id = id;
            c.innerHTML = this.getContent(id);
            p.appendChild(c);
        });
        return p;
    },
    
    closeTab(id) {
        this.removeTab(id);
        this.cleanup();
        State.saveLayout();
        this.render();
    },
    
    getContent(id) {
        const c = {
            papers: `<div class="search-area"><input class="search-input" id="search" placeholder="Search papers..."><select class="sort-select" id="sort"><option value="score-desc">⭐ Highest Rated</option><option value="score-asc">⭐ Lowest Rated</option><option value="date-desc">📅 Newest</option><option value="date-asc">📅 Oldest</option></select></div><div class="filter-tabs" id="filter-tabs"></div><div class="papers-list" id="papers-list"></div><div class="papers-footer"><button class="paper-btn add-paper-btn" id="btn-add">➕ Add Paper</button></div>`,
            search: `<div class="search-panel"><div class="search-header"><select class="search-source" id="search-source"><option value="arxiv">arXiv</option><option value="semantic">Semantic Scholar</option></select><div class="search-box"><input class="search-input" id="web-search" placeholder="Search papers..."><button class="search-btn" id="web-search-btn">🔍</button></div></div><div class="search-results" id="search-results"><div class="empty-state"><p>Search arXiv or Semantic Scholar<br>to find papers</p></div></div></div>`,
            pdf: `<div class="pdf-placeholder" id="pdf-ph"><div class="pdf-placeholder-icon">📄</div><p>Select a paper and click "PDF"<br>or upload your own</p><div class="upload-zone" id="upload-zone"><input type="file" id="pdf-file" accept=".pdf"><div class="upload-text"><strong>Click to upload</strong> or drag & drop<br>PDF files only</div></div></div><div class="pdf-toolbar" id="pdf-bar"><div class="pdf-title" id="pdf-title"></div><div class="pdf-links"><a href="#" id="pdf-link" target="_blank">Open ↗</a><button class="paper-btn" id="pdf-close">✕</button></div></div><iframe class="pdf-frame" id="pdf-frame"></iframe>`,
            editor: `<div class="editor-panel"><div class="editor-toolbar"><button class="editor-btn" data-cmd="bold" title="Bold">𝐁</button><button class="editor-btn" data-cmd="italic" title="Italic">𝐼</button><button class="editor-btn" data-cmd="heading" title="Section">§</button><button class="editor-btn" data-cmd="math" title="Inline Math">∑</button><button class="editor-btn" data-cmd="mathblock" title="Math Block">∫</button><button class="editor-btn" data-cmd="cite" title="Citation">📖</button><button class="editor-btn" data-cmd="ref" title="Reference">🔗</button><div class="editor-spacer"></div><button class="editor-btn" id="editor-preview-toggle">👁️ Preview</button><button class="editor-btn" id="editor-export">📥 Export .tex</button></div><div class="editor-container"><div class="editor-pane"><textarea class="editor-textarea" id="editor-textarea" placeholder="\\documentclass{article}
\\usepackage{amsmath}

\\title{Your Paper Title}
\\author{Your Name}

\\begin{document}
\\maketitle

\\section{Introduction}
Write your paper here...

\\end{document}"></textarea></div><div class="editor-preview" id="editor-preview"><div class="preview-content" id="preview-content"></div></div></div></div>`,
            chat: `<div class="chat-context" id="chat-ctx"><span class="status-dot"></span>Select a paper to start</div><div class="chat-messages" id="chat-msgs"><div class="message ai"><div class="message-avatar">🤖</div><div class="message-content">Hi! Select a paper or upload a PDF. I'll help you understand it.</div></div></div><div class="chat-input-area"><div class="quick-actions"><button class="quick-btn" data-q="Summarize this paper">Summarize</button><button class="quick-btn" data-q="What's the key contribution?">Key point</button><button class="quick-btn" data-q="Explain the method">Method</button><button class="quick-btn" data-q="What are the results?">Results</button></div><div class="chat-input-row"><textarea class="chat-input" id="chat-in" rows="1" placeholder="Ask about this paper..."></textarea><button class="chat-send" id="chat-send">Send</button></div></div>`,
            whiteboard: `<div class="wb-toolbar"><button class="wb-tool active" data-t="pen">✏️ Pen</button><button class="wb-tool" data-t="eraser">🧹 Eraser</button><button class="wb-tool" id="wb-clear">🗑️ Clear</button><div class="wb-separator"></div><button class="color-btn active" data-c="#ffffff" style="background:#ffffff"></button><button class="color-btn" data-c="#58a6ff" style="background:#58a6ff"></button><button class="color-btn" data-c="#f0883e" style="background:#f0883e"></button><button class="color-btn" data-c="#238636" style="background:#238636"></button><button class="color-btn" data-c="#da3633" style="background:#da3633"></button><div class="wb-spacer"></div><button class="wb-tool" id="wb-ai">🤖 Ask AI</button></div><div class="canvas-container"><canvas class="whiteboard-canvas" id="canvas"></canvas></div>`,
            notes: `<textarea class="notes-textarea" id="notes" placeholder="Your notes, equations, ideas..."></textarea>`
        };
        return c[id] || '<div class="empty-state">Unknown panel</div>';
    },
    
    activateTab(panel, id) {
        panel.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.id === id));
        panel.querySelectorAll('.panel-content').forEach(c => c.classList.toggle('active', c.dataset.id === id));
        this.updateState();
        if (id === 'whiteboard') setTimeout(() => Whiteboard.resize(), 50);
    },
    
    maximize(btn) {
        const p = btn.closest('.panel');
        p.classList.toggle('maximized');
        p.style.cssText = p.classList.contains('maximized') ? 'position:fixed;inset:48px 0 0 0;z-index:200;' : '';
        setTimeout(() => Whiteboard.resize(), 50);
    },
    
    updateState() {
        const walk = el => {
            if (el.classList.contains('panel')) {
                const tabs = [...el.querySelectorAll('.tab-bar>.tab')].map(t => t.dataset.id);
                return { type: 'panel', tabs, active: el.querySelector('.tab.active')?.dataset.id || tabs[0], size: parseInt(el.style.width) || parseInt(el.style.height) || null };
            }
            if (el.classList.contains('dock-h') || el.classList.contains('dock-v')) {
                return { type: el.classList.contains('dock-h') ? 'h' : 'v', children: [...el.children].filter(c => !c.classList.contains('resizer')).map(walk).filter(Boolean) };
            }
            return null;
        };
        const ws = document.getElementById('workspace');
        if (ws.firstChild) { State.layout = walk(ws.firstChild); State.saveLayout(); }
    },
    
    initPanels() { Papers.init(); Search.init(); PDF.init(); Editor.init(); Chat.init(); Whiteboard.init(); Notes.init(); },
    
    initResizers() {
        // Attach mousedown to each resizer (these get recreated each render, so no duplication)
        document.querySelectorAll('.resizer').forEach(r => {
            r.onmousedown = e => {
                e.preventDefault();
                Layout._resizer = {
                    el: r,
                    vert: r.classList.contains('resizer-v'),
                    start: r.classList.contains('resizer-v') ? e.clientY : e.clientX,
                    sibs: [...r.parentElement.children].filter(c => !c.classList.contains('resizer')),
                    idx: +r.dataset.idx
                };
                const rs = Layout._resizer;
                rs.sizes = [
                    rs.vert ? rs.sibs[rs.idx-1].offsetHeight : rs.sibs[rs.idx-1].offsetWidth,
                    rs.vert ? rs.sibs[rs.idx].offsetHeight : rs.sibs[rs.idx].offsetWidth
                ];
                r.classList.add('active');
                document.body.style.cursor = rs.vert ? 'row-resize' : 'col-resize';
                document.body.style.userSelect = 'none';
            };
        });
    },
    
    _resizer: null,
    
    _onResizerMove(e) {
        const rs = Layout._resizer;
        if (!rs) return;
        const d = (rs.vert ? e.clientY : e.clientX) - rs.start;
        const s1 = Math.max(150, rs.sizes[0] + d);
        const s2 = Math.max(150, rs.sizes[1] - d);
        if (rs.vert) {
            rs.sibs[rs.idx-1].style.height = s1+'px'; rs.sibs[rs.idx-1].style.flex = 'none';
            rs.sibs[rs.idx].style.height = s2+'px'; rs.sibs[rs.idx].style.flex = 'none';
        } else {
            rs.sibs[rs.idx-1].style.width = s1+'px'; rs.sibs[rs.idx-1].style.flex = 'none';
            rs.sibs[rs.idx].style.width = s2+'px'; rs.sibs[rs.idx].style.flex = 'none';
        }
    },
    
    _onResizerUp() {
        const rs = Layout._resizer;
        if (!rs) return;
        rs.el.classList.remove('active');
        Layout._resizer = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        Layout.updateState();
        Whiteboard.resize();
    },
    
    removeTab(id) {
        const rm = n => {
            if (n.type === 'panel') { const i = n.tabs.indexOf(id); if (i > -1) { n.tabs.splice(i, 1); if (n.active === id) n.active = n.tabs[0]; } }
            else if (n.children) n.children.forEach(rm);
        };
        rm(State.layout);
    },
    
    addTab(id, tgt) {
        const add = n => {
            if (n.type === 'panel' && tgt.some(t => n.tabs.includes(t))) { if (!n.tabs.includes(id)) { n.tabs.push(id); n.active = id; } return true; }
            if (n.children) for (let c of n.children) if (add(c)) return true;
            return false;
        };
        add(State.layout);
    },
    
    split(id, tgt, zone) {
        const np = { type: 'panel', tabs: [id], active: id, size: 300 };
        const sp = (n, p, i) => {
            if (n.type === 'panel' && tgt.some(t => n.tabs.includes(t))) {
                const dir = zone === 'left' || zone === 'right' ? 'h' : 'v';
                const nn = { type: dir, children: zone === 'left' || zone === 'top' ? [np, {...n, size: null}] : [{...n, size: null}, np] };
                if (p) p.children[i] = nn; else Object.assign(State.layout, nn);
                return true;
            }
            if (n.children) for (let j = 0; j < n.children.length; j++) if (sp(n.children[j], n, j)) return true;
            return false;
        };
        sp(State.layout, null, 0);
    },
    
    cleanup() {
        const cl = (n, p, i) => {
            if (n.children) {
                for (let j = n.children.length - 1; j >= 0; j--) cl(n.children[j], n, j);
                n.children = n.children.filter(c => c.type === 'panel' ? c.tabs && c.tabs.length > 0 : c.children && c.children.length > 0);
                if (n.children.length === 1) { const ch = n.children[0]; if (p) p.children[i] = {...ch, size: n.size || ch.size}; else Object.assign(State.layout, ch); }
            }
        };
        cl(State.layout, null, 0);
        if (State.layout.type === 'panel' && (!State.layout.tabs || !State.layout.tabs.length)) State.resetLayout();
    },
    
    getActiveTabs() {
        const tabs = new Set();
        const walk = n => {
            if (n.type === 'panel' && n.tabs) n.tabs.forEach(t => tabs.add(t));
            if (n.children) n.children.forEach(walk);
        };
        walk(State.layout);
        return tabs;
    },
    
    updateDock() {
        const dock = document.getElementById('dock-items');
        if (!dock) return;
        const active = this.getActiveTabs();
        dock.innerHTML = Object.entries(State.panels).map(([id, def]) => 
            `<div class="dock-item${active.has(id) ? ' hidden' : ''}" data-panel="${id}">${def.icon} ${def.title}</div>`
        ).join('');
    }
};
