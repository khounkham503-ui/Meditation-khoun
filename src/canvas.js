// AuraZen Canvas Background Effects

class CanvasBackground {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.theme = 'midnight';
    this.animationId = null;
    this.particles = [];
    this.width = 0;
    this.height = 0;

    this.resizeHandler = this.handleResize.bind(this);
  }

  // Initialize Canvas
  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    
    // Set size
    this.handleResize();
    window.addEventListener('resize', this.resizeHandler);

    // Initial theme set
    this.setTheme(this.theme);

    // Start loop
    this.loop();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Re-initialize particles on resize to fit bounds
    this.initParticles();
  }

  setTheme(theme) {
    this.theme = theme;
    this.initParticles();
  }

  // Initialize particle sets based on current theme
  initParticles() {
    this.particles = [];
    if (!this.width || !this.height) return;

    if (this.theme === 'midnight') {
      // Starfield particles: small, twinkling, drifting slowly
      const starCount = Math.floor((this.width * this.height) / 8000);
      for (let i = 0; i < Math.min(starCount, 150); i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.5 + 0.5,
          color: `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.1})`,
          speedX: (Math.random() - 0.5) * 0.05,
          speedY: (Math.random() - 0.5) * 0.05,
          twinkleSpeed: 0.005 + Math.random() * 0.015,
          alpha: Math.random(),
          direction: Math.random() > 0.5 ? 1 : -1
        });
      }
    } else if (this.theme === 'forest') {
      // Forest mist: large, fluffy, slow-moving blobs with very low opacity
      const mistCount = Math.floor((this.width * this.height) / 40000);
      for (let i = 0; i < Math.min(mistCount, 25); i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 100 + 100, // Large blobs
          color: `rgba(16, 185, 129, ${Math.random() * 0.03 + 0.01})`, // Very soft emerald
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.1,
          alpha: Math.random() * 0.3 + 0.1,
          pulseSpeed: 0.001 + Math.random() * 0.002,
          pulseDir: Math.random() > 0.5 ? 1 : -1
        });
      }
    } else if (this.theme === 'sunset') {
      // Warm sunset flares: a few organic slow-drifting golden/amber embers
      const glowCount = Math.floor((this.width * this.height) / 20000);
      for (let i = 0; i < Math.min(glowCount, 30); i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 15 + 10,
          color: Math.random() > 0.5 ? '244, 63, 94' : '217, 119, 6', // Rose vs Amber
          speedX: (Math.random() - 0.5) * 0.1,
          speedY: -0.05 - Math.random() * 0.15, // Rise upwards like fire embers
          alpha: Math.random() * 0.4 + 0.2,
          flickerSpeed: 0.01 + Math.random() * 0.02,
          wiggleSpeed: 0.02 + Math.random() * 0.04,
          wiggleAngle: Math.random() * Math.PI * 2
        });
      }
    }
  }

  // Draw background gradients
  drawBackground() {
    let grad;
    if (this.theme === 'midnight') {
      grad = this.ctx.createRadialGradient(
        this.width / 2, this.height / 2, 10,
        this.width / 2, this.height / 2, Math.max(this.width, this.height)
      );
      grad.addColorStop(0, '#0a0d24');
      grad.addColorStop(0.5, '#05060f');
      grad.addColorStop(1, '#020205');
    } else if (this.theme === 'forest') {
      grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, '#040b08');
      grad.addColorStop(1, '#0b1e17');
    } else if (this.theme === 'sunset') {
      grad = this.ctx.createRadialGradient(
        this.width / 2, this.height * 0.8, 50,
        this.width / 2, this.height * 0.8, Math.max(this.width, this.height)
      );
      grad.addColorStop(0, '#2e131d');
      grad.addColorStop(0.4, '#150912');
      grad.addColorStop(1, '#080307');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Render & Update loop
  loop() {
    this.drawBackground();
    this.updateAndDrawParticles();

    this.animationId = requestAnimationFrame(this.loop.bind(this));
  }

  updateAndDrawParticles() {
    const time = Date.now();

    this.particles.forEach((p) => {
      if (this.theme === 'midnight') {
        // Twinkle
        p.alpha += p.twinkleSpeed * p.direction;
        if (p.alpha <= 0.1) {
          p.alpha = 0.1;
          p.direction = 1;
        } else if (p.alpha >= 0.8) {
          p.alpha = 0.8;
          p.direction = -1;
        }

        // Drifting stars
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

        // Draw star
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } 
      
      else if (this.theme === 'forest') {
        // Pulse blob size
        p.alpha += p.pulseSpeed * p.pulseDir;
        if (p.alpha <= 0.05) {
          p.alpha = 0.05;
          p.pulseDir = 1;
        } else if (p.alpha >= 0.25) {
          p.alpha = 0.25;
          p.pulseDir = -1;
        }

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < -p.radius) p.x = this.width + p.radius;
        if (p.x > this.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = this.height + p.radius;
        if (p.y > this.height + p.radius) p.y = -p.radius;

        // Draw soft misty blob
        const mistGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        mistGrad.addColorStop(0, p.color);
        mistGrad.addColorStop(0.5, p.color.replace(/[\d.]+\)$/, `${p.alpha * 0.5})`));
        mistGrad.addColorStop(1, 'rgba(0,0,0,0)');

        this.ctx.fillStyle = mistGrad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } 
      
      else if (this.theme === 'sunset') {
        // Rise and wobble slightly
        p.y += p.speedY;
        
        // Horizontal wiggling using angle
        p.wiggleAngle += p.wiggleSpeed;
        const wiggle = Math.sin(p.wiggleAngle) * 0.4;
        p.x += wiggle;

        // Twinkle/Flicker alpha
        p.alpha += (Math.random() - 0.5) * 0.04;
        p.alpha = Math.max(0.1, Math.min(p.alpha, 0.6));

        // Recycle ember when it goes off top of screen
        if (p.y < -p.radius) {
          p.y = this.height + p.radius;
          p.x = Math.random() * this.width;
        }

        // Draw warm amber glow
        const glowGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        glowGrad.addColorStop(0, `rgba(${p.color}, ${p.alpha})`);
        glowGrad.addColorStop(0.5, `rgba(${p.color}, ${p.alpha * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Special ambient glow for sunset (pulsing sun visualizer at bottom)
    if (this.theme === 'sunset') {
      const pulse = 1.0 + Math.sin(time * 0.0006) * 0.04;
      const sunGrad = this.ctx.createRadialGradient(
        this.width / 2, this.height * 0.9, 0,
        this.width / 2, this.height * 0.9, 180 * pulse
      );
      sunGrad.addColorStop(0, 'rgba(217, 119, 6, 0.25)'); // deep gold
      sunGrad.addColorStop(0.4, 'rgba(244, 63, 94, 0.08)');
      sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      this.ctx.fillStyle = sunGrad;
      this.ctx.beginPath();
      this.ctx.arc(this.width / 2, this.height * 0.9, 180 * pulse, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Cleanup
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resizeHandler);
  }
}

export const canvasBackground = new CanvasBackground();
