document.addEventListener('DOMContentLoaded', () => {
    // --- Loading Screen ---
    const loadingScreen = document.getElementById('loading-screen');
    const fadeOutLoader = () => {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 800);
        }
    };
    
    // Safety check in case the page is already loaded (eliminates race conditions)
    if (document.readyState === 'complete') {
        fadeOutLoader();
    } else {
        window.addEventListener('load', fadeOutLoader);
    }
    
    // Safety timeout in case window load takes too long
    setTimeout(fadeOutLoader, 2500);

    // --- Theme Management ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('panna-theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('panna-theme', newTheme);
            updateThemeIcon(newTheme);
            // Re-init canvas background to adjust particle colors if needed
            if (window.initCanvasBg) {
                window.initCanvasBg();
            }
        });
    }

    function updateThemeIcon(theme) {
        const themeIcon = document.getElementById('theme-icon-path');
        if (!themeIcon) return;
        
        if (theme === 'dark') {
            // Sun icon for dark mode (to switch back to light)
            themeIcon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z');
        } else {
            // Moon icon for light mode (to switch to dark)
            themeIcon.setAttribute('d', 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z');
        }
    }

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
            // Disable scroll when mobile menu is active
            document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Close menu when clicking a link
        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }

    // --- Scroll Animations (Intersection Observer) ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Unobserve once animated
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- Active Link Highlight ---
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (currentPath === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // --- Live Background Interactive Particle Bokeh ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: null, y: null, radius: 100 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createParticles();
        };

        class Particle {
            constructor(x, y, size, speedX, speedY, opacity) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speedX = speedX;
                this.speedY = speedY;
                this.opacity = opacity;
                this.originalOpacity = opacity;
                this.baseSize = size;
            }

            draw() {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                
                // Beautiful warm bokeh color selection
                // Dark mode: gold, amber, champagne
                // Light mode: soft yellow gold
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
                
                let gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
                if (isDark) {
                    gradient.addColorStop(0, `rgba(216, 183, 136, ${this.opacity})`);
                    gradient.addColorStop(0.5, `rgba(184, 152, 108, ${this.opacity * 0.4})`);
                    gradient.addColorStop(1, 'rgba(11, 10, 9, 0)');
                } else {
                    gradient.addColorStop(0, `rgba(184, 152, 108, ${this.opacity * 0.7})`);
                    gradient.addColorStop(0.6, `rgba(216, 183, 136, ${this.opacity * 0.25})`);
                    gradient.addColorStop(1, 'rgba(253, 252, 247, 0)');
                }
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            update() {
                // Gentle float movement
                this.y += this.speedY;
                this.x += this.speedX;

                // Border check
                if (this.y < -this.size * 2) {
                    this.y = canvas.height + this.size * 2;
                    this.x = Math.random() * canvas.width;
                }
                if (this.x < -this.size * 2 || this.x > canvas.width + this.size * 2) {
                    this.x = Math.random() * canvas.width;
                    this.y = canvas.height + this.size * 2;
                }

                // Mouse interaction - particles gently float away from cursor
                if (mouse.x !== null && mouse.y !== null) {
                    let dx = this.x - mouse.x;
                    let dy = this.y - mouse.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < mouse.radius) {
                        let force = (mouse.radius - distance) / mouse.radius;
                        let directionX = dx / distance;
                        let directionY = dy / distance;
                        this.x += directionX * force * 3;
                        this.y += directionY * force * 3;
                        this.opacity = Math.min(this.originalOpacity * 1.5, 0.8);
                        this.size = Math.min(this.baseSize * 1.25, 40);
                    } else {
                        if (this.opacity > this.originalOpacity) this.opacity -= 0.01;
                        if (this.size > this.baseSize) this.size -= 0.1;
                    }
                } else {
                    if (this.opacity > this.originalOpacity) this.opacity -= 0.01;
                    if (this.size > this.baseSize) this.size -= 0.1;
                }

                this.draw();
            }
        }

        function createParticles() {
            particles = [];
            // Lower particle count on mobile for optimization, higher on desktop
            const numberOfParticles = window.innerWidth < 768 ? 20 : 50;
            
            for (let i = 0; i < numberOfParticles; i++) {
                const size = Math.random() * 20 + 8; // Soft bokeh circles
                const x = Math.random() * canvas.width;
                const y = Math.random() * canvas.height;
                const speedX = (Math.random() * 0.4) - 0.2;
                const speedY = -(Math.random() * 0.4 + 0.1); // float upwards
                const opacity = Math.random() * 0.25 + 0.08;
                particles.push(new Particle(x, y, size, speedX, speedY, opacity));
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
            }
            requestAnimationFrame(animate);
        }

        window.initCanvasBg = () => {
            // Can be used to recalculate or reset canvas variables when mode changes
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        animate();
    }

    // --- Panna AI Chatbot Injection & Logic ---
    const injectChatbot = () => {
        const widget = document.createElement('div');
        widget.id = 'panna-ai-widget';
        widget.innerHTML = `
            <button id="panna-ai-toggle" aria-label="Open Panna AI Chat">
                <span class="ai-icon">✦</span>
                <span class="ai-label">Panna AI</span>
            </button>
            <div id="panna-ai-box">
                <div id="panna-ai-header">
                    <div class="ai-avatar">✦</div>
                    <div class="ai-title-info">
                        <h4>Panna AI</h4>
                        <span>Active Now</span>
                    </div>
                    <button id="panna-ai-close" aria-label="Close Chat">&times;</button>
                </div>
                <div id="panna-ai-messages">
                    <div class="ai-msg bot">
                        <p>Hello! I am Panna AI, your event planning assistant. How can I help you today? Ask me about our decoration packages, catering menu options, or office location!</p>
                    </div>
                </div>
                <div id="panna-ai-input-area">
                    <input type="text" id="panna-ai-input" placeholder="Type a message..." autocomplete="off">
                    <button id="panna-ai-send">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Core Selectors
        const toggleBtn = document.getElementById('panna-ai-toggle');
        const closeBtn = document.getElementById('panna-ai-close');
        const inputField = document.getElementById('panna-ai-input');
        const sendBtn = document.getElementById('panna-ai-send');
        const messagesDiv = document.getElementById('panna-ai-messages');

        // Toggle Chatbox
        toggleBtn.addEventListener('click', () => {
            widget.classList.toggle('active');
            if (widget.classList.contains('active')) {
                inputField.focus();
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            widget.classList.remove('active');
        });

        // Initialize Chrome window.ai (Gemini Nano) if available
        let aiSession = null;
        const initAiSession = async () => {
            if (window.ai && window.ai.createTextSession) {
                try {
                    const systemPrompt = "You are Panna AI, a friendly assistant for Panna Event decors & Caterers in Patna. " +
                                         "Address: Maurya Path, near Shyamal Hospital, Jyotipuram Colony, Magistrate Colony, Khajpura, Patna, Bihar 800025. " +
                                         "Phones: 9835445915, 7979741127. " +
                                         "Pricing: Catering depends on menu items & wedding event depends on design & theme. " +
                                         "We offer: Venue Booking, Decoration, Catering, Makeup/Mehendi, Photography, DJ, Corporate Conferences. " +
                                         "Keep answers brief, warm, helpful, and human-like.";
                    aiSession = await window.ai.createTextSession({ systemPrompt: systemPrompt });
                } catch (e) {
                    console.warn("Failed to initialize Chrome window.ai session:", e);
                }
            }
        };
        initAiSession();

        // Chat Brain
        const handleSendMessage = async () => {
            const userText = inputField.value.trim();
            if (!userText) return;

            // Append User Message
            appendMessage(userText, 'user');
            inputField.value = '';

            // Show Typing Indicator
            const indicator = showTypingIndicator();
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Handle reply
            setTimeout(async () => {
                let botReply = "";
                if (aiSession) {
                    try {
                        botReply = await aiSession.prompt(userText);
                    } catch (e) {
                        console.error("Chrome window.ai error, falling back to local matcher:", e);
                        botReply = generateBotReply(userText);
                    }
                } else {
                    botReply = generateBotReply(userText);
                }
                
                removeTypingIndicator(indicator);
                appendMessage(botReply, 'bot');
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 800 + Math.random() * 500);
        };

        sendBtn.addEventListener('click', handleSendMessage);
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });

        const appendMessage = (text, sender) => {
            const msgEl = document.createElement('div');
            msgEl.className = `ai-msg ${sender}`;
            msgEl.innerHTML = `<p>${text}</p>`;
            messagesDiv.appendChild(msgEl);
        };

        const showTypingIndicator = () => {
            const indEl = document.createElement('div');
            indEl.className = 'typing-indicator';
            indEl.innerHTML = '<span></span><span></span><span></span>';
            messagesDiv.appendChild(indEl);
            return indEl;
        };

        const removeTypingIndicator = (element) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        };

        const generateBotReply = (text) => {
            const input = text.toLowerCase();
            
            if (input.includes('location') || input.includes('address') || input.includes('office') || input.includes('where')) {
                return "We are located at: <strong>Maurya Path, near Shyamal Hospital, Jyotipuram Colony, Magistrate Colony, Khajpura, Patna, Bihar 800025</strong>. We would love to host you for a cup of tea and a layout planning session!";
            }
            if (input.includes('service') || input.includes('decor') || input.includes('event') || input.includes('cater') || input.includes('what do you do') || input.includes('cater')) {
                return "Panna Events offers premium event planning: 1. Venue Booking, 2. Bespoke Decoration (Stages, Haldi, etc.), 3. Gourmet Catering (Veg/Non-Veg), 4. Bridal Makeup/Mehendi, 5. Photography, 6. Artist/DJ, 7. Corporate Seminars. Explore full details on our Services page!";
            }
            if (input.includes('price') || input.includes('cost') || input.includes('rate') || input.includes('charge') || input.includes('package') || input.includes('fee')) {
                return "For Panna Events, our catering prices vary depending on the specific menu items you choose, and our decoration rates depend entirely on your chosen theme and design layouts. Please contact us directly for a free custom quote!";
            }
            if (input.includes('book') || input.includes('contact') || input.includes('phone') || input.includes('number') || input.includes('call') || input.includes('hire')) {
                return "You can book by visiting our Contact page and filling out the details—it redirects you directly to WhatsApp with your details prefilled! Or call Saurav directly at <strong>9835445915</strong> or <strong>7979741127</strong>.";
            }
            if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('greet')) {
                return "Hello! I'm Panna AI, your friendly helper. How are you doing? What event details can I help you search for today?";
            }
            if (input.includes('thanks') || input.includes('thank you') || input.includes('great') || input.includes('awesome')) {
                return "You're very welcome! I'm here to help. Let me know if you have any other questions about planning your special day.";
            }
            if (input.includes('zephyr')) {
                return "Ah, ZephyrDevs! They are the talented design team who engineered this beautiful, mobile-first website for us. You can check them out on our Developers page!";
            }
            if (input.includes('food') || input.includes('menu') || input.includes('veg') || input.includes('non-veg')) {
                return "We serve premium Vegetarian (Veg) and Non-Vegetarian (Non-Veg) catering packages. The pricing depends on chosen menu items. We feature live counters, Indian, and Chinese specialties.";
            }
            if (input.includes('haldi') || input.includes('mehendi') || input.includes('house') || input.includes('pravesh') || input.includes('wedding')) {
                return "Yes, we specialize in theme decors! From royal wedding stage backdrops and yellow marigold Haldi/Mehendi seating to traditional Griha Pravesham (housewarming) door entrances. View our work on the Gallery page!";
            }

            return "That sounds interesting! Since I'm still learning, could you please contact Saurav directly at <strong>9835445915</strong> or send us a WhatsApp message via our Contact page? They will answer any specific design queries you have!";
        };
    };

    injectChatbot();
});
