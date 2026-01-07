const Drag = {
    isDragging: false,
    draggedId: null,
    sourcePanel: null,
    
    init() {
        const ws = document.getElementById('workspace');
        const pv = document.getElementById('drag-preview');
        const ind = document.getElementById('drop-indicator');
        
        ws.onmousedown = e => {
            const t = e.target.closest('.tab');
            if (!t || e.target.closest('.tab-actions')) return;
            e.preventDefault();
            this.isDragging = true;
            this.draggedId = t.dataset.id;
            this.sourcePanel = t.closest('.panel');
            pv.textContent = t.textContent;
            pv.style.display = 'block';
            pv.style.left = (e.clientX + 12) + 'px';
            pv.style.top = (e.clientY + 12) + 'px';
            t.classList.add('dragging');
        };
        
        document.onmousemove = e => {
            if (!this.isDragging) return;
            pv.style.left = (e.clientX + 12) + 'px';
            pv.style.top = (e.clientY + 12) + 'px';
            const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.panel');
            if (el && el !== this.sourcePanel) this.showInd(el, e.clientX, e.clientY);
            else { ind.style.display = 'none'; ind.textContent = ''; }
        };
        
        document.addEventListener('mouseup', e => {
            if (!this.isDragging) return;
            pv.style.display = 'none';
            document.querySelectorAll('.tab.dragging').forEach(t => t.classList.remove('dragging'));
            if (ind.style.display === 'flex') {
                const zone = ind.dataset.zone;
                const tgt = ind.dataset.target.split(',');
                Layout.removeTab(this.draggedId);
                if (zone === 'center') Layout.addTab(this.draggedId, tgt);
                else Layout.split(this.draggedId, tgt, zone);
                Layout.cleanup();
                State.saveLayout();
                Layout.render();
            }
            ind.style.display = 'none';
            ind.textContent = '';
            this.isDragging = false;
            this.draggedId = null;
            this.sourcePanel = null;
        });
    },
    
    showInd(panel, mx, my) {
        const ind = document.getElementById('drop-indicator');
        const r = panel.getBoundingClientRect();
        const rx = (mx - r.left) / r.width;
        const ry = (my - r.top) / r.height;
        const inTab = my < r.top + 40;
        const edge = 0.25;
        let zone = 'center';
        if (inTab) zone = 'center';
        else if (rx < edge) zone = 'left';
        else if (rx > 1 - edge) zone = 'right';
        else if (ry < edge + 40/r.height) zone = 'top';
        else if (ry > 1 - edge) zone = 'bottom';
        
        ind.style.display = 'flex';
        const p = 4;
        if (zone === 'center') { ind.style.left = (r.left+p)+'px'; ind.style.top = (r.top+p)+'px'; ind.style.width = (r.width-p*2)+'px'; ind.style.height = '36px'; }
        else if (zone === 'left') { ind.style.left = (r.left+p)+'px'; ind.style.top = (r.top+p)+'px'; ind.style.width = (r.width*0.5-p)+'px'; ind.style.height = (r.height-p*2)+'px'; }
        else if (zone === 'right') { ind.style.left = (r.left+r.width*0.5)+'px'; ind.style.top = (r.top+p)+'px'; ind.style.width = (r.width*0.5-p)+'px'; ind.style.height = (r.height-p*2)+'px'; }
        else if (zone === 'top') { ind.style.left = (r.left+p)+'px'; ind.style.top = (r.top+p)+'px'; ind.style.width = (r.width-p*2)+'px'; ind.style.height = (r.height*0.5-p)+'px'; }
        else if (zone === 'bottom') { ind.style.left = (r.left+p)+'px'; ind.style.top = (r.top+r.height*0.5)+'px'; ind.style.width = (r.width-p*2)+'px'; ind.style.height = (r.height*0.5-p)+'px'; }
        
        ind.dataset.zone = zone;
        ind.dataset.target = [...panel.querySelectorAll('.tab')].map(t => t.dataset.id).join(',');
        ind.textContent = {center:'➕ Add as tab', left:'◀ Split left', right:'Split right ▶', top:'▲ Split top', bottom:'Split bottom ▼'}[zone] || '';
    }
};
