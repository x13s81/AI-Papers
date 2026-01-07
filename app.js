/**
 * Main Application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load and render layout
    State.loadLayout();
    Layout.render();
    
    // Initialize drag & drop
    Drag.init();
    
    // Reset layout button
    document.getElementById('btn-reset')?.addEventListener('click', () => {
        State.resetLayout();
        Layout.render();
    });
    
    // Help button
    document.getElementById('btn-help')?.addEventListener('click', () => {
        document.getElementById('help-tooltip').classList.toggle('visible');
    });
    
    document.getElementById('help-close')?.addEventListener('click', () => {
        document.getElementById('help-tooltip').classList.remove('visible');
    });
    
    // Modal
    const modal = document.getElementById('modal-add');
    const form = document.getElementById('form-add');
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
        }
    });
    
    document.getElementById('btn-cancel')?.addEventListener('click', () => {
        modal.classList.remove('visible');
    });
    
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        Papers.add({
            title: document.getElementById('inp-title').value,
            url: document.getElementById('inp-url').value,
            authors: document.getElementById('inp-authors').value,
            date: document.getElementById('inp-date').value,
            score: document.getElementById('inp-score').value
        });
        
        form.reset();
        modal.classList.remove('visible');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.visible').forEach(m => {
                m.classList.remove('visible');
            });
            document.getElementById('help-tooltip')?.classList.remove('visible');
        }
    });
});
