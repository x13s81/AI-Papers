/**
 * PDF Viewer
 * PDF loading and display
 */

const PDF = {
    /**
     * Initialize PDF panel
     */
    init() {
        this.bindEvents();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Upload zone click
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.addEventListener('click', () => {
                document.getElementById('pdf-upload')?.click();
            });
            
            // Drag and drop
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });
            
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'application/pdf') {
                    this.loadFile(file);
                }
            });
        }
        
        // File input change
        const fileInput = document.getElementById('pdf-upload');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadFile(file);
                }
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('btn-close-pdf');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    },
    
    /**
     * Open a paper's PDF
     */
    openPaper(paperId) {
        const paper = [...State.papers.all, ...State.papers.custom]
            .find(p => p.id === paperId);
        
        if (!paper || !paper.pdf_link) return;
        
        // Select the paper
        State.papers.selected = paper;
        
        // Update UI
        this.show(paper.pdf_link, paper.title, paper.link);
        
        // Update chat context
        const context = document.getElementById('chat-context');
        if (context) {
            context.innerHTML = `<span class="status-dot online"></span> Discussing: <strong>${paper.title}</strong>`;
        }
        
        // Add chat message
        Chat.addMessage('ai', `Opened "<strong>${paper.title}</strong>". What would you like to know?`);
        
        // Update papers list
        Papers.filterAndRender();
    },
    
    /**
     * Load an uploaded PDF file
     */
    loadFile(file) {
        // Clean up previous upload
        if (State.pdf.uploadedUrl) {
            URL.revokeObjectURL(State.pdf.uploadedUrl);
        }
        
        // Create blob URL
        State.pdf.uploadedUrl = URL.createObjectURL(file);
        State.pdf.uploadedName = file.name;
        
        // Create pseudo-paper for chat context
        State.papers.selected = {
            title: file.name,
            authors: 'Uploaded PDF',
            abstract: '',
            tags: []
        };
        
        // Update UI
        this.show(State.pdf.uploadedUrl, file.name, null);
        
        // Update chat context
        const context = document.getElementById('chat-context');
        if (context) {
            context.innerHTML = `<span class="status-dot online"></span> Discussing: <strong>${file.name}</strong>`;
        }
        
        // Add chat message
        Chat.addMessage('ai', `Opened your PDF "<strong>${file.name}</strong>". What would you like to know?`);
    },
    
    /**
     * Show PDF viewer
     */
    show(url, title, paperLink) {
        const placeholder = document.getElementById('pdf-placeholder');
        const toolbar = document.getElementById('pdf-toolbar');
        const frame = document.getElementById('pdf-frame');
        const titleEl = document.getElementById('pdf-title');
        const newTabLink = document.getElementById('pdf-newtab');
        const paperLinkEl = document.getElementById('pdf-paper-link');
        
        if (placeholder) placeholder.style.display = 'none';
        if (toolbar) toolbar.classList.add('visible');
        if (frame) {
            frame.classList.add('visible');
            frame.src = url;
        }
        if (titleEl) titleEl.textContent = title;
        if (newTabLink) newTabLink.href = url;
        if (paperLinkEl) {
            if (paperLink) {
                paperLinkEl.href = paperLink;
                paperLinkEl.style.display = '';
            } else {
                paperLinkEl.style.display = 'none';
            }
        }
    },
    
    /**
     * Close PDF viewer
     */
    close() {
        const placeholder = document.getElementById('pdf-placeholder');
        const toolbar = document.getElementById('pdf-toolbar');
        const frame = document.getElementById('pdf-frame');
        
        if (placeholder) placeholder.style.display = '';
        if (toolbar) toolbar.classList.remove('visible');
        if (frame) {
            frame.classList.remove('visible');
            frame.src = '';
        }
        
        // Clean up uploaded file
        if (State.pdf.uploadedUrl) {
            URL.revokeObjectURL(State.pdf.uploadedUrl);
            State.pdf.uploadedUrl = null;
            State.pdf.uploadedName = null;
        }
    }
};
