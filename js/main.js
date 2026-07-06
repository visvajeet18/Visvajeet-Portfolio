class PortfolioCore {
    constructor() {
        this.audioCtx = null;
        this.secretClickCount = 0;
        this.isAdmin = false;
        this.isTyping = false;
        this.password = "vichu@2612";
        this.editableSelectors = 'p, span, h1, h2, h3, h4, .cert-name, .cert-desc, .skill-tag, .card-value, .card-title, .card-desc, .tag, .hero-greeting, .freelance-text, .philosophy-text, .detailed-bio-text, .category-title, .memory-title, .memory-desc';
        
        // Detailed responses are now loaded from the external js/ai_brain.js file
        
        this.init();
    }

    init() {
        document.addEventListener('mousedown', () => this.playClickSound());
        document.addEventListener('click', (e) => this.handleSecretTrigger(e));
        
        // Prevent link navigation when editing
        document.addEventListener('click', (e) => {
            if (this.isAdmin) {
                const link = e.target.closest('a');
                if (link && !e.target.closest('.hud-btn, .admin-modal, .item-delete-btn, .img-edit-overlay, .admin-add-btn, .admin-add-category-btn, .resume-edit-overlay, .ai-assistant-widget')) {
                    e.preventDefault();
                }
            }
        });

        this.createAdminElements();
        this.initCustomCursor();
        this.initScrollProgress();
        this.initDigitalTwin();
        this.initMobileMenu();
        this.initScrollAnimations();
        this.loadEdits();
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playClickSound() {
        this.initAudio();
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.03);
        gainNode.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.03);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.03);
    }

    handleSecretTrigger(e) {
        const isTriggerTarget = e.target.classList.contains('nav-bar') || 
                               e.target.classList.contains('nav-container') ||
                               e.target.closest('.white-eye') || 
                               e.target.closest('.profile-img') || 
                               e.target.closest('.status-dot');

        if (isTriggerTarget) {
            this.secretClickCount++;
            if (this.secretClickCount >= 5) {
                this.showLogin();
                this.secretClickCount = 0;
            }
        } else {
            this.secretClickCount = 0; 
        }
    }

    createAdminElements() {
        const existingModal = document.getElementById('adminModal');
        if (existingModal && !existingModal.querySelector('.modal-close-btn')) {
            existingModal.remove();
            document.querySelector('.admin-hud')?.remove();
        }
        
        if (document.getElementById('adminModal')) return;

        const modalHtml = `
            <div class="admin-modal-overlay" id="adminModal">
                <div class="admin-modal">
                    <button class="modal-close-btn" onclick="portfolio.closeLogin()">×</button>
                    <h2>SYSTEM ACCESS</h2>
                    <input type="password" id="adminPassword" placeholder="Enter Security Code">
                    <button class="btn-login" onclick="portfolio.login()">AUTHORIZE</button>
                    <p style="font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 15px;">SECURED PORTAL v3.0</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const hudHtml = `
            <div class="admin-hud">
                <div class="hud-btn btn-save" data-tooltip="Save Edits" onclick="portfolio.saveEdits()">💾</div>
                <div class="hud-btn btn-download" data-tooltip="Download Source" onclick="portfolio.downloadSource()">📥</div>
                <div class="hud-btn btn-exit" data-tooltip="Exit Admin Mode" onclick="portfolio.toggleEditMode(false)">❌</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', hudHtml);

        document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    showLogin() {
        document.getElementById('adminModal').classList.add('active');
        document.getElementById('adminPassword').focus();
    }

    closeLogin() {
        document.getElementById('adminModal').classList.remove('active');
        document.getElementById('adminPassword').value = "";
    }

    login() {
        const pass = document.getElementById('adminPassword').value;
        if (pass === this.password) {
            this.toggleEditMode(true);
            document.getElementById('adminModal').classList.remove('active');
            document.getElementById('adminPassword').value = "";
            this.notify("ACCESS GRANTED", "success");
        } else {
            this.notify("ACCESS DENIED", "error");
            document.getElementById('adminPassword').value = "";
        }
    }

    toggleEditMode(active) {
        this.isAdmin = active;
        document.body.classList.toggle('admin-mode-active', active);
        
        const editableElements = document.querySelectorAll(this.editableSelectors);
        editableElements.forEach(el => {
            el.contentEditable = active;
        });

        const aiWidget = document.querySelector('.ai-assistant-widget');
        if (aiWidget) {
            aiWidget.classList.toggle('shifted', active);
        }

        if (active) {
            this.injectImageEditTools();
            this.injectListTools();
            this.injectDeletionTools();
            this.injectResumeTools();
            
            const hud = document.querySelector('.admin-hud');
            // Add Reset Button to HUD for all pages to clear old/broken saves
            if (!hud.querySelector('.admin-reset-btn')) {
                const resetBtn = document.createElement('button');
                resetBtn.className = 'hud-btn admin-reset-btn';
                resetBtn.setAttribute('data-tooltip', 'Reset All Page Edits');
                resetBtn.innerHTML = '🔄';
                resetBtn.onclick = () => {
                    if (confirm("Reset all saved data for THIS page? This will restore the navigation bar and layout to factory settings.")) {
                        localStorage.removeItem(`portfolio_content_${window.location.pathname}`);
                        location.reload();
                    }
                };
                hud.appendChild(resetBtn);
            }
        } else {
            this.removeInjectionTools();
        }
    }

    injectImageEditTools() {
        const images = document.querySelectorAll('.profile-img, .hero img, .cert-icon, .card-img');
        images.forEach(img => {
            if (img.parentElement.querySelector('.img-edit-overlay')) return;
            const overlay = document.createElement('div');
            overlay.className = 'img-edit-overlay';
            overlay.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button onclick="portfolio.promptImageUrl(this)">URL Link</button>
                    <button onclick="portfolio.triggerFileUpload(this)">Local File</button>
                </div>
            `;
            img.parentElement.style.position = 'relative';
            img.parentElement.appendChild(overlay);
        });
    }

    promptImageUrl(btn) {
        const img = btn.closest('.img-edit-overlay').previousElementSibling;
        const newUrl = prompt("Enter Image URL:", img.src);
        if (newUrl) {
            img.src = newUrl;
            this.notify("Image Link Updated", "success");
        }
    }

    triggerFileUpload(btn) {
        const img = btn.closest('.img-edit-overlay').previousElementSibling;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    img.src = event.target.result;
                    this.notify("Local Image Uploaded", "success");
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    injectResumeTools() {
        const resumeLinks = document.querySelectorAll('a[href*=".pdf"], a');
        resumeLinks.forEach(link => {
            if (link.innerText.toLowerCase().includes('resume') && !link.querySelector('.resume-edit-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'resume-edit-overlay';
                overlay.innerHTML = '<button onclick="portfolio.triggerResumeUpload(this)">Update PDF</button>';
                link.style.position = 'relative';
                link.appendChild(overlay);
            }
        });
    }

    triggerResumeUpload(btn) {
        const link = btn.closest('a');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    link.href = event.target.result;
                    this.notify("Resume PDF Updated", "success");
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    injectListTools() {
        // Tag addition
        const tagClouds = document.querySelectorAll('.tag-cloud, .tags');
        tagClouds.forEach(cloud => {
            if (cloud.parentElement.querySelector(':scope > .admin-add-tag-btn')) return;
            const btn = document.createElement('button');
            btn.className = 'admin-add-btn admin-add-tag-btn';
            btn.innerHTML = '<span>+</span> Add Tag';
            btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                let firstTag = cloud.querySelector('.skill-tag, .tag');
                if (!firstTag) {
                    // Create a dummy tag if none exists
                    const dummy = document.createElement('span');
                    dummy.className = cloud.classList.contains('tags') ? 'tag' : 'skill-tag';
                    cloud.appendChild(dummy);
                    firstTag = dummy;
                }
                const newTag = firstTag.cloneNode(true);
                newTag.innerText = "New Item";
                newTag.contentEditable = true;
                cloud.appendChild(newTag);
                this.injectDeletionTools();
            };
            cloud.after(btn);
        });

        // Unified list item addition
        const listConfigs = [
            { container: '.projects-grid', item: '.project-card', btnText: 'Add New Project', template: null },
            { container: '.skills-grid', item: '.skill-category', btnText: 'Add New Skill Group', template: null },
            { container: '.certs-grid, .cert-list', item: '.cert-item', btnText: 'Add New Certificate', template: null },
            { container: '.memories-grid', item: '.memory-card', btnText: 'Add New Memory', template: '#memoryTemplate' }
        ];

        listConfigs.forEach(cfg => {
            const containers = document.querySelectorAll(cfg.container);
            containers.forEach(container => {
                const existingBtn = container.parentElement.querySelector(':scope > .admin-add-list-btn');
                if (existingBtn) return;
                
                const btn = document.createElement('button');
                btn.className = 'admin-add-btn admin-add-list-btn';
                btn.innerHTML = `<span>+</span> ${cfg.btnText}`;
                btn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    
                    // Interaction flow for Memories
                    let userImg = null, userTitle = null, userDesc = null;
                    if (cfg.container === '.memories-grid') {
                        userImg = prompt("Enter Image URL (or path for local image):", "https://");
                        if (!userImg) return;
                        userTitle = prompt("Enter Memory Title:", "Event Name");
                        if (!userTitle) return;
                        userDesc = prompt("Enter Short Description:", "What happened?");
                        if (!userDesc) return;
                    }

                    this.removeInjectionTools();
                    
                    // Try to find first real item or use template
                    let firstItem = container.querySelector(cfg.item + ':not(.admin-template)');
                    if (!firstItem && cfg.template) {
                        firstItem = document.querySelector(cfg.template);
                    }
                    if (firstItem) {
                        const newItem = firstItem.cloneNode(true);
                        newItem.id = ""; 
                        newItem.classList.remove('admin-template');
                        newItem.classList.remove('reveal-ready'); // Prevent hidden state
                        newItem.classList.add('visible'); // Force visible state
                        newItem.style.display = "block"; // Force block display
                        newItem.style.opacity = "1";
                        newItem.style.visibility = "visible";
                        
                        // Set content
                        if (userTitle && userDesc) {
                            const titleEl = newItem.querySelector('.memory-title, .card-title, h3');
                            const descEl = newItem.querySelector('.memory-desc, .card-desc, p');
                            if (titleEl) {
                                titleEl.innerText = userTitle;
                                titleEl.style.color = "var(--text-heading)";
                            }
                            if (descEl) {
                                descEl.innerText = userDesc;
                                descEl.style.color = "var(--text-body)";
                            }
                        }

                        // Set image
                        const img = newItem.querySelector('img');
                        if (img) {
                            img.src = userImg || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop";
                            img.alt = userTitle || "Captured Moment";
                            img.style.display = "block";
                        }

                        // Reset tags
                        const tagContainer = newItem.querySelector('.tags, .tag-cloud');
                        if (tagContainer) {
                            const tags = tagContainer.querySelectorAll('.tag, .skill-tag');
                            tags.forEach((t, i) => { if (i > 0) t.remove(); });
                            if (tags[0]) tags[0].innerText = "#Moment";
                        }
                        
                        // Remove placeholder
                        const placeholder = container.querySelector('.no-memories-placeholder');
                        if (placeholder) placeholder.remove();

                        container.appendChild(newItem);
                        this.injectListTools(); // Ensure tag buttons are added to the NEW item
                        this.injectImageEditTools(); // Ensure image tools are added
                        this.injectDeletionTools(); // Ensure delete button is added
                        
                        this.notify("New Item Added", "success");
                    }
                };
                container.after(btn);
            });
        });
    }

    injectDeletionTools() {
        const deletableItems = document.querySelectorAll('.cert-item, .project-card, .skill-tag, .tag, .skill-category, .memory-card');
        deletableItems.forEach(item => {
            if (item.querySelector('.item-delete-btn')) return;
            const delBtn = document.createElement('div');
            delBtn.className = 'item-delete-btn';
            delBtn.innerHTML = '×';
            delBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                if (confirm('Are you sure you want to delete this item?')) {
                    const parent = item.parentElement;
                    const isMemory = item.classList.contains('memory-card');
                    item.remove();
                    this.notify("Item Removed", "success");

                    // Restore placeholder for memories if empty
                    if (isMemory && parent && parent.classList.contains('memories-grid')) {
                        const remaining = parent.querySelectorAll('.memory-card:not(.admin-template)');
                        if (remaining.length === 0 && !parent.querySelector('.no-memories-placeholder')) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'no-memories-placeholder';
                            placeholder.innerHTML = `<h2>No memories found</h2><p>Will Be Displayed Once Admin Adds Them</p>`;
                            parent.appendChild(placeholder);
                        }
                    }
                }
            };
            if (getComputedStyle(item).position === 'static') { item.style.position = 'relative'; }
            item.appendChild(delBtn);
        });
    }

    removeInjectionTools() {
        document.querySelectorAll('.img-edit-overlay, .admin-add-btn, .item-delete-btn, .admin-add-category-btn, .resume-edit-overlay, .custom-cursor, .custom-cursor-dot, .scroll-progress').forEach(el => el.remove());
    }

    saveEdits() {
        const wasAdmin = this.isAdmin;
        this.toggleEditMode(false); 
        this.removeInjectionTools(); 
        const currentPath = window.location.pathname;
        const pageContent = document.body.innerHTML;
        localStorage.setItem(`portfolio_content_${currentPath}`, pageContent);
        this.notify("Changes Saved to Browser", "success");
        if (wasAdmin) setTimeout(() => this.toggleEditMode(true), 100); 
    }

    loadEdits() {
        const currentPath = window.location.pathname;
        const savedContent = localStorage.getItem(`portfolio_content_${currentPath}`);
        if (savedContent) {
            document.body.innerHTML = savedContent;
            // Re-initialize core components lost in innerHTML swap
            this.createAdminElements();
            this.initCustomCursor();
            this.initScrollProgress();
            this.initDigitalTwin();
            this.initScrollAnimations();
            this.initMobileMenu();
            
            if (localStorage.getItem('portfolio_admin') === 'true') {
                this.toggleEditMode(true);
            }
        }
    }

    downloadSource() {
        const wasAdmin = this.isAdmin;
        this.toggleEditMode(false); 
        this.removeInjectionTools();
        const overlay = document.getElementById('adminModal');
        const hud = document.querySelector('.admin-hud');
        if (overlay) overlay.remove();
        if (hud) hud.remove();
        const htmlContent = `<!DOCTYPE html>\n` + document.documentElement.outerHTML;
        this.createAdminElements();
        if (wasAdmin) this.toggleEditMode(true);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = window.location.pathname.split('/').pop() || 'index.html';
        a.href = url;
        a.download = `updated_` + filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Trigger download
        a.click();
        
        // Cleanup after a delay to ensure browser triggers the download
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        this.notify("Updated Source Downloaded", "success");
    }

    initCustomCursor() {
        document.querySelectorAll('.custom-cursor, .custom-cursor-dot').forEach(el => el.remove());
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        const dot = document.createElement('div');
        dot.className = 'custom-cursor-dot';
        document.body.appendChild(cursor); document.body.appendChild(dot);
        const moveHandler = (e) => {
            if (!cursor.parentElement) { document.removeEventListener('mousemove', moveHandler); return; }
            cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px';
            dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
            const target = e.target;
            if (target.closest('a, button, .hud-btn, .skill-tag, .cert-item, .project-card, .tag, .skill-category, .option-btn, .ai-assistant-btn')) {
                cursor.classList.add('cursor-hover');
            } else { cursor.classList.remove('cursor-hover'); }
        };
        document.addEventListener('mousemove', moveHandler);
    }

    initMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const nav = document.getElementById('mainNav');
        
        if (!toggle || !nav) return;

        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            nav.classList.toggle('mobile-active');
            document.body.style.overflow = nav.classList.contains('mobile-active') ? 'hidden' : '';
        });

        // Close menu on link click
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                nav.classList.remove('mobile-active');
                document.body.style.overflow = '';
            });
        });
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal-on-scroll, .reveal-ready, .project-card, .skill-category, .cert-item, .memory-card').forEach(el => {
            if (!el.classList.contains('reveal-ready')) el.classList.add('reveal-ready');
            observer.observe(el);
        });
    }

    initScrollProgress() {
        document.querySelectorAll('.scroll-progress').forEach(el => el.remove());
        const bar = document.createElement('div'); bar.className = 'scroll-progress';
        document.body.appendChild(bar);
        const scrollHandler = () => {
            if (!bar.parentElement) { window.removeEventListener('scroll', scrollHandler); return; }
            const winScroll = window.pageYOffset;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0; 
            bar.style.width = scrolled + "%";
        };
        window.addEventListener('scroll', scrollHandler);
    }

    initDigitalTwin() {
        if (document.querySelector('.ai-assistant-widget')) return;
        const widgetHtml = `
            <div class="ai-assistant-widget">
                <button class="ai-assistant-btn" onclick="portfolio.toggleChat()">🤖</button>
                <div class="chat-window" id="aiChatWindow">
                    <div class="chat-header">
                        <h3>VISVAJEET AI TWIN</h3>
                        <span class="close-chat" onclick="portfolio.toggleChat()">×</span>
                    </div>
                    <div class="chat-body" id="chatBody">
                        <div class="ai-msg">Greetings, Specialist. How can my digital consciousness assist you today?</div>
                    </div>
                    <div class="user-options">
                        <button class="option-btn" onclick="portfolio.askAI('strengths')">Core technical strengths?</button>
                        <button class="option-btn" onclick="portfolio.askAI('complex_problem')">Solving a complex problem?</button>
                        <button class="option-btn" onclick="portfolio.askAI('conflict')">Handling team conflicts?</button>
                        <button class="option-btn" onclick="portfolio.askAI('learning')">Keeping up with AI/Cyber?</button>
                        <button class="option-btn" onclick="portfolio.askAI('stack')">Primary technical stack?</button>
                        <button class="option-btn" onclick="portfolio.askAI('cyber')">AI + Cyber Security?</button>
                        <button class="option-btn" onclick="portfolio.askAI('non_tech')">Explaining to non-tech?</button>
                        <button class="option-btn" onclick="portfolio.askAI('environment')">Ideal work environment?</button>
                        <button class="option-btn" onclick="portfolio.askAI('availability')">Location & Availability?</button>
                        <button class="option-btn" onclick="portfolio.askAI('why_hire')">Why should we hire you?</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHtml);
    }

    toggleChat() {
        document.getElementById('aiChatWindow').classList.toggle('active');
    }

    moveAssistant(active) {
        const widget = document.querySelector('.ai-assistant-widget');
        if (widget) {
            if (active) widget.classList.add('shifted');
            else widget.classList.remove('shifted');
        }
    }

    askAI(topic) {
        if (this.isTyping) return;

        const chatBody = document.getElementById('chatBody');
        const responses = AI_BRAIN[topic];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];

        // Find the button text for the topic to show as user message
        const buttons = document.querySelectorAll('.option-btn');
        let questionText = "Inquiry: " + topic;
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(topic)) {
                questionText = btn.innerText;
            }
        });

        // Add User Message
        const userDiv = document.createElement('div');
        userDiv.className = 'user-msg';
        userDiv.innerText = questionText;
        chatBody.appendChild(userDiv);

        // Prepare AI Message container
        const aiDiv = document.createElement('div');
        aiDiv.className = 'ai-msg typing';
        chatBody.appendChild(aiDiv);
        
        // Scroll to bottom
        chatBody.scrollTop = chatBody.scrollHeight;

        // Start Typing
        this.isTyping = true;
        this.typeWriter(aiDiv, randomResponse, () => {
            this.isTyping = false;
            aiDiv.classList.remove('typing');
        });
    }

    typeWriter(element, text, callback) {
        let i = 0;
        const chatBody = document.getElementById('chatBody');

        const type = () => {
            if (i < text.length) {
                const char = text.charAt(i);
                element.innerText += char;
                i++;
                
                // Base speed with random jitter (8ms to 25ms)
                let nextDelay = 8 + Math.random() * 17; 

                // Add "natural" pauses for punctuation
                if (char === '.' || char === '?' || char === '!') {
                    nextDelay = 500 + Math.random() * 300; // Long pause at end of sentence
                } else if (char === ',') {
                    nextDelay = 250 + Math.random() * 150; // Medium pause at commas
                } else if (char === ' ') {
                    nextDelay = 15 + Math.random() * 30; // Slightly longer between words
                }
                
                // Auto-scroll while typing
                if (chatBody.scrollHeight - chatBody.scrollTop < chatBody.clientHeight + 150) {
                    chatBody.scrollTop = chatBody.scrollHeight;
                }

                setTimeout(type, nextDelay);
            } else if (callback) {
                callback();
            }
        };
        type();
    }

    notify(msg, type) {
        const toast = document.createElement('div');
        toast.innerText = msg;
        toast.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${type === 'success' ? 'var(--admin-success)' : 'var(--admin-danger)'}; color: #000; padding: 10px 25px; border-radius: 50px; font-weight: 700; z-index: 10005; box-shadow: 0 10px 20px rgba(0,0,0,0.3); animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.5s forwards';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

const portfolio = new PortfolioCore();
