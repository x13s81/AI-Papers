/**
 * Panels
 * Panel content templates and initialization
 */

const Panels = {
    /**
     * Get HTML content for a panel
     */
    getContent(panelId) {
        switch (panelId) {
            case 'papers':
                return this.getPapersContent();
            case 'pdf':
                return this.getPdfContent();
            case 'chat':
                return this.getChatContent();
            case 'whiteboard':
                return this.getWhiteboardContent();
            case 'notes':
                return this.getNotesContent();
            default:
                return '<div class="empty-state">Unknown panel</div>';
        }
    },
    
    /**
     * Papers panel content
     */
    getPapersContent() {
        return `
            <div class="papers-search">
                <input type="text" class="search-input" id="search-input" placeholder="Search papers...">
                <select class="sort-select" id="sort-select">
                    <option value="score-desc">⭐ Highest Rated</option>
                    <option value="score-asc">⭐ Lowest Rated</option>
                    <option value="date-desc">📅 Newest</option>
                    <option value="date-asc">📅 Oldest</option>
                </select>
            </div>
            <div class="filter-tabs" id="filter-tabs"></div>
            <div class="papers-list" id="papers-list">
                <div class="empty-state">Loading papers...</div>
            </div>
            <div class="papers-footer">
                <button class="paper-btn add-paper-btn" id="btn-add-paper">➕ Add Paper</button>
            </div>
        `;
    },
    
    /**
     * PDF panel content
     */
    getPdfContent() {
        return `
            <div class="pdf-placeholder" id="pdf-placeholder">
                <div class="pdf-placeholder-icon">📄</div>
                <p>Select a paper and click "PDF"<br>or upload your own</p>
                <div class="upload-zone" id="upload-zone">
                    <input type="file" id="pdf-upload" accept=".pdf">
                    <div class="upload-text">
                        <strong>Click to upload</strong> or drag & drop<br>
                        PDF files only
                    </div>
                </div>
            </div>
            <div class="pdf-toolbar" id="pdf-toolbar">
                <div class="pdf-title" id="pdf-title"></div>
                <div class="pdf-links">
                    <a href="#" id="pdf-newtab" target="_blank">Open in new tab ↗</a>
                    <a href="#" id="pdf-paper-link" target="_blank">Paper page ↗</a>
                    <button class="paper-btn" id="btn-close-pdf">✕ Close</button>
                </div>
            </div>
            <iframe class="pdf-frame" id="pdf-frame"></iframe>
        `;
    },
    
    /**
     * Chat panel content
     */
    getChatContent() {
        return `
            <div class="chat-context" id="chat-context">
                <span class="status-dot online"></span>
                Select a paper to start
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="message ai">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content">
                        Hi! Select a paper or upload a PDF. I'll help you understand it.
                    </div>
                </div>
            </div>
            <div class="chat-input-area">
                <div class="quick-actions">
                    <button class="quick-btn" data-prompt="Summarize this paper">Summarize</button>
                    <button class="quick-btn" data-prompt="What's the key contribution?">Key point</button>
                    <button class="quick-btn" data-prompt="Explain the method">Method</button>
                    <button class="quick-btn" data-prompt="What are the main results?">Results</button>
                </div>
                <div class="chat-input-row">
                    <textarea class="chat-input" id="chat-input" rows="1" placeholder="Ask about this paper..."></textarea>
                    <button class="chat-send" id="btn-send">Send</button>
                </div>
            </div>
        `;
    },
    
    /**
     * Whiteboard panel content
     */
    getWhiteboardContent() {
        return `
            <div class="whiteboard-toolbar">
                <button class="wb-tool active" data-tool="pen">✏️ Pen</button>
                <button class="wb-tool" data-tool="eraser">🧹 Eraser</button>
                <button class="wb-tool" id="btn-clear-canvas">🗑️ Clear</button>
                <div class="wb-separator"></div>
                <button class="color-btn active" data-color="#ffffff" style="background: #ffffff"></button>
                <button class="color-btn" data-color="#58a6ff" style="background: #58a6ff"></button>
                <button class="color-btn" data-color="#f0883e" style="background: #f0883e"></button>
                <button class="color-btn" data-color="#238636" style="background: #238636"></button>
                <button class="color-btn" data-color="#da3633" style="background: #da3633"></button>
                <div class="wb-spacer"></div>
                <button class="wb-tool" id="btn-ask-about-drawing">🤖 Ask AI</button>
            </div>
            <div class="canvas-container">
                <canvas class="whiteboard-canvas" id="whiteboard-canvas"></canvas>
            </div>
        `;
    },
    
    /**
     * Notes panel content
     */
    getNotesContent() {
        return `
            <textarea class="notes-textarea" id="notes-textarea" placeholder="Your notes, equations, ideas..."></textarea>
        `;
    },
    
    /**
     * Initialize all panel contents
     */
    initAll() {
        Papers.init();
        PDF.init();
        Chat.init();
        Whiteboard.init();
        this.initNotes();
    },
    
    /**
     * Initialize notes
     */
    initNotes() {
        const textarea = document.getElementById('notes-textarea');
        if (!textarea) return;
        
        textarea.value = localStorage.getItem('notes') || '';
        textarea.addEventListener('input', () => {
            localStorage.setItem('notes', textarea.value);
        });
    }
};
