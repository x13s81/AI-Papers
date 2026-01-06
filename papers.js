/**
 * Papers
 * Paper list management
 */

const Papers = {
    /**
     * Initialize papers panel
     */
    init() {
        this.bindEvents();
        this.loadPapers();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterAndRender());
        }
        
        // Sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.filterAndRender());
        }
        
        // Add paper button
        const addBtn = document.getElementById('btn-add-paper');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('modal-add-paper').classList.add('visible');
            });
        }
    },
    
    /**
     * Load papers from API or fallback
     */
    async loadPapers() {
        try {
            const response = await fetch('papers.json');
            if (response.ok) {
                const data = await response.json();
                State.papers.all = data.papers || [];
            }
        } catch (e) {
            // Use sample data
            State.papers.all = this.getSamplePapers();
        }
        
        this.renderTabs();
        this.filterAndRender();
    },
    
    /**
     * Sample papers for demo
     */
    getSamplePapers() {
        return [
            {
                id: '2412.01',
                title: 'Scaling Open-Ended Reasoning to Predict the Future',
                authors: 'Nikhil Chandak, Shashwat Goel, Ameya Prabhu',
                pubDateISO: '2025-01-05',
                score: 9,
                tags: ['cs.AI', 'cs.LG'],
                abstract: 'We present a novel approach to scaling open-ended reasoning systems...',
                pdf_link: 'https://arxiv.org/pdf/2412.01.pdf',
                link: 'https://arxiv.org/abs/2412.01'
            },
            {
                id: '2412.02',
                title: 'Can We Trust AI Explanations? Evidence of Systematic Underreporting',
                authors: 'Deep Pankajbhai Mehta, Sarah Chen',
                pubDateISO: '2025-01-04',
                score: 9,
                tags: ['cs.AI', 'cs.CL'],
                abstract: 'Chain-of-thought reasoning has become a standard approach...',
                pdf_link: 'https://arxiv.org/pdf/2412.02.pdf',
                link: 'https://arxiv.org/abs/2412.02'
            },
            {
                id: '2412.03',
                title: 'DiffThinker: Generative Multimodal Reasoning with Diffusion',
                authors: 'Zefeng He, Xiaoye Qu, Wei Liu',
                pubDateISO: '2025-01-03',
                score: 8,
                tags: ['cs.CV', 'cs.AI'],
                abstract: 'We introduce DiffThinker, a novel framework that combines...',
                pdf_link: 'https://arxiv.org/pdf/2412.03.pdf',
                link: 'https://arxiv.org/abs/2412.03'
            },
            {
                id: '2412.04',
                title: 'Taming Hallucinations: Boosting MLLMs Video Understanding',
                authors: 'Zhe Huang, Hao Wen, Michael Zhang',
                pubDateISO: '2025-01-02',
                score: 8,
                tags: ['cs.CV', 'cs.MM'],
                abstract: 'Multimodal large language models often suffer from hallucinations...',
                pdf_link: 'https://arxiv.org/pdf/2412.04.pdf',
                link: 'https://arxiv.org/abs/2412.04'
            },
            {
                id: '2412.05',
                title: 'JavisGPT: Unified Multi-modal LLM for Sounding-Video',
                authors: 'Kai Liu, Jungang Li, Anna Rodriguez',
                pubDateISO: '2025-01-01',
                score: 8,
                tags: ['cs.CV', 'cs.SD'],
                abstract: 'We present JavisGPT, a unified model for understanding...',
                pdf_link: 'https://arxiv.org/pdf/2412.05.pdf',
                link: 'https://arxiv.org/abs/2412.05'
            },
            {
                id: '2412.06',
                title: 'End-to-End Test-Time Training for Long Context Understanding',
                authors: 'Arnuv Tandon, Karan Dalal',
                pubDateISO: '2024-12-31',
                score: 7,
                tags: ['cs.LG', 'cs.CL'],
                abstract: 'Long context understanding remains a challenging problem...',
                pdf_link: 'https://arxiv.org/pdf/2412.06.pdf',
                link: 'https://arxiv.org/abs/2412.06'
            }
        ];
    },
    
    /**
     * Render filter tabs
     */
    renderTabs() {
        const container = document.getElementById('filter-tabs');
        if (!container) return;
        
        const today = getToday();
        const all = [...State.papers.all, ...State.papers.custom];
        
        const counts = {
            today: State.papers.all.filter(p => p.pubDateISO === today).length,
            all: all.length,
            top: all.filter(p => p.score >= 8).length,
            saved: State.papers.saved.length,
            mine: State.papers.custom.length
        };
        
        container.innerHTML = `
            <div class="filter-tab ${State.papers.currentTab === 'today' ? 'active' : ''}" data-tab="today">
                Today <span class="count">${counts.today}</span>
            </div>
            <div class="filter-tab ${State.papers.currentTab === 'all' ? 'active' : ''}" data-tab="all">
                All <span class="count">${counts.all}</span>
            </div>
            <div class="filter-tab ${State.papers.currentTab === 'top' ? 'active' : ''}" data-tab="top">
                🔥 Top <span class="count">${counts.top}</span>
            </div>
            <div class="filter-tab ${State.papers.currentTab === 'saved' ? 'active' : ''}" data-tab="saved">
                💾 <span class="count">${counts.saved}</span>
            </div>
            <div class="filter-tab ${State.papers.currentTab === 'mine' ? 'active' : ''}" data-tab="mine">
                📁 <span class="count">${counts.mine}</span>
            </div>
        `;
        
        // Bind tab clicks
        container.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                State.papers.currentTab = tab.dataset.tab;
                this.renderTabs();
                this.filterAndRender();
            });
        });
    },
    
    /**
     * Filter and render papers
     */
    filterAndRender() {
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        
        const search = (searchInput?.value || '').toLowerCase();
        const sort = sortSelect?.value || 'score-desc';
        const today = getToday();
        
        // Get papers for current tab
        let papers;
        switch (State.papers.currentTab) {
            case 'today':
                papers = State.papers.all.filter(p => p.pubDateISO === today);
                break;
            case 'top':
                papers = [...State.papers.all, ...State.papers.custom].filter(p => p.score >= 8);
                break;
            case 'saved':
                papers = [...State.papers.all, ...State.papers.custom]
                    .filter(p => State.papers.saved.includes(p.id));
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
                (p.authors || '').toLowerCase().includes(search) ||
                (p.tags || []).some(t => t.toLowerCase().includes(search))
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
    
    /**
     * Render paper list
     */
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
            
            return `
                <div class="paper-card ${isSelected ? 'selected' : ''}" data-id="${paper.id}">
                    <div class="paper-title">${paper.title}</div>
                    <div class="paper-meta">
                        <span class="paper-date">📅 ${formatDate(paper.pubDateISO)}</span>
                        <span>${paper.authors || 'Unknown'}</span>
                        <span class="paper-score ${scoreClass}">${paper.score}/10</span>
                    </div>
                    <div class="paper-actions">
                        ${paper.pdf_link ? `<button class="paper-btn primary" data-action="pdf">📄 PDF</button>` : ''}
                        <button class="paper-btn ${isSaved ? 'saved' : ''}" data-action="save">
                            ${isSaved ? '✓ Saved' : 'Save'}
                        </button>
                        <a class="paper-btn" href="${paper.link}" target="_blank">↗</a>
                        ${paper.isCustom ? `<button class="paper-btn" data-action="delete">🗑️</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Bind events
        container.querySelectorAll('.paper-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('[data-action]') || e.target.tagName === 'A') return;
                this.selectPaper(card.dataset.id);
            });
            
            card.querySelector('[data-action="pdf"]')?.addEventListener('click', () => {
                PDF.openPaper(card.dataset.id);
            });
            
            card.querySelector('[data-action="save"]')?.addEventListener('click', () => {
                this.toggleSave(card.dataset.id);
            });
            
            card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                this.deletePaper(card.dataset.id);
            });
        });
    },
    
    /**
     * Select a paper
     */
    selectPaper(id) {
        State.papers.selected = [...State.papers.all, ...State.papers.custom]
            .find(p => p.id === id);
        
        if (State.papers.selected) {
            const context = document.getElementById('chat-context');
            if (context) {
                context.innerHTML = `<span class="status-dot online"></span> Discussing: <strong>${State.papers.selected.title}</strong>`;
            }
        }
        
        this.filterAndRender();
    },
    
    /**
     * Toggle paper save status
     */
    toggleSave(id) {
        const idx = State.papers.saved.indexOf(id);
        if (idx > -1) {
            State.papers.saved.splice(idx, 1);
        } else {
            State.papers.saved.push(id);
        }
        State.savePapers();
        this.renderTabs();
        this.filterAndRender();
    },
    
    /**
     * Delete custom paper
     */
    deletePaper(id) {
        if (!confirm('Delete this paper?')) return;
        State.papers.custom = State.papers.custom.filter(p => p.id !== id);
        State.savePapers();
        this.renderTabs();
        this.filterAndRender();
    },
    
    /**
     * Add custom paper
     */
    addPaper(data) {
        const paper = {
            id: 'custom-' + Date.now(),
            title: data.title,
            link: data.url,
            pdf_link: data.url.includes('arxiv.org/abs/')
                ? data.url.replace('/abs/', '/pdf/') + '.pdf'
                : null,
            authors: data.authors || 'Unknown',
            pubDateISO: data.date || getToday(),
            score: parseInt(data.score) || 7,
            tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            isCustom: true
        };
        
        State.papers.custom.unshift(paper);
        State.savePapers();
        State.papers.currentTab = 'mine';
        this.renderTabs();
        this.filterAndRender();
    }
};
