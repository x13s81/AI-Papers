const State = {
    debug: true, // Set to true to see layout changes in console
    papers: {
        all: [],
        custom: JSON.parse(localStorage.getItem('customPapers') || '[]'),
        saved: JSON.parse(localStorage.getItem('savedPapers') || '[]'),
        selected: null,
        tab: 'all'
    },
    chat: { history: [], typing: false },
    pdf: { url: null, name: null },
    wb: { tool: 'pen', color: '#ffffff' },
    layout: null,
    defaultLayout: {
        type: 'h',
        children: [
            { type: 'panel', tabs: ['papers', 'search'], active: 'papers', size: 350 },
            { type: 'v', children: [
                { type: 'panel', tabs: ['pdf', 'editor'], active: 'pdf' },
                { type: 'panel', tabs: ['whiteboard', 'notes'], active: 'whiteboard', size: 300 }
            ]},
            { type: 'panel', tabs: ['chat'], active: 'chat', size: 380 }
        ]
    },
    panels: {
        papers: { id: 'papers', title: 'Papers', icon: '📚' },
        search: { id: 'search', title: 'Search', icon: '🔍' },
        pdf: { id: 'pdf', title: 'PDF Viewer', icon: '📄' },
        editor: { id: 'editor', title: 'LaTeX Editor', icon: '✏️' },
        chat: { id: 'chat', title: 'Ask AI', icon: '💬' },
        whiteboard: { id: 'whiteboard', title: 'Whiteboard', icon: '🎨' },
        notes: { id: 'notes', title: 'Notes', icon: '📝' }
    },
    log(action, data) {
        if (this.debug) {
            console.log(`[${action}]`, JSON.stringify(data || this.layout, null, 2));
        }
    },
    save() {
        localStorage.setItem('customPapers', JSON.stringify(this.papers.custom));
        localStorage.setItem('savedPapers', JSON.stringify(this.papers.saved));
    },
    saveLayout() { 
        this.log('SAVE_LAYOUT', this.layout);
        localStorage.setItem('layout', JSON.stringify(this.layout)); 
    },
    loadLayout() {
        try {
            const s = localStorage.getItem('layout');
            if (s) {
                this.layout = JSON.parse(s);
                this.log('LOAD_LAYOUT (from storage)');
            } else {
                this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
                this.log('LOAD_LAYOUT (default)');
            }
        } catch (e) { 
            console.error('Failed to load layout:', e);
            this.layout = JSON.parse(JSON.stringify(this.defaultLayout)); 
        }
    },
    resetLayout() {
        localStorage.removeItem('layout'); // Clear saved layout
        this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
        this.log('RESET_LAYOUT');
        this.saveLayout();
    }
};
