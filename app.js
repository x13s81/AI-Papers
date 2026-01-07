document.addEventListener('DOMContentLoaded', () => {
    State.loadLayout();
    Layout.render();
    Drag.init();
    
    // Global listeners for resizers (registered once, not on every render)
    document.addEventListener('mousemove', e => Layout._onResizerMove(e));
    document.addEventListener('mouseup', () => Layout._onResizerUp());
    
    document.getElementById('btn-reset')?.addEventListener('click', () => {
        State.resetLayout();
        Layout.render();
    });
    
    document.getElementById('btn-help')?.addEventListener('click', () => {
        document.getElementById('help-tooltip').classList.toggle('visible');
    });
    
    document.getElementById('help-close')?.addEventListener('click', () => {
        document.getElementById('help-tooltip').classList.remove('visible');
    });
    
    const modal = document.getElementById('modal-add');
    modal?.addEventListener('click', e => {
        if (e.target === modal) modal.classList.remove('visible');
    });
    
    document.getElementById('btn-cancel')?.addEventListener('click', () => {
        modal.classList.remove('visible');
    });
    
    document.getElementById('form-add')?.addEventListener('submit', e => {
        e.preventDefault();
        Papers.add({
            title: document.getElementById('inp-title').value,
            url: document.getElementById('inp-url').value,
            authors: document.getElementById('inp-authors').value,
            date: document.getElementById('inp-date').value,
            score: document.getElementById('inp-score').value
        });
        document.getElementById('form-add').reset();
        modal.classList.remove('visible');
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.visible').forEach(m => m.classList.remove('visible'));
            document.getElementById('help-tooltip')?.classList.remove('visible');
        }
    });
});
