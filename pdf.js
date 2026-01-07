/**
 * PDF Viewer
 */
const PDF = {
    init() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('pdf-file');
        const closeBtn = document.getElementById('pdf-close');
        
        // Click to upload
        uploadZone?.addEventListener('click', () => fileInput?.click());
        
        // Drag and drop
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        
        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        
        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.loadFile(file);
            }
        });
        
        // File input change
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadFile(file);
        });
        
        // Close button
        closeBtn?.addEventListener('click', () => this.close());
    },
    
    openPaper(paperId) {
        const paper = [...State.papers.all, ...State.papers.custom].find(p => p.id === paperId);
        if (!paper || !paper.pdf_link) return;
        
        State.papers.selected = paper;
        this.show(paper.pdf_link, paper.title, paper.link);
        
        // Update chat context
        const ctx = document.getElementById('chat-ctx');
        if (ctx) {
            ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${paper.title}</strong>`;
        }
        
        Chat.addMessage('ai', `Opened "<strong>${paper.title}</strong>". What would you like to know?`);
        Papers.filter();
    },
    
    loadFile(file) {
        // Clean up previous upload
        if (State.pdf.url) {
            URL.revokeObjectURL(State.pdf.url);
        }
        
        State.pdf.url = URL.createObjectURL(file);
        State.pdf.name = file.name;
        
        // Create pseudo-paper for context
        State.papers.selected = {
            title: file.name,
            authors: 'Uploaded PDF',
            abstract: '',
            tags: []
        };
        
        this.show(State.pdf.url, file.name, null);
        
        // Update chat context
        const ctx = document.getElementById('chat-ctx');
        if (ctx) {
            ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${file.name}</strong>`;
        }
        
        Chat.addMessage('ai', `Opened your PDF "<strong>${file.name}</strong>". What would you like to know?`);
    },
    
    show(url, title, paperLink) {
        const placeholder = document.getElementById('pdf-ph');
        const toolbar = document.getElementById('pdf-bar');
        const frame = document.getElementById('pdf-frame');
        const titleEl = document.getElementById('pdf-title');
        const linkEl = document.getElementById('pdf-link');
        
        if (placeholder) placeholder.style.display = 'none';
        if (toolbar) toolbar.classList.add('visible');
        if (frame) {
            frame.classList.add('visible');
            frame.src = url;
        }
        if (titleEl) titleEl.textContent = title;
        if (linkEl) linkEl.href = url;
    },
    
    close() {
        const placeholder = document.getElementById('pdf-ph');
        const toolbar = document.getElementById('pdf-bar');
        const frame = document.getElementById('pdf-frame');
        
        if (placeholder) placeholder.style.display = '';
        if (toolbar) toolbar.classList.remove('visible');
        if (frame) {
            frame.classList.remove('visible');
            frame.src = '';
        }
        
        // Clean up uploaded file
        if (State.pdf.url) {
            URL.revokeObjectURL(State.pdf.url);
            State.pdf.url = null;
            State.pdf.name = null;
        }
    }
};
