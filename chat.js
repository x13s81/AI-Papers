/**
 * Chat
 * AI chat functionality
 */

const Chat = {
    /**
     * Initialize chat panel
     */
    init() {
        this.bindEvents();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Send button
        const sendBtn = document.getElementById('btn-send');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.send());
        }
        
        // Input enter key
        const input = document.getElementById('chat-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.send();
                }
            });
        }
        
        // Quick action buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                if (prompt) {
                    const input = document.getElementById('chat-input');
                    if (input) {
                        input.value = prompt;
                        this.send();
                    }
                }
            });
        });
    },
    
    /**
     * Send a message
     */
    async send() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('btn-send');
        
        const message = input?.value.trim();
        if (!message || State.chat.isTyping) return;
        
        // Check if paper is selected
        if (!State.papers.selected) {
            this.addMessage('ai', 'Please select a paper or upload a PDF first.');
            return;
        }
        
        // Add user message
        this.addMessage('user', message);
        input.value = '';
        
        // Add to history
        State.chat.history.push({ role: 'user', content: message });
        
        // Show typing indicator
        State.chat.isTyping = true;
        if (sendBtn) sendBtn.disabled = true;
        const typingEl = this.showTyping();
        
        try {
            // Try API call
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    paper: {
                        title: State.papers.selected.title,
                        authors: State.papers.selected.authors,
                        abstract: State.papers.selected.abstract,
                        tags: State.papers.selected.tags
                    },
                    history: State.chat.history.slice(-8)
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                typingEl.remove();
                this.addMessage('ai', data.response);
                State.chat.history.push({ role: 'assistant', content: data.response });
            } else {
                throw new Error('API error');
            }
        } catch (e) {
            // Fallback response
            typingEl.remove();
            const fallback = this.getFallbackResponse(message);
            this.addMessage('ai', fallback);
            State.chat.history.push({ role: 'assistant', content: fallback });
        }
        
        State.chat.isTyping = false;
        if (sendBtn) sendBtn.disabled = false;
    },
    
    /**
     * Add a message to the chat
     */
    addMessage(role, content) {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${role} slide-up`;
        messageEl.innerHTML = `
            <div class="message-avatar">${role === 'ai' ? '🤖' : '👤'}</div>
            <div class="message-content">${content}</div>
        `;
        
        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    },
    
    /**
     * Show typing indicator
     */
    showTyping() {
        const container = document.getElementById('chat-messages');
        if (!container) return document.createElement('div');
        
        const el = document.createElement('div');
        el.className = 'message ai';
        el.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        return el;
    },
    
    /**
     * Get fallback response when API is unavailable
     */
    getFallbackResponse(message) {
        const paper = State.papers.selected;
        const msg = message.toLowerCase();
        
        if (msg.includes('summar')) {
            return `<strong>${paper.title}</strong><br><br>${paper.abstract?.slice(0, 400) || 'Please open the PDF to read the full content.'}<br><br>Score: ${paper.score || 'N/A'}/10`;
        }
        
        if (msg.includes('key') || msg.includes('contribution')) {
            return `The key contribution of "<strong>${paper.title}</strong>" relates to ${paper.tags?.join(', ') || 'advancing AI research'}. Check the PDF introduction and conclusion for specifics.`;
        }
        
        if (msg.includes('method')) {
            return `For methodology details of "<strong>${paper.title}</strong>", please refer to Sections 3-4 in the PDF. The paper covers topics in: ${paper.tags?.join(', ') || 'AI/ML'}.`;
        }
        
        if (msg.includes('result')) {
            return `The results section of "<strong>${paper.title}</strong>" can be found in the PDF. The paper achieved a relevance score of ${paper.score || 'N/A'}/10 based on our analysis.`;
        }
        
        return `I'm currently in offline mode. For "<strong>${paper.title}</strong>" by ${paper.authors || 'the authors'}, please refer to the PDF for detailed information. ${paper.abstract ? '<br><br>Abstract preview: ' + paper.abstract.slice(0, 200) + '...' : ''}`;
    }
};
