const Whiteboard = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    
    init() {
        this.canvas = document.getElementById('canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        this.canvas.onmousedown = e => { this.isDrawing = true; [this.lastX, this.lastY] = [e.offsetX, e.offsetY]; };
        this.canvas.onmousemove = e => {
            if (!this.isDrawing) return;
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(e.offsetX, e.offsetY);
            this.ctx.strokeStyle = State.wb.tool === 'eraser' ? '#1a1a2e' : State.wb.color;
            this.ctx.lineWidth = State.wb.tool === 'eraser' ? 20 : 2;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            [this.lastX, this.lastY] = [e.offsetX, e.offsetY];
        };
        this.canvas.onmouseup = () => { if (this.isDrawing) { this.isDrawing = false; this.save(); } };
        this.canvas.onmouseleave = () => { this.isDrawing = false; };
        
        document.querySelectorAll('.wb-tool[data-t]').forEach(b => b.onclick = () => {
            State.wb.tool = b.dataset.t;
            document.querySelectorAll('.wb-tool[data-t]').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        });
        
        document.querySelectorAll('.color-btn').forEach(b => b.onclick = () => {
            State.wb.color = b.dataset.c;
            State.wb.tool = 'pen';
            document.querySelectorAll('.color-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            document.querySelectorAll('.wb-tool[data-t]').forEach(x => x.classList.remove('active'));
            document.querySelector('.wb-tool[data-t="pen"]')?.classList.add('active');
        });
        
        document.getElementById('wb-clear')?.addEventListener('click', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            localStorage.removeItem('canvasData');
        });
        
        document.getElementById('wb-ai')?.addEventListener('click', () => {
            const inp = document.getElementById('chat-in');
            if (inp) { inp.value = 'Help me understand my whiteboard notes'; Chat.send(); }
        });
        
        const saved = localStorage.getItem('canvasData');
        if (saved) { const img = new Image(); img.onload = () => this.ctx.drawImage(img, 0, 0); img.src = saved; }
    },
    
    resize() {
        if (!this.canvas) return;
        const c = this.canvas.parentElement;
        if (!c) return;
        const r = c.getBoundingClientRect();
        const d = this.canvas.toDataURL();
        this.canvas.width = r.width || 400;
        this.canvas.height = r.height || 300;
        const img = new Image();
        img.onload = () => this.ctx.drawImage(img, 0, 0);
        img.src = d;
    },
    
    save() { localStorage.setItem('canvasData', this.canvas.toDataURL()); }
};

const Notes = {
    init() {
        const el = document.getElementById('notes');
        if (!el) return;
        el.value = localStorage.getItem('notes') || '';
        el.oninput = () => localStorage.setItem('notes', el.value);
    }
};

window.addEventListener('resize', () => setTimeout(() => Whiteboard.resize(), 100));
