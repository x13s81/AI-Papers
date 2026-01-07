/**
 * Whiteboard
 */
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
        
        // Drawing events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.startDrawing({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.draw({
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            });
        });
        
        this.canvas.addEventListener('touchend', () => this.stopDrawing());
        
        // Tool buttons
        document.querySelectorAll('.wb-tool[data-t]').forEach(btn => {
            btn.addEventListener('click', () => {
                State.wb.tool = btn.dataset.t;
                document.querySelectorAll('.wb-tool[data-t]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                State.wb.color = btn.dataset.c;
                State.wb.tool = 'pen';
                
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                document.querySelectorAll('.wb-tool[data-t]').forEach(b => b.classList.remove('active'));
                document.querySelector('.wb-tool[data-t="pen"]')?.classList.add('active');
            });
        });
        
        // Clear button
        document.getElementById('wb-clear')?.addEventListener('click', () => this.clear());
        
        // Ask AI button
        document.getElementById('wb-ai')?.addEventListener('click', () => {
            const input = document.getElementById('chat-in');
            if (input) {
                input.value = 'Help me understand what I drew on the whiteboard';
                Chat.send();
            }
        });
        
        // Load saved drawing
        this.loadSaved();
    },
    
    startDrawing(e) {
        this.isDrawing = true;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    },
    
    draw(e) {
        if (!this.isDrawing || !this.ctx) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(e.offsetX, e.offsetY);
        
        if (State.wb.tool === 'eraser') {
            this.ctx.strokeStyle = '#1a1a2e';
            this.ctx.lineWidth = 20;
        } else {
            this.ctx.strokeStyle = State.wb.color;
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    },
    
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.save();
        }
    },
    
    resize() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        const savedData = this.canvas.toDataURL();
        
        this.canvas.width = rect.width || 400;
        this.canvas.height = rect.height || 300;
        
        // Restore drawing
        const img = new Image();
        img.onload = () => this.ctx.drawImage(img, 0, 0);
        img.src = savedData;
    },
    
    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        localStorage.removeItem('canvasData');
    },
    
    save() {
        if (!this.canvas) return;
        localStorage.setItem('canvasData', this.canvas.toDataURL());
    },
    
    loadSaved() {
        const saved = localStorage.getItem('canvasData');
        if (saved && this.ctx) {
            const img = new Image();
            img.onload = () => this.ctx.drawImage(img, 0, 0);
            img.src = saved;
        }
    }
};

// Notes
const Notes = {
    init() {
        const textarea = document.getElementById('notes');
        if (!textarea) return;
        
        textarea.value = localStorage.getItem('notes') || '';
        textarea.addEventListener('input', () => {
            localStorage.setItem('notes', textarea.value);
        });
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    setTimeout(() => Whiteboard.resize(), 100);
});
