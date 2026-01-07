const Search = {
    init() {
        document.getElementById('web-search-btn')?.addEventListener('click', () => this.search());
        document.getElementById('web-search')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') this.search();
        });
    },
    
    async search() {
        const query = document.getElementById('web-search')?.value.trim();
        const source = document.getElementById('search-source')?.value || 'arxiv';
        const results = document.getElementById('search-results');
        
        if (!query || !results) return;
        
        results.innerHTML = '<div class="search-loading"><div class="typing-indicator"><span></span><span></span><span></span></div><p>Searching...</p></div>';
        
        try {
            if (source === 'arxiv') {
                await this.searchArxiv(query);
            } else {
                await this.searchSemantic(query);
            }
        } catch (err) {
            console.error('Search error:', err);
            results.innerHTML = `<div class="empty-state"><p>Search failed. Try again.</p><p class="error-hint">${err.message}</p><p class="error-hint">Try switching to arXiv search.</p></div>`;
        }
    },
    
    async searchArxiv(query) {
        const results = document.getElementById('search-results');
        // arXiv API - search for papers
        const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=20&sortBy=relevance&sortOrder=descending`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('arXiv API error');
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        const entries = xml.querySelectorAll('entry');
        
        if (!entries.length) {
            results.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
            return;
        }
        
        const papers = Array.from(entries).map(entry => {
            const id = entry.querySelector('id')?.textContent || '';
            const arxivId = id.split('/abs/').pop();
            return {
                id: arxivId,
                title: entry.querySelector('title')?.textContent?.replace(/\s+/g, ' ').trim() || 'Untitled',
                authors: Array.from(entry.querySelectorAll('author name')).map(a => a.textContent).join(', '),
                abstract: entry.querySelector('summary')?.textContent?.trim() || '',
                published: entry.querySelector('published')?.textContent?.split('T')[0] || '',
                link: id,
                pdf_link: id.replace('/abs/', '/pdf/') + '.pdf',
                source: 'arXiv'
            };
        });
        
        this.renderResults(papers);
    },
    
    async searchSemantic(query) {
        const results = document.getElementById('search-results');
        // Use CORS proxy for Semantic Scholar
        const baseUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
        const params = `?query=${encodeURIComponent(query)}&limit=20&fields=title,authors,abstract,year,externalIds,openAccessPdf,url`;
        
        // Try direct first, then fallback to proxy
        let response;
        try {
            response = await fetch(baseUrl + params);
        } catch (e) {
            // Try with CORS proxy
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(baseUrl + params);
            response = await fetch(proxyUrl);
        }
        
        if (!response.ok) throw new Error('Semantic Scholar API error');
        const data = await response.json();
        
        if (!data.data?.length) {
            results.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
            return;
        }
        
        const papers = data.data.map(paper => ({
            id: paper.paperId,
            title: paper.title || 'Untitled',
            authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown',
            abstract: paper.abstract || '',
            published: paper.year ? `${paper.year}` : '',
            link: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            pdf_link: paper.openAccessPdf?.url || (paper.externalIds?.ArXiv ? `https://arxiv.org/pdf/${paper.externalIds.ArXiv}.pdf` : null),
            source: 'Semantic Scholar'
        }));
        
        this.renderResults(papers);
    },
    
    renderResults(papers) {
        const results = document.getElementById('search-results');
        if (!results) return;
        
        results.innerHTML = papers.map(p => `
            <div class="search-result" data-paper='${JSON.stringify(p).replace(/'/g, "&#39;")}'>
                <div class="result-title">${p.title}</div>
                <div class="result-meta">
                    <span class="result-source">${p.source}</span>
                    ${p.published ? `<span class="result-date">📅 ${p.published}</span>` : ''}
                </div>
                <div class="result-authors">${p.authors}</div>
                <div class="result-abstract">${p.abstract?.slice(0, 200)}${p.abstract?.length > 200 ? '...' : ''}</div>
                <div class="result-actions">
                    ${p.pdf_link ? `<button class="paper-btn primary" data-action="view-pdf">📄 View PDF</button>` : '<span class="no-pdf">No PDF available</span>'}
                    <button class="paper-btn" data-action="add-library">➕ Add to Library</button>
                    <a class="paper-btn" href="${p.link}" target="_blank">↗ Open</a>
                </div>
            </div>
        `).join('');
        
        // Bind actions
        results.querySelectorAll('.search-result').forEach(el => {
            const paper = JSON.parse(el.dataset.paper);
            
            el.querySelector('[data-action="view-pdf"]')?.addEventListener('click', () => {
                if (paper.pdf_link) {
                    State.papers.selected = {
                        title: paper.title,
                        authors: paper.authors,
                        abstract: paper.abstract,
                        tags: []
                    };
                    PDF.show(paper.pdf_link, paper.title, paper.link);
                    const ctx = document.getElementById('chat-ctx');
                    if (ctx) ctx.innerHTML = `<span class="status-dot"></span>Discussing: <strong>${paper.title}</strong>`;
                    Chat.addMessage('ai', `Loaded "<strong>${paper.title}</strong>" from search. What would you like to know?`);
                }
            });
            
            el.querySelector('[data-action="add-library"]')?.addEventListener('click', (e) => {
                const btn = e.target;
                // Add to custom papers
                const exists = State.papers.custom.some(p => p.title === paper.title);
                if (!exists) {
                    State.papers.custom.unshift({
                        id: 'search-' + Date.now(),
                        title: paper.title,
                        authors: paper.authors,
                        abstract: paper.abstract,
                        pubDateISO: paper.published || new Date().toISOString().split('T')[0],
                        link: paper.link,
                        pdf_link: paper.pdf_link,
                        score: 7,
                        tags: [paper.source],
                        isCustom: true
                    });
                    State.save();
                    Papers.renderTabs();
                    Papers.filter();
                }
                btn.textContent = '✓ Added';
                btn.disabled = true;
                btn.classList.add('saved');
            });
        });
    }
};
