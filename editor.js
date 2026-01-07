const Editor = {
    previewVisible: false,
    
    init() {
        const textarea = document.getElementById('editor-textarea');
        if (!textarea) return;
        
        // Load saved content
        textarea.value = localStorage.getItem('editor-content') || textarea.placeholder;
        
        // Auto-save
        textarea.addEventListener('input', () => {
            localStorage.setItem('editor-content', textarea.value);
            if (this.previewVisible) this.updatePreview();
        });
        
        // Toolbar buttons
        document.querySelectorAll('.editor-btn[data-cmd]').forEach(btn => {
            btn.addEventListener('click', () => this.insertCommand(btn.dataset.cmd));
        });
        
        // Preview toggle
        document.getElementById('editor-preview-toggle')?.addEventListener('click', () => {
            this.previewVisible = !this.previewVisible;
            const preview = document.getElementById('editor-preview');
            const btn = document.getElementById('editor-preview-toggle');
            if (preview) preview.classList.toggle('visible', this.previewVisible);
            if (btn) btn.classList.toggle('active', this.previewVisible);
            if (this.previewVisible) this.updatePreview();
        });
        
        // Export
        document.getElementById('editor-export')?.addEventListener('click', () => this.export());
        
        // Tab key support
        textarea.addEventListener('keydown', e => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
            }
        });
    },
    
    insertCommand(cmd) {
        const textarea = document.getElementById('editor-textarea');
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        let insert = '';
        let cursorOffset = 0;
        
        switch (cmd) {
            case 'bold':
                insert = `\\textbf{${selected || 'text'}}`;
                cursorOffset = selected ? insert.length : 8;
                break;
            case 'italic':
                insert = `\\textit{${selected || 'text'}}`;
                cursorOffset = selected ? insert.length : 8;
                break;
            case 'heading':
                insert = `\\section{${selected || 'Section Title'}}`;
                cursorOffset = selected ? insert.length : 9;
                break;
            case 'math':
                insert = `$${selected || 'E = mc^2'}$`;
                cursorOffset = selected ? insert.length : 1;
                break;
            case 'mathblock':
                insert = `\\[\n${selected || '\\int_0^\\infty f(x) dx'}\n\\]`;
                cursorOffset = selected ? insert.length : 3;
                break;
            case 'cite':
                insert = `\\cite{${selected || 'reference'}}`;
                cursorOffset = selected ? insert.length : 6;
                break;
            case 'ref':
                insert = `\\ref{${selected || 'label'}}`;
                cursorOffset = selected ? insert.length : 5;
                break;
        }
        
        textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;
        textarea.focus();
        localStorage.setItem('editor-content', textarea.value);
        if (this.previewVisible) this.updatePreview();
    },
    
    updatePreview() {
        const textarea = document.getElementById('editor-textarea');
        const preview = document.getElementById('preview-content');
        if (!textarea || !preview) return;
        
        let content = textarea.value;
        
        // Simple LaTeX to HTML conversion
        // Title
        content = content.replace(/\\title\{([^}]+)\}/g, '<h1 class="preview-title">$1</h1>');
        content = content.replace(/\\author\{([^}]+)\}/g, '<p class="preview-author">$1</p>');
        content = content.replace(/\\maketitle/g, '');
        
        // Sections
        content = content.replace(/\\section\{([^}]+)\}/g, '<h2>$1</h2>');
        content = content.replace(/\\subsection\{([^}]+)\}/g, '<h3>$1</h3>');
        content = content.replace(/\\subsubsection\{([^}]+)\}/g, '<h4>$1</h4>');
        
        // Text formatting
        content = content.replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>');
        content = content.replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
        content = content.replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>');
        
        // Lists
        content = content.replace(/\\begin\{itemize\}/g, '<ul>');
        content = content.replace(/\\end\{itemize\}/g, '</ul>');
        content = content.replace(/\\begin\{enumerate\}/g, '<ol>');
        content = content.replace(/\\end\{enumerate\}/g, '</ol>');
        content = content.replace(/\\item\s*/g, '<li>');
        
        // Math - Use KaTeX if available
        if (typeof katex !== 'undefined') {
            // Display math
            content = content.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
                try {
                    return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
                } catch { return `<pre>${math}</pre>`; }
            });
            content = content.replace(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/g, (match, math) => {
                try {
                    return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
                } catch { return `<pre>${math}</pre>`; }
            });
            // Inline math
            content = content.replace(/\$([^$]+)\$/g, (match, math) => {
                try {
                    return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
                } catch { return `<code>${math}</code>`; }
            });
        } else {
            // Fallback without KaTeX
            content = content.replace(/\\\[([\s\S]*?)\\\]/g, '<pre class="math-block">$1</pre>');
            content = content.replace(/\$([^$]+)\$/g, '<code class="math-inline">$1</code>');
        }
        
        // Citations and references
        content = content.replace(/\\cite\{([^}]+)\}/g, '<span class="cite">[$1]</span>');
        content = content.replace(/\\ref\{([^}]+)\}/g, '<span class="ref">[ref:$1]</span>');
        
        // Remove document structure commands
        content = content.replace(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/g, '');
        content = content.replace(/\\usepackage(\[[^\]]*\])?\{[^}]+\}/g, '');
        content = content.replace(/\\begin\{document\}/g, '');
        content = content.replace(/\\end\{document\}/g, '');
        
        // Paragraphs - double newlines become <p>
        content = content.replace(/\n\n+/g, '</p><p>');
        content = '<p>' + content + '</p>';
        content = content.replace(/<p>\s*<\/p>/g, '');
        
        // Clean up
        content = content.replace(/<p>(<h[1-4]>)/g, '$1');
        content = content.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
        
        preview.innerHTML = content;
    },
    
    export() {
        const textarea = document.getElementById('editor-textarea');
        if (!textarea) return;
        
        const content = textarea.value;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'paper.tex';
        a.click();
        URL.revokeObjectURL(url);
    }
};
