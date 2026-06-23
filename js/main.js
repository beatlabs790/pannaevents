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
    
    // Safety timeout in case window load takes too long
    window.addEventListener('load', fadeOutLoader);
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
});
