const Papers = {
    init() {
        document.getElementById('search')?.addEventListener('input', () => this.filter());
        document.getElementById('sort')?.addEventListener('change', () => this.filter());
        document.getElementById('btn-add')?.addEventListener('click', () => document.getElementById('modal-add').classList.add('visible'));
        this.load();
    },
    
    async load() {
        try {
            const r = await fetch('papers.json');
            if (r.ok) { State.papers.all = (await r.json()).papers || []; }
        } catch { State.papers.all = this.sample(); }
        this.renderTabs();
        this.filter();
    },
    
    sample() {
        return [
            { id: '1', title: 'Scaling Open-Ended Reasoning', authors: 'Nikhil Chandak et al.', pubDateISO: '2025-01-05', score: 9, tags: ['cs.AI'], abstract: 'Novel approach...', pdf_link: 'https://arxiv.org/pdf/2412.01.pdf', link: 'https://arxiv.org/abs/2412.01' },
            { id: '2', title: 'Can We Trust AI Explanations?', authors: 'Deep Mehta', pubDateISO: '2025-01-04', score: 9, tags: ['cs.AI'], abstract: 'Chain-of-thought...', pdf_link: 'https://arxiv.org/pdf/2412.02.pdf', link: 'https://arxiv.org/abs/2412.02' },
            { id: '3', title: 'DiffThinker: Multimodal Reasoning', authors: 'Zefeng He', pubDateISO: '2025-01-03', score: 8, tags: ['cs.CV'], abstract: 'Diffusion models...', pdf_link: 'https://arxiv.org/pdf/2412.03.pdf', link: 'https://arxiv.org/abs/2412.03' },
            { id: '4', title: 'Taming Hallucinations in MLLMs', authors: 'Zhe Huang', pubDateISO: '2025-01-02', score: 8, tags: ['cs.CV'], abstract: 'Video understanding...', pdf_link: 'https://arxiv.org/pdf/2412.04.pdf', link: 'https://arxiv.org/abs/2412.04' },
            { id: '5', title: 'JavisGPT: Multi-modal Video LLM', authors: 'Kai Liu', pubDateISO: '2025-01-01', score: 8, tags: ['cs.CV'], abstract: 'Unified model...', pdf_link: 'https://arxiv.org/pdf/2412.05.pdf', link: 'https://arxiv.org/abs/2412.05' }
        ];
    },
    
    renderTabs() {
        const el = document.getElementById('filter-tabs');
        if (!el) return;
        const today = new Date().toISOString().split('T')[0];
        const all = [...State.papers.all, ...State.papers.custom];
        const counts = {
            today: State.papers.all.filter(p => p.pubDateISO === today).length,
            all: all.length,
            top: all.filter(p => p.score >= 8).length,
            saved: State.papers.saved.length,
            mine: State.papers.custom.length
        };
        el.innerHTML = [{id:'today',l:'Today'},{id:'all',l:'All'},{id:'top',l:'🔥 Top'},{id:'saved',l:'💾'},{id:'mine',l:'📁'}]
            .map(t => `<div class="filter-tab${State.papers.tab===t.id?' active':''}" data-tab="${t.id}">${t.l}<span class="count">${counts[t.id]}</span></div>`).join('');
        el.querySelectorAll('.filter-tab').forEach(t => t.onclick = () => { State.papers.tab = t.dataset.tab; this.renderTabs(); this.filter(); });
    },
    
    filter() {
        const search = (document.getElementById('search')?.value || '').toLowerCase();
        const sort = document.getElementById('sort')?.value || 'score-desc';
        const today = new Date().toISOString().split('T')[0];
        let papers = State.papers.tab === 'today' ? State.papers.all.filter(p => p.pubDateISO === today)
            : State.papers.tab === 'top' ? [...State.papers.all, ...State.papers.custom].filter(p => p.score >= 8)
            : State.papers.tab === 'saved' ? [...State.papers.all, ...State.papers.custom].filter(p => State.papers.saved.includes(p.id))
            : State.papers.tab === 'mine' ? State.papers.custom
            : [...State.papers.all, ...State.papers.custom];
        if (search) papers = papers.filter(p => p.title.toLowerCase().includes(search) || (p.authors||'').toLowerCase().includes(search));
        const [f, d] = sort.split('-');
        papers.sort((a, b) => { const va = f === 'score' ? (a.score||0) : (a.pubDateISO||''), vb = f === 'score' ? (b.score||0) : (b.pubDateISO||''); return d === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1); });
        this.render(papers);
    },
    
    render(papers) {
        const el = document.getElementById('papers-list');
        if (!el) return;
        if (!papers.length) { el.innerHTML = '<div class="empty-state">No papers found</div>'; return; }
        el.innerHTML = papers.map(p => {
            const sc = p.score >= 8 ? 'high' : p.score >= 6 ? 'medium' : 'low';
            const saved = State.papers.saved.includes(p.id);
            const sel = State.papers.selected?.id === p.id;
            const date = new Date(p.pubDateISO).toLocaleDateString('en-US', {month:'short',day:'numeric'});
            return `<div class="paper-card${sel?' selected':''}" data-id="${p.id}"><div class="paper-title">${p.title}</div><div class="paper-meta"><span class="paper-date">📅 ${date}</span><span>${p.authors||'Unknown'}</span><span class="paper-score ${sc}">${p.score}/10</span></div><div class="paper-actions">${p.pdf_link?`<button class="paper-btn primary" data-action="pdf">📄 PDF</button>`:''}<button class="paper-btn${saved?' saved':''}" data-action="save">${saved?'✓ Saved':'Save'}</button><a class="paper-btn" href="${p.link}" target="_blank">↗</a></div></div>`;
        }).join('');
        el.querySelectorAll('.paper-card').forEach(c => {
            c.onclick = e => { if (e.target.closest('[data-action]') || e.target.tagName === 'A') return; this.select(c.dataset.id); };
            c.querySelector('[data-action="pdf"]')?.addEventListener('click', () => PDF.openPaper(c.dataset.id));
            c.querySelector('[data-action="save"]')?.addEventListener('click', () => this.toggleSave(c.dataset.id));
        });
    },
    
    select(id) {
        State.papers.selected = [...State.papers.all, ...State.papers.custom].find(p => p.id === id);
        const ctx = document.getElementById('chat-ctx');
        if (ctx && State.papers.selected) ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${State.papers.selected.title}</strong>`;
        this.filter();
    },
    
    toggleSave(id) {
        const i = State.papers.saved.indexOf(id);
        if (i > -1) State.papers.saved.splice(i, 1);
        else State.papers.saved.push(id);
        State.save();
        this.renderTabs();
        this.filter();
    },
    
    add(data) {
        State.papers.custom.unshift({
            id: 'c-' + Date.now(),
            title: data.title,
            link: data.url,
            pdf_link: data.url.includes('arxiv.org/abs/') ? data.url.replace('/abs/','/pdf/')+'.pdf' : null,
            authors: data.authors || 'Unknown',
            pubDateISO: data.date || new Date().toISOString().split('T')[0],
            score: parseInt(data.score) || 7,
            tags: [],
            isCustom: true
        });
        State.save();
        State.papers.tab = 'mine';
        this.renderTabs();
        this.filter();
    }
};
