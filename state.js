const State = {
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
    save() {
        localStorage.setItem('customPapers', JSON.stringify(this.papers.custom));
        localStorage.setItem('savedPapers', JSON.stringify(this.papers.saved));
    },
    saveLayout() { localStorage.setItem('layout', JSON.stringify(this.layout)); },
    loadLayout() {
        try {
            const s = localStorage.getItem('layout');
            this.layout = s ? JSON.parse(s) : JSON.parse(JSON.stringify(this.defaultLayout));
        } catch { this.layout = JSON.parse(JSON.stringify(this.defaultLayout)); }
    },
    resetLayout() {
        this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
        this.saveLayout();
    }
};
