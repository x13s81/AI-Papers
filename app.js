/**
 * App
 * Main application initialization
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        // Load saved layout
        State.loadLayout();
        
        // Render layout
        Layout.render();
        
        // Initialize drag & drop
        DragDrop.init();
        
        // Bind global events
        this.bindEvents();
    },
    
    /**
     * Bind global event listeners
     */
    bindEvents() {
        // Reset layout button
        const resetBtn = document.getElementById('btn-reset-layout');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                State.resetLayout();
                Layout.render();
            });
        }
        
        // Help button
        const helpBtn = document.getElementById('btn-help');
        const helpTooltip = document.getElementById('help-tooltip');
        const helpClose = document.getElementById('help-close');
        
        if (helpBtn && helpTooltip) {
            helpBtn.addEventListener('click', () => {
                helpTooltip.classList.toggle('visible');
            });
        }
        
        if (helpClose && helpTooltip) {
            helpClose.addEventListener('click', () => {
                helpTooltip.classList.remove('visible');
            });
        }
        
        // Add paper modal
        const modal = document.getElementById('modal-add-paper');
        const form = document.getElementById('form-add-paper');
        const cancelBtn = document.getElementById('btn-cancel-paper');
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('visible');
                }
            });
        }
        
        if (cancelBtn && modal) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('visible');
            });
        }
        
        if (form && modal) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                Papers.addPaper({
                    title: document.getElementById('input-title').value,
                    url: document.getElementById('input-url').value,
                    authors: document.getElementById('input-authors').value,
                    date: document.getElementById('input-date').value,
                    score: document.getElementById('input-score').value,
                    tags: document.getElementById('input-tags').value
                });
                
                form.reset();
                modal.classList.remove('visible');
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.visible').forEach(m => {
                    m.classList.remove('visible');
                });
                document.getElementById('help-tooltip')?.classList.remove('visible');
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
