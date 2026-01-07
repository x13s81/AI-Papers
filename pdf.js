const PDF = {
    init() {
        const zone = document.getElementById('upload-zone');
        const file = document.getElementById('pdf-file');
        zone?.addEventListener('click', () => file?.click());
        zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
        zone?.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
        zone?.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files[0]?.type === 'application/pdf') this.loadFile(e.dataTransfer.files[0]);
        });
        file?.addEventListener('change', e => { if (e.target.files[0]) this.loadFile(e.target.files[0]); });
        document.getElementById('pdf-close')?.addEventListener('click', () => this.close());
    },
    
    openPaper(id) {
        const p = [...State.papers.all, ...State.papers.custom].find(x => x.id === id);
        if (!p?.pdf_link) return;
        State.papers.selected = p;
        this.show(p.pdf_link, p.title, p.link);
        const ctx = document.getElementById('chat-ctx');
        if (ctx) ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${p.title}</strong>`;
        Chat.addMessage('ai', `Opened "<strong>${p.title}</strong>". What would you like to know?`);
        Papers.filter();
    },
    
    loadFile(file) {
        if (State.pdf.url) URL.revokeObjectURL(State.pdf.url);
        State.pdf.url = URL.createObjectURL(file);
        State.pdf.name = file.name;
        State.papers.selected = { title: file.name, authors: 'Uploaded PDF', abstract: '', tags: [] };
        this.show(State.pdf.url, file.name, null);
        const ctx = document.getElementById('chat-ctx');
        if (ctx) ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${file.name}</strong>`;
        Chat.addMessage('ai', `Opened your PDF "<strong>${file.name}</strong>". What would you like to know?`);
    },
    
    show(url, title, link) {
        const ph = document.getElementById('pdf-ph');
        const bar = document.getElementById('pdf-bar');
        const frame = document.getElementById('pdf-frame');
        if (ph) ph.style.display = 'none';
        if (bar) bar.classList.add('visible');
        if (frame) { frame.classList.add('visible'); frame.src = url; }
        const t = document.getElementById('pdf-title');
        const l = document.getElementById('pdf-link');
        if (t) t.textContent = title;
        if (l) l.href = url;
    },
    
    close() {
        const ph = document.getElementById('pdf-ph');
        const bar = document.getElementById('pdf-bar');
        const frame = document.getElementById('pdf-frame');
        if (ph) ph.style.display = '';
        if (bar) bar.classList.remove('visible');
        if (frame) { frame.classList.remove('visible'); frame.src = ''; }
        if (State.pdf.url) { URL.revokeObjectURL(State.pdf.url); State.pdf.url = null; State.pdf.name = null; }
    }
};
