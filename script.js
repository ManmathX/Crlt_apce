// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Satellite tracker interaction
class SatelliteTracker {
    constructor() {
        this.satellites = {
            'ISS': {
                name: 'International Space Station',
                altitude: '408 km',
                speed: '27,600 km/h',
                mission: 'Research & Development',
                orbit: 1
            },
            'Hubble': {
                name: 'Hubble Space Telescope',
                altitude: '547 km',
                speed: '27,300 km/h',
                mission: 'Deep Space Observation',
                orbit: 2
            },
            'GPS-III': {
                name: 'GPS III Satellite',
                altitude: '20,200 km',
                speed: '14,000 km/h',
                mission: 'Global Navigation',
                orbit: 3
            }
        };
        
        this.init();
    }
    
    init() {
        // Add click events to satellite dots
        document.querySelectorAll('.satellite-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const satelliteName = e.target.getAttribute('data-name');
                this.showSatelliteInfo(satelliteName);
            });
            
            // Add hover effects
            dot.addEventListener('mouseenter', (e) => {
                e.target.style.transform = 'translateX(-50%) scale(1.5)';
                e.target.style.boxShadow = '0 0 25px #ff6b6b';
            });
            
            dot.addEventListener('mouseleave', (e) => {
                e.target.style.transform = 'translateX(-50%) scale(1)';
                e.target.style.boxShadow = '0 0 15px #ff6b6b';
            });
        });
        
        // Auto-cycle through satellites
        this.startAutoCycle();
    }
    
    showSatelliteInfo(satelliteName) {
        // Remove active class from all cards
        document.querySelectorAll('.info-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Add active class to selected card
        const selectedCard = document.querySelector(`[data-satellite="${satelliteName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
    }
    
    startAutoCycle() {
        const satellites = Object.keys(this.satellites);
        let currentIndex = 0;
        
        setInterval(() => {
            this.showSatelliteInfo(satellites[currentIndex]);
            currentIndex = (currentIndex + 1) % satellites.length;
        }, 3000);
    }
}

// Form handling
class HackathonForm {
    constructor() {
        this.form = document.getElementById('hackathon-form');
        this.init();
    }
    
    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this.form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Simulate form submission
        this.showSubmissionFeedback();
    }
    
    showSubmissionFeedback() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.textContent = 'Launching...';
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            submitBtn.textContent = 'Mission Accepted! 🚀';
            submitBtn.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
            
            // Reset form
            setTimeout(() => {
                this.form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 3000);
        }, 2000);
    }
}

// Parallax scrolling effect
class ParallaxEffect {
    constructor() {
        this.init();
    }
    
    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }
    
    handleScroll() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.satellite-orbit, .earth');
        
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform += ` translateY(${yPos}px)`;
        });
    }
}

// Real-time satellite data simulation
class SatelliteDataSimulator {
    constructor() {
        this.isRunning = false;
        this.dataPoints = [];
        this.init();
    }
    
    init() {
        // Add data visualization button
        this.addDataButton();
        this.startDataSimulation();
    }
    
    addDataButton() {
        const heroButtons = document.querySelector('.hero-buttons');
        if (heroButtons) {
            const dataBtn = document.createElement('button');
            dataBtn.className = 'btn btn-secondary';
            dataBtn.textContent = 'Live Data Feed';
            dataBtn.addEventListener('click', this.toggleDataFeed.bind(this));
            heroButtons.appendChild(dataBtn);
        }
    }
    
    toggleDataFeed() {
        if (!this.isRunning) {
            this.startDataFeed();
        } else {
            this.stopDataFeed();
        }
    }
    
    startDataFeed() {
        this.isRunning = true;
        this.createDataOverlay();
        
        this.dataInterval = setInterval(() => {
            this.updateSatelliteData();
        }, 2000);
    }
    
    stopDataFeed() {
        this.isRunning = false;
        clearInterval(this.dataInterval);
        
        const overlay = document.querySelector('.data-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    createDataOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'data-overlay';
        overlay.innerHTML = `
            <div class="data-panel">
                <h3>🛰️ Live Satellite Feed</h3>
                <div class="data-stream"></div>
                <button class="close-data">×</button>
            </div>
        `;
        
        // Add styles
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const panel = overlay.querySelector('.data-panel');
        panel.style.cssText = `
            background: rgba(0, 20, 40, 0.95);
            border: 1px solid #00d4ff;
            border-radius: 15px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            color: white;
            font-family: 'Orbitron', monospace;
            position: relative;
        `;
        
        const closeBtn = overlay.querySelector('.close-data');
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            color: #ff6b6b;
            font-size: 1.5rem;
            cursor: pointer;
        `;
        
        closeBtn.addEventListener('click', () => this.stopDataFeed());
        
        document.body.appendChild(overlay);
    }
    
    updateSatelliteData() {
        const dataStream = document.querySelector('.data-stream');
        if (!dataStream) return;
        
        const satellites = ['ISS', 'Hubble', 'GPS-III', 'Starlink-1', 'NOAA-20'];
        const randomSat = satellites[Math.floor(Math.random() * satellites.length)];
        const timestamp = new Date().toLocaleTimeString();
        
        const dataEntry = document.createElement('div');
        dataEntry.style.cssText = `
            margin: 0.5rem 0;
            padding: 0.5rem;
            background: rgba(0, 212, 255, 0.1);
            border-left: 3px solid #00d4ff;
            font-size: 0.9rem;
            animation: fadeIn 0.5s ease;
        `;
        
        dataEntry.innerHTML = `
            <strong>${randomSat}</strong> - ${timestamp}<br>
            <span style="color: #4ecdc4;">Signal: ${(Math.random() * 100).toFixed(1)}%</span> | 
            <span style="color: #ff6b6b;">Altitude: ${(Math.random() * 1000 + 400).toFixed(0)}km</span>
        `;
        
        dataStream.insertBefore(dataEntry, dataStream.firstChild);
        
        // Keep only last 5 entries
        while (dataStream.children.length > 5) {
            dataStream.removeChild(dataStream.lastChild);
        }
    }
    
    startDataSimulation() {
        // Add CSS animation for fade in
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Intersection Observer for animations
class AnimationController {
    constructor() {
        this.init();
    }
    
    init() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.mission-card, .timeline-item, .info-card').forEach(el => {
            this.observer.observe(el);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'slideInUp 0.6s ease forwards';
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// Add slide in animation
const slideInStyle = document.createElement('style');
slideInStyle.textContent = `
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(slideInStyle);

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SatelliteTracker();
    new HackathonForm();
    new ParallaxEffect();
    new SatelliteDataSimulator();
    new AnimationController();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Easter egg: Konami code for special animation
let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.keyCode);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.length === konamiSequence.length && 
        konamiCode.every((code, index) => code === konamiSequence[index])) {
        
        // Trigger special space animation
        document.body.style.animation = 'hyperspace 2s ease';
        
        setTimeout(() => {
            alert('🚀 Welcome to the secret space mission, Commander! 🛰️');
            document.body.style.animation = '';
        }, 2000);
    }
});

// Add hyperspace animation
const hyperspaceStyle = document.createElement('style');
hyperspaceStyle.textContent = `
    @keyframes hyperspace {
        0% { transform: scale(1); filter: blur(0px); }
        50% { transform: scale(1.1); filter: blur(2px); }
        100% { transform: scale(1); filter: blur(0px); }
    }
`;
document.head.appendChild(hyperspaceStyle);
