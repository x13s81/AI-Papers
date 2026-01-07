/**
 * Papers Management
 */
const Papers = {
    init() {
        const search = document.getElementById('search');
        const sort = document.getElementById('sort');
        const addBtn = document.getElementById('btn-add');
        
        search?.addEventListener('input', () => this.filter());
        sort?.addEventListener('change', () => this.filter());
        addBtn?.addEventListener('click', () => {
            document.getElementById('modal-add').classList.add('visible');
        });
        
        this.load();
    },
    
    async load() {
        try {
            const response = await fetch('papers.json');
            if (response.ok) {
                const data = await response.json();
                State.papers.all = data.papers || [];
            }
        } catch {
            State.papers.all = this.getSamplePapers();
        }
        
        this.renderTabs();
        this.filter();
    },
    
    getSamplePapers() {
        return [
            {
                id: '1',
                title: 'Scaling Open-Ended Reasoning to Predict the Future',
                authors: 'Nikhil Chandak, Shashwat Goel, Ameya Prabhu',
                pubDateISO: '2025-01-05',
                score: 9,
                tags: ['cs.AI', 'cs.LG'],
                abstract: 'We present a novel approach to scaling open-ended reasoning systems that can predict future events with remarkable accuracy.',
                pdf_link: 'https://arxiv.org/pdf/2412.01.pdf',
                link: 'https://arxiv.org/abs/2412.01'
            },
            {
                id: '2',
                title: 'Can We Trust AI Explanations? Evidence of Systematic Underreporting',
                authors: 'Deep Pankajbhai Mehta, Sarah Chen',
                pubDateISO: '2025-01-04',
                score: 9,
                tags: ['cs.AI', 'cs.CL'],
                abstract: 'Chain-of-thought reasoning has become standard, but our analysis reveals systematic gaps between stated and actual reasoning.',
                pdf_link: 'https://arxiv.org/pdf/2412.02.pdf',
                link: 'https://arxiv.org/abs/2412.02'
            },
            {
                id: '3',
                title: 'DiffThinker: Generative Multimodal Reasoning with Diffusion',
                authors: 'Zefeng He, Xiaoye Qu, Wei Liu',
                pubDateISO: '2025-01-03',
                score: 8,
                tags: ['cs.CV', 'cs.AI'],
                abstract: 'We introduce DiffThinker, a novel framework combining diffusion models with multimodal reasoning.',
                pdf_link: 'https://arxiv.org/pdf/2412.03.pdf',
                link: 'https://arxiv.org/abs/2412.03'
            },
            {
                id: '4',
                title: 'Taming Hallucinations: Boosting MLLMs Video Understanding',
                authors: 'Zhe Huang, Hao Wen, Michael Zhang',
                pubDateISO: '2025-01-02',
                score: 8,
                tags: ['cs.CV', 'cs.MM'],
                abstract: 'Multimodal large language models suffer from hallucinations. We present techniques to reduce this.',
                pdf_link: 'https://arxiv.org/pdf/2412.04.pdf',
                link: 'https://arxiv.org/abs/2412.04'
            },
            {
                id: '5',
                title: 'JavisGPT: Unified Multi-modal LLM for Sounding-Video',
                authors: 'Kai Liu, Jungang Li, Anna Rodriguez',
                pubDateISO: '2025-01-01',
                score: 8,
                tags: ['cs.CV', 'cs.SD'],
                abstract: 'We present JavisGPT, a unified model for understanding video with audio.',
                pdf_link: 'https://arxiv.org/pdf/2412.05.pdf',
                link: 'https://arxiv.org/abs/2412.05'
            }
        ];
    },
    
    renderTabs() {
        const container = document.getElementById('filter-tabs');
        if (!container) return;
        
        const today = new Date().toISOString().split('T')[0];
        const all = [...State.papers.all, ...State.papers.custom];
        
        const counts = {
            today: State.papers.all.filter(p => p.pubDateISO === today).length,
            all: all.length,
            top: all.filter(p => p.score >= 8).length,
            saved: State.papers.saved.length,
            mine: State.papers.custom.length
        };
        
        const tabs = [
            { id: 'today', label: 'Today' },
            { id: 'all', label: 'All' },
            { id: 'top', label: '🔥 Top' },
            { id: 'saved', label: '💾' },
            { id: 'mine', label: '📁' }
        ];
        
        container.innerHTML = tabs.map(t => `
            <div class="filter-tab${State.papers.tab === t.id ? ' active' : ''}" data-tab="${t.id}">
                ${t.label}<span class="count">${counts[t.id]}</span>
            </div>
        `).join('');
        
        container.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                State.papers.tab = tab.dataset.tab;
                this.renderTabs();
                this.filter();
            });
        });
    },
    
    filter() {
        const searchEl = document.getElementById('search');
        const sortEl = document.getElementById('sort');
        
        const search = (searchEl?.value || '').toLowerCase();
        const sort = sortEl?.value || 'score-desc';
        const today = new Date().toISOString().split('T')[0];
        
        // Get papers based on current tab
        let papers;
        switch (State.papers.tab) {
            case 'today':
                papers = State.papers.all.filter(p => p.pubDateISO === today);
                break;
            case 'top':
                papers = [...State.papers.all, ...State.papers.custom].filter(p => p.score >= 8);
                break;
            case 'saved':
                papers = [...State.papers.all, ...State.papers.custom].filter(p => 
                    State.papers.saved.includes(p.id)
                );
                break;
            case 'mine':
                papers = State.papers.custom;
                break;
            default:
                papers = [...State.papers.all, ...State.papers.custom];
        }
        
        // Apply search filter
        if (search) {
            papers = papers.filter(p =>
                p.title.toLowerCase().includes(search) ||
                (p.authors || '').toLowerCase().includes(search)
            );
        }
        
        // Apply sorting
        const [field, direction] = sort.split('-');
        papers.sort((a, b) => {
            const valA = field === 'score' ? (a.score || 0) : (a.pubDateISO || '');
            const valB = field === 'score' ? (b.score || 0) : (b.pubDateISO || '');
            return direction === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
        
        this.render(papers);
    },
    
    render(papers) {
        const container = document.getElementById('papers-list');
        if (!container) return;
        
        if (!papers.length) {
            container.innerHTML = '<div class="empty-state">No papers found</div>';
            return;
        }
        
        container.innerHTML = papers.map(paper => {
            const scoreClass = paper.score >= 8 ? 'high' : paper.score >= 6 ? 'medium' : 'low';
            const isSaved = State.papers.saved.includes(paper.id);
            const isSelected = State.papers.selected?.id === paper.id;
            const dateStr = new Date(paper.pubDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return `
                <div class="paper-card${isSelected ? ' selected' : ''}" data-id="${paper.id}">
                    <div class="paper-title">${paper.title}</div>
                    <div class="paper-meta">
                        <span class="paper-date">📅 ${dateStr}</span>
                        <span>${paper.authors || 'Unknown'}</span>
                        <span class="paper-score ${scoreClass}">${paper.score}/10</span>
                    </div>
                    <div class="paper-actions">
                        ${paper.pdf_link ? `<button class="paper-btn primary" data-action="pdf">📄 PDF</button>` : ''}
                        <button class="paper-btn${isSaved ? ' saved' : ''}" data-action="save">
                            ${isSaved ? '✓ Saved' : 'Save'}
                        </button>
                        <a class="paper-btn" href="${paper.link}" target="_blank">↗</a>
                    </div>
                </div>
            `;
        }).join('');
        
        // Bind events
        container.querySelectorAll('.paper-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-action]') || e.target.tagName === 'A') return;
                this.select(card.dataset.id);
            });
            
            card.querySelector('[data-action="pdf"]')?.addEventListener('click', () => {
                PDF.openPaper(card.dataset.id);
            });
            
            card.querySelector('[data-action="save"]')?.addEventListener('click', () => {
                this.toggleSave(card.dataset.id);
            });
        });
    },
    
    select(id) {
        State.papers.selected = [...State.papers.all, ...State.papers.custom].find(p => p.id === id);
        
        const ctx = document.getElementById('chat-ctx');
        if (ctx && State.papers.selected) {
            ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${State.papers.selected.title}</strong>`;
        }
        
        this.filter();
    },
    
    toggleSave(id) {
        const idx = State.papers.saved.indexOf(id);
        if (idx > -1) {
            State.papers.saved.splice(idx, 1);
        } else {
            State.papers.saved.push(id);
        }
        State.save();
        this.renderTabs();
        this.filter();
    },
    
    add(data) {
        const paper = {
            id: 'custom-' + Date.now(),
            title: data.title,
            link: data.url,
            pdf_link: data.url.includes('arxiv.org/abs/') 
                ? data.url.replace('/abs/', '/pdf/') + '.pdf' 
                : null,
            authors: data.authors || 'Unknown',
            pubDateISO: data.date || new Date().toISOString().split('T')[0],
            score: parseInt(data.score) || 7,
            tags: [],
            isCustom: true
        };
        
        State.papers.custom.unshift(paper);
        State.save();
        State.papers.tab = 'mine';
        this.renderTabs();
        this.filter();
    }
};
