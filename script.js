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

// Digital Twin (ODIN) Class
class DigitalTwinODIN {
    init() {
        const runBtn = document.getElementById('odin-run');
        if (runBtn) runBtn.addEventListener('click', () => this.runSimulation());
        // Light auto-render on load
        setTimeout(() => this.renderViz(), 150);

        // Bind Physics Toolkit calculators if present
        const vvBtn = document.getElementById('calc-visviva');
        if (vvBtn) vvBtn.addEventListener('click', () => this.calcVisViva());
        const hmBtn = document.getElementById('calc-hohmann');
        if (hmBtn) hmBtn.addEventListener('click', () => this.calcHohmann());
        const rkBtn = document.getElementById('calc-rocket');
        if (rkBtn) rkBtn.addEventListener('click', () => this.calcRocket());
        const kpBtn = document.getElementById('calc-kepler');
        if (kpBtn) kpBtn.addEventListener('click', () => this.calcKepler());
        const fpaBtn = document.getElementById('calc-fpa');
        if (fpaBtn) fpaBtn.addEventListener('click', () => this.calcFPA());
        const paBtn = document.getElementById('calc-periap');
        if (paBtn) paBtn.addEventListener('click', () => this.calcPeriAp());
        const doseBasicBtn = document.getElementById('calc-dose-basic');
        if (doseBasicBtn) doseBasicBtn.addEventListener('click', () => this.calcDoseBasic());
        const doseSPBtn = document.getElementById('calc-dose-sp');
        if (doseSPBtn) doseSPBtn.addEventListener('click', () => this.calcDoseSP());
    }

    getParams() {
        return {
            hazard: document.getElementById('odin-hazard')?.value || 'none',
            objective: document.getElementById('odin-objective')?.value || 'balanced',
            live: !!document.getElementById('odin-live')?.checked
        };
    }

    runSimulation() {
        const { hazard, objective, live } = this.getParams();
        const candidates = this.generateCandidates(hazard, objective);
        const best = this.rankCandidates(candidates, objective);
        this.renderViz(hazard, candidates, best);
        this.writeDecisionLog(hazard, objective, live, candidates, best);
    }

    generateCandidates(hazard, objective) {
        // Generate 2 alternate routes with randomized metrics; base path is implicit
        const base = { name: 'Nominal', fuel: 100, time: 100, safety: hazard === 'none' ? 100 : 60 };
        const altA = { name: 'Alt A', fuel: 85 + Math.random()*10, time: 110 + Math.random()*10, safety: 80 + Math.random()*10 };
        const altB = { name: 'Alt B', fuel: 110 + Math.random()*10, time: 80 + Math.random()*10, safety: 75 + Math.random()*10 };
        if (hazard === 'solar') { altA.safety += 10; altB.time += 10; }
        if (hazard === 'debris') { altB.safety += 12; altA.time += 5; }
        if (hazard === 'radiation') { altA.safety += 8; altB.fuel += 5; }
        return [base, altA, altB];
    }

    rankCandidates(cands, objective) {
        const score = c => {
            const nf = 200/c.fuel, nt = 200/c.time, ns = c.safety; // normalize
            if (objective === 'fuel') return nf*0.6 + ns*0.4;
            if (objective === 'time') return nt*0.6 + ns*0.4;
            if (objective === 'safety') return ns*0.8 + nf*0.1 + nt*0.1;
            return nf*0.33 + nt*0.33 + ns*0.34; // balanced
        };
        let best = cands[0], bestS = -Infinity;
        for (const c of cands) { const s = score(c); if (s > bestS) { bestS = s; best = c; } }
        return best;
    }

    renderViz(hazard='none', candidates=[], best=null) {
        const canvas = document.getElementById('odin-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Clear
        ctx.fillStyle = '#001018';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        // Draw hazard zone
        if (hazard !== 'none') {
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.setLineDash([6,6]);
            ctx.beginPath();
            ctx.arc(280, 120, 50, 0, Math.PI*2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        // Base path
        const drawPath = (color, offsetY) => {
            ctx.strokeStyle = color; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(20, 220-offsetY);
            ctx.bezierCurveTo(140, 140-offsetY, 220, 200-offsetY, 400, 40+offsetY);
            ctx.stroke();
        };
        drawPath('#48dbfb', 0);
        drawPath('#feca57', 20);
        drawPath('#5f27cd', 35);
        // Best marker
        if (best) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Orbitron, monospace';
            ctx.fillText(`Best: ${best.name}`, 300, 20);
        }
    }

    writeDecisionLog(hazard, objective, live, candidates, best) {
        const el = document.getElementById('odin-log');
        if (!el) return;
        const ts = new Date().toLocaleString();
        const explain = `Objective=${objective.toUpperCase()} | Hazard=${hazard}${live? ' | LiveFeed=ON':''}`;
        const summary = `Selected ${best.name} after scoring candidates on Fuel, Time, and Safety.`;
        const tradeoffs = `Trade-offs: ${best.name === 'Alt A' ? 'Better safety, slightly longer time' : best.name === 'Alt B' ? 'Faster time, higher fuel use' : 'Nominal path with balanced metrics'}.`;
        const metrics = candidates.map(c=>`- ${c.name}: Fuel=${c.fuel.toFixed(0)}, Time=${c.time.toFixed(0)}, Safety=${c.safety.toFixed(0)}`).join('\n');
        const block = document.createElement('div');
        block.style.padding = '0.75rem';
        block.style.margin = '0.5rem 0';
        block.style.background = 'rgba(0, 212, 255, 0.06)';
        block.style.borderLeft = '3px solid #00d4ff';
        block.innerHTML = `
            <div><strong>${ts}</strong> — ${explain}</div>
            <pre style="white-space:pre-wrap;color:#9ad2ff;margin:0.5rem 0 0.25rem">${metrics}</pre>
            <div style="color:#4ecdc4">Decision: ${summary}</div>
            <div style="color:#feca57">${tradeoffs}</div>
        `;
        el.prepend(block);
        // keep recent logs
        while (el.children.length > 6) el.removeChild(el.lastChild);
    }

    // Physics Toolkit Calculators
    calcVisViva() {
        const mu = parseFloat(document.getElementById('vv-mu')?.value || '398600'); // km^3/s^2
        const r = parseFloat(document.getElementById('vv-r')?.value || '6771'); // km
        const a = parseFloat(document.getElementById('vv-a')?.value || r); // km
        const outEl = document.getElementById('vv-out');
        if (!outEl || !isFinite(mu) || !isFinite(r) || !isFinite(a) || r <= 0 || a <= 0) return;
        const v_kms = Math.sqrt(Math.max(0, mu * (2/r - 1/a))); // km/s
        const v_ms = v_kms * 1000.0;
        outEl.textContent = `v = ${v_ms.toFixed(2)} m/s (${v_kms.toFixed(4)} km/s)`;
    }

    calcHohmann() {
        const mu = parseFloat(document.getElementById('hm-mu')?.value || '398600'); // km^3/s^2
        const r1 = parseFloat(document.getElementById('hm-r1')?.value || '6678'); // km
        const r2 = parseFloat(document.getElementById('hm-r2')?.value || '42164'); // km
        const outEl = document.getElementById('hm-out');
        if (!outEl || !isFinite(mu) || !isFinite(r1) || !isFinite(r2) || r1 <= 0 || r2 <= 0) return;
        const sqrt = Math.sqrt;
        const dv1_kms = sqrt(mu/r1) * (sqrt((2*r2)/(r1+r2)) - 1);
        const dv2_kms = sqrt(mu/r2) * (1 - sqrt((2*r1)/(r1+r2)));
        const total_kms = Math.abs(dv1_kms) + Math.abs(dv2_kms);
        const dv1_ms = dv1_kms * 1000.0;
        const dv2_ms = dv2_kms * 1000.0;
        const total_ms = total_kms * 1000.0;
        outEl.textContent = `Δv1 = ${dv1_ms.toFixed(2)} m/s, Δv2 = ${dv2_ms.toFixed(2)} m/s, Total = ${total_ms.toFixed(2)} m/s`;
    }

    calcRocket() {
        const ve = parseFloat(document.getElementById('rk-ve')?.value || '3000'); // m/s
        const mi = parseFloat(document.getElementById('rk-mi')?.value || '1000'); // kg
        const mf = parseFloat(document.getElementById('rk-mf')?.value || '800'); // kg
        const outEl = document.getElementById('rk-out');
        if (!outEl || !isFinite(ve) || !isFinite(mi) || !isFinite(mf) || mi <= 0 || mf <= 0 || mi <= mf) {
            if (outEl) outEl.textContent = 'Δv = — m/s';
            return;
        }
        const dv = ve * Math.log(mi/mf);
        outEl.textContent = `Δv = ${dv.toFixed(2)} m/s`;
    }

    calcKepler() {
        const mu = parseFloat(document.getElementById('kp-mu')?.value || '398600'); // km^3/s^2
        const a = parseFloat(document.getElementById('kp-a')?.value || '10000'); // km
        const outEl = document.getElementById('kp-out');
        if (!outEl || !isFinite(mu) || !isFinite(a) || a <= 0) return;
        const T = 2 * Math.PI * Math.sqrt(Math.pow(a,3) / mu); // seconds
        const minutes = T / 60.0;
        outEl.textContent = `T = ${T.toFixed(1)} s (${minutes.toFixed(2)} min)`;
    }

    calcFPA() {
        const vr = parseFloat(document.getElementById('fp-vr')?.value || '0');
        const vt = parseFloat(document.getElementById('fp-vt')?.value || '1');
        const outEl = document.getElementById('fp-out');
        if (!outEl || !isFinite(vr) || !isFinite(vt) || vt === 0) return;
        const gammaRad = Math.atan(vr / vt);
        const gammaDeg = gammaRad * (180/Math.PI);
        outEl.textContent = `γ = ${gammaDeg.toFixed(3)} deg`;
    }

    calcPeriAp() {
        const a = parseFloat(document.getElementById('pa-a')?.value || '10000'); // km
        const e = parseFloat(document.getElementById('pa-e')?.value || '0');
        const outEl = document.getElementById('pa-out');
        if (!outEl || !isFinite(a) || !isFinite(e) || a <= 0 || e < 0 || e >= 1) {
            if (outEl) outEl.textContent = 'r_p = — km, r_a = — km';
            return;
        }
        const rp = a * (1 - e);
        const ra = a * (1 + e);
        outEl.textContent = `r_p = ${rp.toFixed(2)} km, r_a = ${ra.toFixed(2)} km`;
    }

    // Radiation Dose Toolkit
    calcDoseBasic() {
        const E_MeV = parseFloat(document.getElementById('rd-E-MeV')?.value || '0');
        const flux = parseFloat(document.getElementById('rd-flux')?.value || '0'); // 1/cm^2/s
        const area = parseFloat(document.getElementById('rd-area')?.value || '0'); // cm^2
        const time = parseFloat(document.getElementById('rd-time')?.value || '0'); // s
        const mass = parseFloat(document.getElementById('rd-mass')?.value || '1'); // kg
        const wR = parseFloat(document.getElementById('rd-wr')?.value || '1');
        const outEl = document.getElementById('dose-basic-out');
        if (!outEl) return;
        if ([E_MeV, flux, area, time, mass, wR].some(x => !isFinite(x) || x < 0) || mass === 0) {
            outEl.textContent = 'E = — J/particle, N = —, D = — Gy, H = — Sv';
            return;
        }
        const E_J = E_MeV * 1.602e-13; // J per particle
        const N = flux * area * time; // count
        const E_tot = N * E_J; // J
        const D = E_tot / mass; // Gy = J/kg
        const H = D * wR; // Sv
        outEl.textContent = `E = ${E_J.toExponential(3)} J/particle, N = ${N.toExponential(3)}, D = ${D.toExponential(3)} Gy, H = ${H.toExponential(3)} Sv`;
    }

    calcDoseSP() {
        const phi = parseFloat(document.getElementById('sp-phi')?.value || '0'); // 1/cm^2
        const S = parseFloat(document.getElementById('sp-S')?.value || '0'); // MeV*cm^2/g
        const wR = parseFloat(document.getElementById('sp-wr')?.value || '1');
        const outEl = document.getElementById('dose-sp-out');
        if (!outEl) return;
        if ([phi, S, wR].some(x => !isFinite(x) || x < 0)) {
            outEl.textContent = 'D = — Gy, H = — Sv';
            return;
        }
        // D(Gy) = phi * S * 1.602e-10
        const D = phi * S * 1.602e-10; // Gy
        const H = D * wR; // Sv
        outEl.textContent = `D = ${D.toExponential(3)} Gy, H = ${H.toExponential(3)} Sv`;
    }
}

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

// NASA APOD Integration
class NASAAPODFetcher {
    constructor() {
        this.apiKey = "2prCXkv5rkf8ad1tMGsQURxLOzaCx7aFpkI9Gw9Y";
        this.url = `https://api.nasa.gov/planetary/apod?api_key=${this.apiKey}`;
        this.init();
    }
    
    init() {
        // Make it globally accessible for retry functionality
        window.nasaAPOD = this;
        this.fetchAPOD();
    }
    
    async fetchAPOD() {
        const loadingEl = document.querySelector('.apod-loading');
        const contentEl = document.querySelector('.apod-content');
        const errorEl = document.querySelector('.apod-error');
        
        // Show loading state
        if (loadingEl) loadingEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        
        try {
            const response = await fetch(this.url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayAPOD(data);
            
        } catch (error) {
            console.error('Error fetching NASA APOD:', error);
            this.showError();
        }
    }
    
    displayAPOD(data) {
        const loadingEl = document.querySelector('.apod-loading');
        const contentEl = document.querySelector('.apod-content');
        const errorEl = document.querySelector('.apod-error');
        
        // Update content elements
        const imageEl = document.getElementById('apod-image');
        const titleEl = document.getElementById('apod-title');
        const dateEl = document.getElementById('apod-date');
        const explanationEl = document.getElementById('apod-explanation');
        
        if (imageEl && data.url) {
            imageEl.src = data.url;
            imageEl.alt = data.title || 'NASA Astronomy Picture of the Day';
        }
        
        if (titleEl && data.title) {
            titleEl.textContent = data.title;
        }
        
        if (dateEl && data.date) {
            const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateEl.textContent = formattedDate;
        }
        
        if (explanationEl && data.explanation) {
            explanationEl.textContent = data.explanation;
        }
        
        // Show content, hide loading and error
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'grid';
        if (errorEl) errorEl.style.display = 'none';
        
        // Add fade-in animation
        if (contentEl) {
            contentEl.style.opacity = '0';
            setTimeout(() => {
                contentEl.style.transition = 'opacity 0.5s ease';
                contentEl.style.opacity = '1';
            }, 100);
        }
    }
    
    showError() {
        const loadingEl = document.querySelector('.apod-loading');
        const contentEl = document.querySelector('.apod-content');
        const errorEl = document.querySelector('.apod-error');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
    }
}

// Satellite Lab System
class SatelliteLab {
    constructor() {
        this.experiments = {
            orbitCalculator: new OrbitCalculator(),
            signalSimulator: new SignalStrengthSimulator(),
            satelliteDesigner: new SatelliteDesigner(),
            digitalTwin: new DigitalTwinODIN()
        };
        this.init();
    }
    
    init() {
        // Always add styles so static lab pages get styled
        this.addLabStyles();
        this.createLabSection();
        this.setupLabNavigation();
        this.initializeExperiments();
    }
    
    createLabSection() {
        // Check if lab section already exists
        if (document.getElementById('satellite-lab')) return;
        
        const labSection = document.createElement('section');
        labSection.id = 'satellite-lab';
        labSection.className = 'satellite-lab';
        labSection.innerHTML = `
            <div class="container">
                <h2 class="section-title">🧪 Satellite Research Lab</h2>
                <p class="lab-description">Interactive experiments and simulations for satellite research</p>
                
                <div class="lab-navigation">
                    <button class="lab-tab active" data-experiment="orbit">🌍 Orbit Calculator</button>
                    <button class="lab-tab" data-experiment="signal">📡 Signal Simulator</button>
                    <button class="lab-tab" data-experiment="designer">🛰️ Satellite Designer</button>
                    <button class="lab-tab" data-experiment="odin">🧠 Digital Twin (ODIN)</button>
                </div>
                
                <div class="lab-content">
                    <!-- Orbit Calculator Experiment -->
                    <div class="lab-experiment active" id="orbit-experiment">
                        <h3>Orbital Mechanics Calculator</h3>
                        <div class="experiment-controls">
                            <div class="control-group">
                                <label>Altitude (km):</label>
                                <input type="range" id="altitude-slider" min="200" max="35786" value="400">
                                <span id="altitude-value">400</span>
                            </div>
                            <div class="control-group">
                                <label>Satellite Mass (kg):</label>
                                <input type="range" id="mass-slider" min="100" max="10000" value="1000">
                                <span id="mass-value">1000</span>
                            </div>
                            <button class="btn btn-primary" id="calculate-orbit">Calculate Orbit</button>
                        </div>
                        <div class="experiment-results">
                            <div class="result-card">
                                <h4>Orbital Velocity</h4>
                                <div class="result-value" id="orbital-velocity">7.67 km/s</div>
                            </div>
                            <div class="result-card">
                                <h4>Orbital Period</h4>
                                <div class="result-value" id="orbital-period">92.7 minutes</div>
                            </div>
                            <div class="result-card">
                                <h4>Gravitational Force</h4>
                                <div class="result-value" id="gravitational-force">8829 N</div>
                            </div>
                        </div>
                        <div class="orbit-visualization" id="orbit-viz"></div>
                    </div>
                    
                    <!-- Signal Strength Simulator -->
                    <div class="lab-experiment" id="signal-experiment">
                        <h3>Signal Strength Simulator</h3>
                        <div class="experiment-controls">
                            <div class="control-group">
                                <label>Distance to Satellite (km):</label>
                                <input type="range" id="distance-slider" min="400" max="36000" value="2000">
                                <span id="distance-value">2000</span>
                            </div>
                            <div class="control-group">
                                <label>Transmitter Power (W):</label>
                                <input type="range" id="power-slider" min="10" max="1000" value="100">
                                <span id="power-value">100</span>
                            </div>
                            <div class="control-group">
                                <label>Weather Conditions:</label>
                                <select id="weather-select">
                                    <option value="clear">Clear Sky</option>
                                    <option value="cloudy">Cloudy</option>
                                    <option value="rain">Rain</option>
                                    <option value="storm">Storm</option>
                                </select>
                            </div>
                        </div>
                        <div class="signal-visualization">
                            <div class="signal-meter">
                                <div class="signal-bar" id="signal-bar"></div>
                                <div class="signal-percentage" id="signal-percentage">85%</div>
                            </div>
                            <div class="signal-quality" id="signal-quality">Excellent</div>
                        </div>
                    </div>
                    
                    <!-- Satellite Designer -->
                    <div class="lab-experiment" id="designer-experiment">
                        <h3>Satellite Mission Designer</h3>
                        <div class="designer-interface">
                            <div class="satellite-builder">
                                <h4>Build Your Satellite</h4>
                                <div class="component-selector">
                                    <div class="component-category">
                                        <h5>Power System</h5>
                                        <label><input type="radio" name="power" value="solar"> Solar Panels</label>
                                        <label><input type="radio" name="power" value="nuclear"> Nuclear RTG</label>
                                        <label><input type="radio" name="power" value="battery"> Battery Pack</label>
                                    </div>
                                    <div class="component-category">
                                        <h5>Communication</h5>
                                        <label><input type="radio" name="comm" value="uhf"> UHF Radio</label>
                                        <label><input type="radio" name="comm" value="xband"> X-Band</label>
                                        <label><input type="radio" name="comm" value="laser"> Laser Comm</label>
                                    </div>
                                    <div class="component-category">
                                        <h5>Payload</h5>
                                        <label><input type="radio" name="payload" value="camera"> Imaging Camera</label>
                                        <label><input type="radio" name="payload" value="radar"> Radar System</label>
                                        <label><input type="radio" name="payload" value="spectrometer"> Spectrometer</label>
                                    </div>
                                </div>
                                <button class="btn btn-primary" id="design-satellite">Design Mission</button>
                            </div>
                            <div class="mission-summary" id="mission-summary">
                                <h4>Mission Analysis</h4>
                                <div class="summary-content">
                                    <p>Select components to analyze your satellite mission...</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Digital Twin (ODIN) Experiment -->
                    <div class="lab-experiment" id="odin-experiment">
                        <h3>ODIN Digital Twin Simulator</h3>
                        <p class="odin-intro">
                            A digital twin of the spacecraft and its surrounding space for AI-driven planning. The virtual copy runs locally and updates in real time with space weather and debris data. It serves as a practice ground where AI tests route plans and responses to hazards like solar storms or debris before commanding the real spacecraft.
                        </p>
                        <div class="odin-grid">
                            <div class="odin-panel">
                                <h4>Scenario & Data</h4>
                                <div class="control-group">
                                    <label>Hazard Scenario</label>
                                    <select id="odin-hazard">
                                        <option value="none">None</option>
                                        <option value="solar">Solar Storm</option>
                                        <option value="debris">Debris Field</option>
                                        <option value="radiation">High Radiation</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Objective</label>
                                    <select id="odin-objective">
                                        <option value="balanced">Balanced (Fuel/Time/Safety)</option>
                                        <option value="fuel">Minimize Fuel</option>
                                        <option value="time">Minimize Time</option>
                                        <option value="safety">Maximize Safety</option>
                                    </select>
                                </div>
                                <div class="control-group">
                                    <label>Live Data Mode</label>
                                    <label style="display:block"><input type="checkbox" id="odin-live"/> Simulate live space weather & debris API feed</label>
                                </div>
                                <button class="btn btn-primary" id="odin-run">Generate Alternate Routes</button>
                                <div class="odin-hints">
                                    <small>Data sources: historical NASA/ESA space weather (2012-2018), simulated live feeds. Optimization uses convex solvers and RL-inspired heuristics. Generative AI proposes candidate routes.</small>
                                </div>
                            </div>
                            <div class="odin-panel">
                                <h4>Visualization</h4>
                                <div class="odin-viz" id="odin-viz">
                                    <div class="odin-earth"></div>
                                    <canvas id="odin-canvas" width="420" height="240" aria-label="ODIN route visualization"></canvas>
                                </div>
                                <div class="legend">
                                    <span class="legend-item"><span class="swatch swatch-base"></span>Nominal Path</span>
                                    <span class="legend-item"><span class="swatch swatch-alt1"></span>Alt Route A</span>
                                    <span class="legend-item"><span class="swatch swatch-alt2"></span>Alt Route B</span>
                                    <span class="legend-item"><span class="swatch swatch-hazard"></span>Hazard Zone</span>
                                </div>
                            </div>
                        </div>
                        <div class="odin-panels">
                            <div class="odin-panel">
                                <h4>Data Collection</h4>
                                <ul class="odin-list">
                                    <li>Space weather, solar activity, radiation, debris positions via sensors and satellites (2012–2018 + simulated live)</li>
                                    <li>3D CAD model of spacecraft and environment; physics-based simulation</li>
                                    <li>Run what-if simulations for predicted storms or debris events</li>
                                </ul>
                            </div>
                            <div class="odin-panel">
                                <h4>Technology Stack</h4>
                                <ul class="odin-list">
                                    <li>APIs for space weather & debris tracking</li>
                                    <li>3D simulation & CAD toolchain</li>
                                    <li>Generative AI + reinforcement learning for dynamic re-planning</li>
                                    <li>Web dashboard and 3D maps for visualization</li>
                                    <li>Cloud/edge compute for real-time processing</li>
                                </ul>
                            </div>
                        </div>
                        <div class="odin-panel decision-log">
                            <h4>AI Decision Log (Human-Readable)</h4>
                            <div id="odin-log" class="log-entries">
                                <p>Select a scenario and click "Generate Alternate Routes" to see AI decisions.</p>
                            </div>
                        </div>
                        <div class="odin-panel implementation-notes">
                            <h4>Implementation Notes</h4>
                            <p>
                                Historical space weather data from NASA OMNIWeb and ESA archives provided solar wind, geomagnetic indices, and radiation metrics. A digital twin integrated 3D modeling with scientific computing (MATLAB/SciPy). Trajectory optimization combined convex optimization with RL (TensorFlow/PyTorch). Transformer-based generative models proposed candidate trajectories under hazards. A natural language decision logger explains trade-offs. Dashboards built with D3/Plotly visualize trajectories, hazards, and logs. Cloud deployment enables scalable simulation and fast re-planning.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert lab section before the contact section (if contact section exists)
        const contactSection = document.getElementById('contact');
        if (contactSection && contactSection.parentNode) {
            contactSection.parentNode.insertBefore(labSection, contactSection);
        } else {
            // If no contact section, append to body
            document.body.appendChild(labSection);
        }
        
        // Add lab styles
        this.addLabStyles();
    }
    
    setupLabNavigation() {
        const labTabs = document.querySelectorAll('.lab-tab');
        const experiments = document.querySelectorAll('.lab-experiment');
        
        labTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and experiments
                labTabs.forEach(t => t.classList.remove('active'));
                experiments.forEach(e => e.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding experiment
                const experimentId = tab.getAttribute('data-experiment') + '-experiment';
                const targetExperiment = document.getElementById(experimentId);
                if (targetExperiment) {
                    targetExperiment.classList.add('active');
                }
            });
        });
        
        // Ensure lab controls are properly connected
        this.connectLabControls();
    }
    
    connectLabControls() {
        // Connect orbit calculator controls
        const altitudeSlider = document.getElementById('altitude-slider');
        const altitudeValue = document.getElementById('altitude-value');
        const massSlider = document.getElementById('mass-slider');
        const massValue = document.getElementById('mass-value');
        const calculateButton = document.getElementById('calculate-orbit');
        
        if (altitudeSlider && altitudeValue) {
            altitudeSlider.addEventListener('input', () => {
                altitudeValue.textContent = altitudeSlider.value;
            });
        }
        
        if (massSlider && massValue) {
            massSlider.addEventListener('input', () => {
                massValue.textContent = massSlider.value;
            });
        }
        
        if (calculateButton) {
            calculateButton.addEventListener('click', () => {
                this.calculateOrbit();
            });
        }
        
        // Connect signal simulator controls
        const distanceSlider = document.getElementById('distance-slider');
        const distanceValue = document.getElementById('distance-value');
        const powerSlider = document.getElementById('power-slider');
        const powerValue = document.getElementById('power-value');
        const weatherSelect = document.getElementById('weather-select');
        
        if (distanceSlider && distanceValue) {
            distanceSlider.addEventListener('input', () => {
                distanceValue.textContent = distanceSlider.value;
                this.updateSignalStrength();
            });
        }
        
        if (powerSlider && powerValue) {
            powerSlider.addEventListener('input', () => {
                powerValue.textContent = powerSlider.value;
                this.updateSignalStrength();
            });
        }
        
        if (weatherSelect) {
            weatherSelect.addEventListener('change', () => {
                this.updateSignalStrength();
            });
        }
        
        // Connect satellite designer
        const designButton = document.getElementById('design-satellite');
        if (designButton) {
            designButton.addEventListener('click', () => {
                this.designSatellite();
            });
        }
        
        // Initialize signal strength
        this.updateSignalStrength();
    }
    
    calculateOrbit() {
        const altitude = parseFloat(document.getElementById('altitude-slider')?.value || 400);
        const mass = parseFloat(document.getElementById('mass-slider')?.value || 1000);
        
        // Earth parameters
        const earthRadius = 6371; // km
        const earthMass = 5.972e24; // kg
        const G = 6.674e-11; // m³/kg/s²
        
        // Calculate orbital parameters
        const orbitalRadius = (earthRadius + altitude) * 1000; // Convert to meters
        const orbitalVelocity = Math.sqrt(G * earthMass / orbitalRadius); // m/s
        const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / (G * earthMass)); // seconds
        const gravitationalForce = G * earthMass * mass / Math.pow(orbitalRadius, 2); // N
        
        // Update display
        const velocityEl = document.getElementById('orbital-velocity');
        const periodEl = document.getElementById('orbital-period');
        const forceEl = document.getElementById('gravitational-force');
        
        if (velocityEl) velocityEl.textContent = `${(orbitalVelocity / 1000).toFixed(2)} km/s`;
        if (periodEl) periodEl.textContent = `${(orbitalPeriod / 60).toFixed(1)} minutes`;
        if (forceEl) forceEl.textContent = `${gravitationalForce.toFixed(0)} N`;
    }
    
    updateSignalStrength() {
        const distance = parseFloat(document.getElementById('distance-slider')?.value || 2000);
        const power = parseFloat(document.getElementById('power-slider')?.value || 100);
        const weather = document.getElementById('weather-select')?.value || 'clear';
        
        // Calculate signal strength (simplified model)
        const baseStrength = Math.sqrt(power) / Math.sqrt(distance / 1000);
        
        // Weather attenuation factors
        const weatherFactors = {
            clear: 1.0,
            cloudy: 0.8,
            rain: 0.6,
            storm: 0.3
        };
        
        const signalStrength = Math.min(100, baseStrength * weatherFactors[weather] * 10);
        
        // Update display
        const signalBar = document.getElementById('signal-bar');
        const signalPercentage = document.getElementById('signal-percentage');
        const signalQuality = document.getElementById('signal-quality');
        
        if (signalBar) {
            signalBar.style.width = `${signalStrength}%`;
            signalBar.style.backgroundColor = signalStrength > 70 ? '#4ecdc4' : 
                                             signalStrength > 40 ? '#feca57' : '#ff6b6b';
        }
        
        if (signalPercentage) signalPercentage.textContent = `${Math.round(signalStrength)}%`;
        
        if (signalQuality) {
            const quality = signalStrength > 70 ? 'Excellent' :
                           signalStrength > 40 ? 'Good' :
                           signalStrength > 20 ? 'Poor' : 'Very Poor';
            signalQuality.textContent = quality;
        }
    }
    
    designSatellite() {
        const power = document.querySelector('input[name="power"]:checked')?.value;
        const comm = document.querySelector('input[name="comm"]:checked')?.value;
        const payload = document.querySelector('input[name="payload"]:checked')?.value;
        
        if (!power || !comm || !payload) {
            alert('Please select all components before designing the mission!');
            return;
        }
        
        // Mission configuration based on selections
        const configs = {
            power: {
                solar: { cost: 10, reliability: 85, power: 200 },
                nuclear: { cost: 50, reliability: 95, power: 500 },
                battery: { cost: 5, reliability: 70, power: 100 }
            },
            comm: {
                uhf: { cost: 5, dataRate: '1 Mbps', range: 'LEO' },
                xband: { cost: 15, dataRate: '10 Mbps', range: 'Deep Space' },
                laser: { cost: 25, dataRate: '100 Mbps', range: 'Interplanetary' }
            },
            payload: {
                camera: { cost: 20, resolution: '1m', capability: 'Imaging' },
                radar: { cost: 30, resolution: '10m', capability: 'All-weather' },
                spectrometer: { cost: 25, resolution: 'Spectral', capability: 'Composition' }
            }
        };
        
        const powerConfig = configs.power[power];
        const commConfig = configs.comm[comm];
        const payloadConfig = configs.payload[payload];
        
        const totalCost = powerConfig.cost + commConfig.cost + payloadConfig.cost;
        
        const summaryEl = document.querySelector('#mission-summary .summary-content');
        if (summaryEl) {
            summaryEl.innerHTML = `
                <div class="mission-details">
                    <h5>🚀 Mission Configuration</h5>
                    <p><strong>Total Cost:</strong> $${totalCost}M</p>
                    <p><strong>Power:</strong> ${powerConfig.power}W (${powerConfig.reliability}% reliable)</p>
                    <p><strong>Communication:</strong> ${commConfig.dataRate} (${commConfig.range})</p>
                    <p><strong>Payload:</strong> ${payloadConfig.capability} (${payloadConfig.resolution})</p>
                    <div class="mission-recommendation">
                        <h6>Recommended Mission:</h6>
                        <p>${this.generateMissionRecommendation(power, comm, payload)}</p>
                    </div>
                </div>
            `;
        }
    }
    
    generateMissionRecommendation(power, comm, payload) {
        const missions = {
            'solar-uhf-camera': 'Earth observation satellite for environmental monitoring',
            'nuclear-xband-radar': 'Deep space exploration probe with all-weather imaging',
            'battery-laser-spectrometer': 'High-precision asteroid composition analysis mission'
        };
        
        const key = `${power}-${comm}-${payload}`;
        return missions[key] || `Custom ${payload} mission with ${power} power and ${comm} communication`;
    }
    
    initializeExperiments() {
        // Initialize each experiment
        Object.values(this.experiments).forEach(experiment => {
            if (experiment.init) experiment.init();
        });
    }
    
    addLabStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* ODIN Formula Panel Enhanced Styling */
            .odin-formula-panel {
                background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.9));
                border: 2px solid #00d4ff;
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
                margin: 2rem 0;
            }
            
            .odin-main-title {
                font-size: 1.8rem;
                color: #00d4ff;
                text-align: center;
                margin-bottom: 0.5rem;
                text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
            }
            
            .odin-subtitle {
                text-align: center;
                color: #9ad2ff;
                font-style: italic;
                margin-bottom: 2rem;
                font-size: 1.1rem;
            }
            
            .formula-heading {
                color: #4ecdc4;
                font-size: 1.3rem;
                margin: 1.5rem 0 1rem 0;
                padding: 0.5rem;
                background: rgba(78, 205, 196, 0.1);
                border-left: 4px solid #4ecdc4;
                border-radius: 5px;
            }
            
            .formula-box {
                background: rgba(0, 212, 255, 0.05);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 10px;
                padding: 1rem;
                margin: 1rem 0;
            }
            
            .formula-title {
                font-weight: bold;
                color: #feca57;
                font-size: 1.1rem;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .formula {
                background: rgba(254, 202, 87, 0.1);
                color: #feca57;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                border: 1px solid rgba(254, 202, 87, 0.3);
            }
            
            .formula-description {
                color: #9ad2ff;
                font-style: italic;
                margin: 0.5rem 0;
                line-height: 1.6;
            }
            
            .formula-note {
                color: #4ecdc4;
                font-style: italic;
                margin: 0.5rem 0;
                padding: 0.5rem;
                background: rgba(78, 205, 196, 0.1);
                border-radius: 5px;
            }
            
            .toolkit-section {
                margin: 2rem 0;
                padding: 1rem;
                border-radius: 15px;
                transition: all 0.3s ease;
            }
            
            .orbital-elements {
                background: linear-gradient(135deg, rgba(72, 219, 251, 0.1), rgba(72, 219, 251, 0.05));
                border-left: 5px solid #48dbfb;
            }
            
            .hazard-section {
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05));
                border-left: 5px solid #ff6b6b;
            }
            
            .trajectory-section {
                background: linear-gradient(135deg, rgba(95, 39, 205, 0.1), rgba(95, 39, 205, 0.05));
                border-left: 5px solid #5f27cd;
            }
            
            .transfer-section {
                background: linear-gradient(135deg, rgba(254, 202, 87, 0.1), rgba(254, 202, 87, 0.05));
                border-left: 5px solid #feca57;
            }
            
            .energy-section {
                background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(78, 205, 196, 0.05));
                border-left: 5px solid #4ecdc4;
            }
            
            .timing-section {
                background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05));
                border-left: 5px solid #00d4ff;
            }
            
            .geometry-section {
                background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 107, 107, 0.05));
                border-left: 5px solid #ff6b6b;
            }
            
            .radiation-section {
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05));
                border-left: 5px solid #ffc107;
            }
            
            .toolkit-section:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.2);
            }
            
            .mini-calc {
                background: rgba(0, 20, 40, 0.8);
                border: 1px solid #00d4ff;
                border-radius: 10px;
                padding: 1rem;
                margin: 1rem 0;
            }
            
            .calc-row {
                display: flex;
                gap: 0.5rem;
                margin: 0.5rem 0;
                flex-wrap: wrap;
            }
            
            .calc-row input {
                flex: 1;
                min-width: 120px;
                padding: 0.5rem;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid #00d4ff;
                border-radius: 5px;
                color: white;
                font-family: 'Orbitron', monospace;
            }
            
            .calc-row input::placeholder {
                color: #9ad2ff;
            }
            
            .calc-out {
                background: rgba(78, 205, 196, 0.1);
                border: 1px solid #4ecdc4;
                border-radius: 5px;
                padding: 0.5rem;
                margin: 0.5rem 0;
                color: #4ecdc4;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            }
            
            .odin-list li {
                margin: 0.5rem 0;
                padding: 0.3rem 0;
                border-bottom: 1px solid rgba(0, 212, 255, 0.1);
            }
            
            .odin-list li:last-child {
                border-bottom: none;
            }
            
            .satellite-lab {
                padding: 5rem 0;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                position: relative;
            }
            
            .lab-description {
                text-align: center;
                color: #b0b0b0;
                margin-bottom: 2rem;
                font-size: 1.1rem;
            }
            
            .lab-navigation {
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-bottom: 3rem;
                flex-wrap: wrap;
            }
            
            .lab-tab {
                padding: 0.8rem 1.5rem;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid #00d4ff;
                border-radius: 25px;
                color: #00d4ff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Orbitron', monospace;
            }
            
            .lab-tab:hover {
                background: rgba(0, 212, 255, 0.2);
                transform: translateY(-2px);
            }
            
            .lab-tab.active {
                background: linear-gradient(45deg, #00d4ff, #4ecdc4);
                color: #000;
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
            }
            
            .lab-experiment {
                display: none;
                background: rgba(0, 20, 40, 0.8);
                border-radius: 15px;
                padding: 2rem;
                border: 1px solid #00d4ff;
            }
            
            .lab-experiment.active {
                display: block;
                animation: fadeInLab 0.5s ease;
            }
            
            .experiment-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .control-group {
                background: rgba(0, 212, 255, 0.05);
                padding: 1rem;
                border-radius: 10px;
                border: 1px solid rgba(0, 212, 255, 0.2);
            }
            
            .control-group label {
                display: block;
                color: #00d4ff;
                margin-bottom: 0.5rem;
                font-weight: 600;
            }
            
            .control-group input[type="range"] {
                width: 100%;
                margin: 0.5rem 0;
            }
            
            .control-group span {
                color: #4ecdc4;
                font-weight: bold;
            }
            
            .experiment-results {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            
            .result-card {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                padding: 1.5rem;
                border-radius: 10px;
                text-align: center;
                border: 1px solid #4ecdc4;
            }
            
            .result-card h4 {
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .result-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #4ecdc4;
                font-family: 'Orbitron', monospace;
            }
            
            .orbit-visualization {
                height: 300px;
                background: radial-gradient(circle at center, #001122, #000);
                border-radius: 10px;
                position: relative;
                overflow: hidden;
                border: 1px solid #00d4ff;
            }
            
            .signal-visualization {
                text-align: center;
                padding: 2rem;
            }
            
            .signal-meter {
                width: 200px;
                height: 20px;
                background: #333;
                border-radius: 10px;
                margin: 0 auto 1rem;
                position: relative;
                overflow: hidden;
            }
            
            .signal-bar {
                height: 100%;
                background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #0abde3);
                border-radius: 10px;
                transition: width 0.3s ease;
            }
            
            .signal-percentage {
                font-size: 2rem;
                font-weight: bold;
                color: #4ecdc4;
                margin-bottom: 0.5rem;
            }
            
            .signal-quality {
                font-size: 1.2rem;
                color: #00d4ff;
            }
            
            .designer-interface {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
            }
            
            .component-selector {
                display: grid;
                gap: 1rem;
            }
            
            .component-category {
                background: rgba(0, 212, 255, 0.05);
                padding: 1rem;
                border-radius: 10px;
                border: 1px solid rgba(0, 212, 255, 0.2);
            }
            
            .component-category h5 {
                color: #00d4ff;
                margin-bottom: 0.5rem;
            }
            
            .component-category label {
                display: block;
                color: #b0b0b0;
                margin: 0.3rem 0;
                cursor: pointer;
            }
            
            .mission-summary {
                background: rgba(0, 20, 40, 0.8);
                padding: 1.5rem;
                border-radius: 10px;
                border: 1px solid #4ecdc4;
            }
            
            /* ODIN styles */
            .odin-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .odin-panels {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .odin-panel {
                background: rgba(0, 212, 255, 0.05);
                border: 1px solid rgba(0, 212, 255, 0.2);
                border-radius: 10px;
                padding: 1rem;
            }
            .odin-viz {
                position: relative;
                background: radial-gradient(circle at center, #001122, #000);
                border: 1px solid #00d4ff;
                border-radius: 10px;
                height: 260px;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .odin-earth {
                position: absolute;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: radial-gradient(circle, #4ecdc4, #00d4ff);
                box-shadow: 0 0 20px #4ecdc4;
                left: 10px;
                bottom: 10px;
                opacity: 0.8;
            }
            .legend { display: flex; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap; }
            .legend-item { color: #b0b0b0; font-size: 0.9rem; }
            .swatch { display: inline-block; width: 14px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: middle; }
            .swatch-base { background: #48dbfb; }
            .swatch-alt1 { background: #feca57; }
            .swatch-alt2 { background: #5f27cd; }
            .swatch-hazard { background: #ff6b6b; }
            .decision-log { border-color: #00d4ff; }
            .decision-log .log-entries { max-height: 220px; overflow: auto; }
            .decision-log p, .decision-log li, .odin-list li { color: #b0b0b0; }
            .odin-list { margin: 0; padding-left: 1.2rem; }
            .odin-intro { color: #b0b0b0; margin-bottom: 1rem; }
            .implementation-notes p { color: #9ad2ff; font-size: 0.95rem; line-height: 1.6; }

            @keyframes fadeInLab {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @media (max-width: 768px) {
                .designer-interface {
                    grid-template-columns: 1fr;
                }
                
                .experiment-controls {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Orbit Calculator Class
class OrbitCalculator {
    constructor() {
        this.earthRadius = 6371; // km
        this.earthMass = 5.972e24; // kg
        this.G = 6.674e-11; // m³/kg/s²
    }
    
    init() {
        const altitudeSlider = document.getElementById('altitude-slider');
        const massSlider = document.getElementById('mass-slider');
        const calculateBtn = document.getElementById('calculate-orbit');
        
        if (altitudeSlider) {
            altitudeSlider.addEventListener('input', () => {
                document.getElementById('altitude-value').textContent = altitudeSlider.value;
                this.calculateOrbit();
            });
        }
        
        if (massSlider) {
            massSlider.addEventListener('input', () => {
                document.getElementById('mass-value').textContent = massSlider.value;
                this.calculateOrbit();
            });
        }
        
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateOrbit());
        }
        
        // Initial calculation
        setTimeout(() => this.calculateOrbit(), 100);
    }
    
    calculateOrbit() {
        const altitude = parseFloat(document.getElementById('altitude-slider')?.value || 400);
        const mass = parseFloat(document.getElementById('mass-slider')?.value || 1000);
        
        const orbitalRadius = (this.earthRadius + altitude) * 1000; // Convert to meters
        
        // Calculate orbital velocity: v = sqrt(GM/r)
        const velocity = Math.sqrt((this.G * this.earthMass) / orbitalRadius) / 1000; // km/s
        
        // Calculate orbital period: T = 2π * sqrt(r³/GM)
        const period = 2 * Math.PI * Math.sqrt(Math.pow(orbitalRadius, 3) / (this.G * this.earthMass)) / 60; // minutes
        
        // Calculate gravitational force: F = GMm/r²
        const force = (this.G * this.earthMass * mass) / Math.pow(orbitalRadius, 2);
        
        // Update display
        const velocityEl = document.getElementById('orbital-velocity');
        const periodEl = document.getElementById('orbital-period');
        const forceEl = document.getElementById('gravitational-force');
        
        if (velocityEl) velocityEl.textContent = velocity.toFixed(2) + ' km/s';
        if (periodEl) periodEl.textContent = period.toFixed(1) + ' minutes';
        if (forceEl) forceEl.textContent = force.toFixed(0) + ' N';
        
        this.updateOrbitVisualization(altitude);
    }
    
    updateOrbitVisualization(altitude) {
        const viz = document.getElementById('orbit-viz');
        if (!viz) return;
        
        viz.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 60px;
                height: 60px;
                background: radial-gradient(circle, #4ecdc4, #00d4ff);
                border-radius: 50%;
                box-shadow: 0 0 20px #4ecdc4;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${120 + altitude/100}px;
                height: ${120 + altitude/100}px;
                border: 2px dashed #00d4ff;
                border-radius: 50%;
                animation: rotate 10s linear infinite;
            ">
                <div style="
                    position: absolute;
                    top: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 10px;
                    height: 10px;
                    background: #ff6b6b;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #ff6b6b;
                "></div>
            </div>
        `;
        
        // Add rotation animation if not exists
        if (!document.querySelector('#rotate-animation')) {
            const rotateStyle = document.createElement('style');
            rotateStyle.id = 'rotate-animation';
            rotateStyle.textContent = `
                @keyframes rotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
            `;
            document.head.appendChild(rotateStyle);
        }
    }
}

// Signal Strength Simulator Class
class SignalStrengthSimulator {
    init() {
        const distanceSlider = document.getElementById('distance-slider');
        const powerSlider = document.getElementById('power-slider');
        const weatherSelect = document.getElementById('weather-select');
        
        [distanceSlider, powerSlider, weatherSelect].forEach(element => {
            if (element) {
                element.addEventListener('input', () => this.calculateSignal());
                element.addEventListener('change', () => this.calculateSignal());
            }
        });
        
        if (distanceSlider) {
            distanceSlider.addEventListener('input', () => {
                document.getElementById('distance-value').textContent = distanceSlider.value;
            });
        }
        
        if (powerSlider) {
            powerSlider.addEventListener('input', () => {
                document.getElementById('power-value').textContent = powerSlider.value;
            });
        }
        
        setTimeout(() => this.calculateSignal(), 100);
    }
    
    calculateSignal() {
        const distance = parseFloat(document.getElementById('distance-slider')?.value || 2000);
        const power = parseFloat(document.getElementById('power-slider')?.value || 100);
        const weather = document.getElementById('weather-select')?.value || 'clear';
        
        // Signal strength calculation (simplified)
        let baseSignal = (power / Math.pow(distance / 1000, 2)) * 100;
        
        // Weather attenuation
        const weatherFactors = {
            clear: 1.0,
            cloudy: 0.9,
            rain: 0.7,
            storm: 0.4
        };
        
        const signalStrength = Math.min(100, baseSignal * weatherFactors[weather]);
        
        // Update visualization
        const signalBar = document.getElementById('signal-bar');
        const signalPercentage = document.getElementById('signal-percentage');
        const signalQuality = document.getElementById('signal-quality');
        
        if (signalBar) {
            signalBar.style.width = signalStrength + '%';
        }
        
        if (signalPercentage) {
            signalPercentage.textContent = Math.round(signalStrength) + '%';
        }
        
        if (signalQuality) {
            let quality = 'Poor';
            if (signalStrength > 80) quality = 'Excellent';
            else if (signalStrength > 60) quality = 'Good';
            else if (signalStrength > 40) quality = 'Fair';
            
            signalQuality.textContent = quality;
            signalQuality.style.color = signalStrength > 60 ? '#4ecdc4' : signalStrength > 40 ? '#feca57' : '#ff6b6b';
        }
    }
}

// Satellite Designer Class
class SatelliteDesigner {
    init() {
        const designBtn = document.getElementById('design-satellite');
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        
        radioInputs.forEach(input => {
            input.addEventListener('change', () => this.updateMissionAnalysis());
        });
        
        if (designBtn) {
            designBtn.addEventListener('click', () => this.generateMission());
        }
    }
    
    updateMissionAnalysis() {
        const power = document.querySelector('input[name="power"]:checked')?.value;
        const comm = document.querySelector('input[name="comm"]:checked')?.value;
        const payload = document.querySelector('input[name="payload"]:checked')?.value;
        
        const summaryContent = document.querySelector('.summary-content');
        if (!summaryContent) return;
        
        if (power && comm && payload) {
            const analysis = this.analyzeMission(power, comm, payload);
            summaryContent.innerHTML = `
                <div class="mission-stats">
                    <div class="stat-item">
                        <span class="stat-label">Mission Type:</span>
                        <span class="stat-value">${analysis.missionType}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Power Consumption:</span>
                        <span class="stat-value">${analysis.powerConsumption}W</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Data Rate:</span>
                        <span class="stat-value">${analysis.dataRate}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mission Duration:</span>
                        <span class="stat-value">${analysis.duration}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Estimated Cost:</span>
                        <span class="stat-value">$${analysis.cost}M</span>
                    </div>
                </div>
            `;
        }
    }
    
    analyzeMission(power, comm, payload) {
        const configs = {
            power: {
                solar: { consumption: 200, cost: 5, duration: '5-7 years' },
                nuclear: { consumption: 50, cost: 20, duration: '10-15 years' },
                battery: { consumption: 100, cost: 2, duration: '6 months' }
            },
            comm: {
                uhf: { dataRate: '9.6 kbps', cost: 3 },
                xband: { dataRate: '150 Mbps', cost: 8 },
                laser: { dataRate: '1.2 Gbps', cost: 15 }
            },
            payload: {
                camera: { type: 'Earth Observation', cost: 10 },
                radar: { type: 'Weather Monitoring', cost: 25 },
                spectrometer: { type: 'Scientific Research', cost: 18 }
            }
        };
        
        const powerConfig = configs.power[power];
        const commConfig = configs.comm[comm];
        const payloadConfig = configs.payload[payload];
        
        return {
            missionType: payloadConfig.type,
            powerConsumption: powerConfig.consumption,
            dataRate: commConfig.dataRate,
            duration: powerConfig.duration,
            cost: (powerConfig.cost + commConfig.cost + payloadConfig.cost).toFixed(1)
        };
    }
    
    generateMission() {
        const power = document.querySelector('input[name="power"]:checked')?.value;
        const comm = document.querySelector('input[name="comm"]:checked')?.value;
        const payload = document.querySelector('input[name="payload"]:checked')?.value;
        
        if (!power || !comm || !payload) {
            alert('Please select all components before designing the mission!');
            return;
        }
        
        const missionNames = [
            'SkyWatch', 'OrbitGuard', 'CosmicEye', 'StarLink', 'SpaceBeacon',
            'AstroSentinel', 'GalaxyProbe', 'NebulaScout', 'VoidWatcher', 'StellarVision'
        ];
        
        const missionName = missionNames[Math.floor(Math.random() * missionNames.length)];
        
        setTimeout(() => {
            alert(`🚀 Mission "${missionName}" successfully designed!\n\nYour satellite configuration has been optimized for maximum efficiency. Mission parameters saved to the research database.`);
        }, 500);
    }
}

// Solar System API Integration
class SolarSystemAPI {
    constructor() {
        this.apiEndpoint = '/api/solar-system/bodies';
        this.celestialBodies = [];
        this.init();
    }
    
    init() {
        this.fetchBodies();
        // UI setup is handled in updateSatelliteSection and updateResearchSection
    }
    
    async fetchBodies() {
        try {
            const response = await fetch('/api/solar-system/bodies');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.celestialBodies = data.bodies || [];
            console.log("Celestial Bodies loaded:", this.celestialBodies.length);
            
            // Update UI with real data
            this.updateSatelliteSection();
            this.updateResearchSection();
            
        } catch (error) {
            console.log("Loading fallback solar system data");
            this.loadFallbackData();
        }
    }
    
    updateSatelliteSection() {
        // Only add celestial body data to satellite tracking if the satellite tracker exists
        const satelliteTracker = document.querySelector('.satellite-tracker');
        if (satelliteTracker && this.celestialBodies.length > 0) {
            this.addCelestialBodiesInfo();
        }
    }
    
    updateResearchSection() {
        // Only add real solar system data to research timeline if it exists
        const researchSection = document.querySelector('.research');
        if (researchSection && this.celestialBodies.length > 0) {
            this.addRealResearchData();
        }
    }
    
    addCelestialBodiesInfo() {
        const infoContainer = document.querySelector('.satellite-info');
        if (!infoContainer) return;
        
        // Add a new section for celestial bodies
        const celestialSection = document.createElement('div');
        celestialSection.className = 'celestial-bodies-section';
        celestialSection.innerHTML = `
            <h4>Real Solar System Data</h4>
            <div class="celestial-grid">
                ${this.celestialBodies.slice(0, 6).map(body => `
                    <div class="celestial-card">
                        <h5>${body.englishName}</h5>
                        <p>Type: ${body.bodyType || 'Unknown'}</p>
                        ${body.meanRadius ? `<p>Radius: ${body.meanRadius.toLocaleString()} km</p>` : ''}
                        ${body.mass ? `<p>Mass: ${body.mass.massValue}×10^${body.mass.massExponent} kg</p>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        infoContainer.appendChild(celestialSection);
    }
    
    addRealResearchData() {
        const timelineContainer = document.querySelector('.research-timeline');
        if (!timelineContainer) return;
        
        // Add real solar system research based on actual data
        const newResearchItem = document.createElement('div');
        newResearchItem.className = 'timeline-item';
        newResearchItem.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <h3>Real-Time Solar System Analysis</h3>
                <p>Live integration with Solar System API providing data on ${this.celestialBodies.length} celestial bodies including planets, moons, and asteroids.</p>
                <span class="timeline-date">2025</span>
            </div>
        `;
        
        timelineContainer.appendChild(newResearchItem);
    }
    
    loadFallbackData() {
        // Fallback data when API is unavailable
        this.celestialBodies = [
            { englishName: "Earth", bodyType: "Planet", meanRadius: 6371 },
            { englishName: "Moon", bodyType: "Moon", meanRadius: 1737 },
            { englishName: "Mars", bodyType: "Planet", meanRadius: 3390 }
        ];
        this.updateSatelliteSection();
    }
    
    getCelestialBodies() {
        return this.celestialBodies;
    }
}

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SatelliteTracker();
    new HackathonForm();
    new ParallaxEffect();
    new SatelliteDataSimulator();
    new AnimationController();
    new NASAAPODFetcher();
    new SatelliteLab(); // Add the new lab system
    new SolarSystemAPI(); // Add Solar System API integration
    
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
