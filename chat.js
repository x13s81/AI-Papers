const Chat = {
    init() {
        document.getElementById('chat-send')?.addEventListener('click', () => this.send());
        document.getElementById('chat-in')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
        });
        document.querySelectorAll('.quick-btn').forEach(b => b.addEventListener('click', () => {
            const inp = document.getElementById('chat-in');
            if (inp) { inp.value = b.dataset.q; this.send(); }
        }));
    },
    
    async send() {
        const inp = document.getElementById('chat-in');
        const btn = document.getElementById('chat-send');
        const msg = inp?.value.trim();
        if (!msg || State.chat.typing) return;
        if (!State.papers.selected) { this.addMessage('ai', 'Please select a paper or upload a PDF first.'); return; }
        this.addMessage('user', msg);
        inp.value = '';
        State.chat.history.push({ role: 'user', content: msg });
        State.chat.typing = true;
        if (btn) btn.disabled = true;
        const typ = this.showTyping();
        try {
            const r = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, paper: State.papers.selected, history: State.chat.history.slice(-8) })
            });
            if (r.ok) {
                const d = await r.json();
                typ.remove();
                this.addMessage('ai', d.response);
                State.chat.history.push({ role: 'assistant', content: d.response });
            } else throw new Error();
        } catch {
            typ.remove();
            const fb = this.fallback(msg);
            this.addMessage('ai', fb);
            State.chat.history.push({ role: 'assistant', content: fb });
        }
        State.chat.typing = false;
        if (btn) btn.disabled = false;
    },
    
    addMessage(role, content) {
        const el = document.getElementById('chat-msgs');
        if (!el) return;
        el.innerHTML += `<div class="message ${role}"><div class="message-avatar">${role==='ai'?'🤖':'👤'}</div><div class="message-content">${content}</div></div>`;
        el.scrollTop = el.scrollHeight;
    },
    
    showTyping() {
        const el = document.getElementById('chat-msgs');
        if (!el) return document.createElement('div');
        const d = document.createElement('div');
        d.className = 'message ai';
        d.innerHTML = '<div class="message-avatar">🤖</div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
        return d;
    },
    
    fallback(msg) {
        const p = State.papers.selected;
        const m = msg.toLowerCase();
        if (m.includes('summar')) return `<strong>${p.title}</strong><br><br>${p.abstract?.slice(0,400) || 'Open PDF for details.'}`;
        return `Offline mode. "${p.title}": ${p.abstract?.slice(0,200) || 'Check PDF.'}...`;
    }
};
