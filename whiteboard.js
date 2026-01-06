/**
 * Whiteboard
 * Canvas drawing functionality
 */

const Whiteboard = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    
    /**
     * Initialize whiteboard
     */
    init() {
        this.canvas = document.getElementById('whiteboard-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.bindEvents();
        this.loadSaved();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        if (!this.canvas) return;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Touch events
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
        document.querySelectorAll('.wb-tool[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                State.whiteboard.tool = btn.dataset.tool;
                document.querySelectorAll('.wb-tool[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                State.whiteboard.color = btn.dataset.color;
                State.whiteboard.tool = 'pen';
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.wb-tool[data-tool]').forEach(b => b.classList.remove('active'));
                document.querySelector('.wb-tool[data-tool="pen"]')?.classList.add('active');
            });
        });
        
        // Clear button
        const clearBtn = document.getElementById('btn-clear-canvas');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
        
        // Ask AI button
        const askBtn = document.getElementById('btn-ask-about-drawing');
        if (askBtn) {
            askBtn.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = 'Can you help me understand what I drew on the whiteboard?';
                    Chat.send();
                }
            });
        }
    },
    
    /**
     * Start drawing
     */
    startDrawing(e) {
        this.isDrawing = true;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    },
    
    /**
     * Draw on canvas
     */
    draw(e) {
        if (!this.isDrawing || !this.ctx) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(e.offsetX, e.offsetY);
        
        if (State.whiteboard.tool === 'eraser') {
            this.ctx.strokeStyle = '#1a1a2e';
            this.ctx.lineWidth = 20;
        } else {
            this.ctx.strokeStyle = State.whiteboard.color;
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
        
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    },
    
    /**
     * Stop drawing
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.save();
        }
    },
    
    /**
     * Resize canvas
     */
    resize() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const rect = container.getBoundingClientRect();
        
        // Save current drawing
        const savedData = this.canvas.toDataURL();
        
        // Resize canvas
        this.canvas.width = rect.width || 400;
        this.canvas.height = rect.height || 300;
        
        // Restore drawing
        if (savedData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = savedData;
        }
    },
    
    /**
     * Clear canvas
     */
    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        localStorage.removeItem('canvasData');
    },
    
    /**
     * Save canvas to localStorage
     */
    save() {
        if (!this.canvas) return;
        localStorage.setItem('canvasData', this.canvas.toDataURL());
    },
    
    /**
     * Load saved canvas data
     */
    loadSaved() {
        const saved = localStorage.getItem('canvasData');
        if (saved && this.ctx) {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = saved;
        }
    }
};

// Handle window resize
window.addEventListener('resize', () => {
    setTimeout(() => Whiteboard.resize(), 100);
});
