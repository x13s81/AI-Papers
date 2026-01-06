/**
 * State Management
 * Central state store for the application
 */

const State = {
    // Papers data
    papers: {
        all: [],
        custom: JSON.parse(localStorage.getItem('customPapers') || '[]'),
        saved: JSON.parse(localStorage.getItem('savedPapers') || '[]'),
        selected: null,
        currentTab: 'all'
    },
    
    // Chat state
    chat: {
        history: [],
        isTyping: false
    },
    
    // PDF state
    pdf: {
        uploadedUrl: null,
        uploadedName: null
    },
    
    // Whiteboard state
    whiteboard: {
        tool: 'pen',
        color: '#ffffff',
        isDrawing: false
    },
    
    // Layout state
    layout: null,
    
    // Default layout configuration
    defaultLayout: {
        type: 'horizontal',
        children: [
            { 
                type: 'panel', 
                tabs: ['papers'], 
                activeTab: 'papers', 
                size: 350 
            },
            { 
                type: 'vertical', 
                size: null, 
                children: [
                    { 
                        type: 'panel', 
                        tabs: ['pdf'], 
                        activeTab: 'pdf', 
                        size: null 
                    },
                    { 
                        type: 'panel', 
                        tabs: ['whiteboard', 'notes'], 
                        activeTab: 'whiteboard', 
                        size: 300 
                    }
                ]
            },
            { 
                type: 'panel', 
                tabs: ['chat'], 
                activeTab: 'chat', 
                size: 380 
            }
        ]
    },
    
    // Panel definitions
    panelDefs: {
        papers: { id: 'papers', title: 'Papers', icon: '📚' },
        pdf: { id: 'pdf', title: 'PDF Viewer', icon: '📄' },
        chat: { id: 'chat', title: 'Ask AI', icon: '💬' },
        whiteboard: { id: 'whiteboard', title: 'Whiteboard', icon: '🎨' },
        notes: { id: 'notes', title: 'Notes', icon: '📝' }
    },
    
    // Save methods
    savePapers() {
        localStorage.setItem('customPapers', JSON.stringify(this.papers.custom));
        localStorage.setItem('savedPapers', JSON.stringify(this.papers.saved));
    },
    
    saveLayout() {
        localStorage.setItem('dockLayout', JSON.stringify(this.layout));
    },
    
    loadLayout() {
        const saved = localStorage.getItem('dockLayout');
        if (saved) {
            try {
                this.layout = JSON.parse(saved);
            } catch (e) {
                this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
            }
        } else {
            this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
        }
    },
    
    resetLayout() {
        this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
        this.saveLayout();
    }
};

// Helper to get today's date
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '?';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
