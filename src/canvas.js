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
    } else if (this.theme === 'candle') {
      // Small, tiny embers rising from candle wick
      for (let i = 0; i < 15; i++) {
        this.particles.push({
          x: this.width / 2 + (Math.random() - 0.5) * 20,
          y: this.height * 0.85 - 80 - Math.random() * 180,
          radius: Math.random() * 1.5 + 0.4,
          color: '245, 158, 11', // Warm gold
          speedX: (Math.random() - 0.5) * 0.18,
          speedY: -0.15 - Math.random() * 0.2,
          alpha: Math.random() * 0.6 + 0.2,
          decay: 0.001 + Math.random() * 0.002
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
    } else if (this.theme === 'candle') {
      grad = this.ctx.createRadialGradient(
        this.width / 2, this.height * 0.85, 10,
        this.width / 2, this.height * 0.85, Math.max(this.width, this.height)
      );
      grad.addColorStop(0, '#1d0f08'); // Warm orange-brown glow
      grad.addColorStop(0.5, '#080402'); // Deep amber-black shadow
      grad.addColorStop(1, '#000000'); // Pure darkness at edges
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
      } else if (this.theme === 'candle') {
        // Sparks logic
        p.y += p.speedY;
        p.x += p.speedX;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < this.height * 0.4) {
          p.alpha = Math.random() * 0.6 + 0.2;
          p.x = this.width / 2 + (Math.random() - 0.5) * 15;
          p.y = this.height * 0.85 - 80; // Start at wick
          p.speedX = (Math.random() - 0.5) * 0.15;
        }

        this.ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
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

    // Draw the actual Candle if theme is 'candle'
    if (this.theme === 'candle') {
      const centerX = this.width / 2;
      const candleTopY = this.height * 0.85 - 75; // wick base
      const candleHeight = 110;
      const candleWidth = 26;

      // 1. Draw Candle Wax Body (cylinder)
      const waxGrad = this.ctx.createLinearGradient(centerX - candleWidth/2, 0, centerX + candleWidth/2, 0);
      waxGrad.addColorStop(0, '#78350f'); // Shadow dark amber
      waxGrad.addColorStop(0.3, '#d97706'); // Warm wax gold
      waxGrad.addColorStop(0.7, '#f59e0b'); // Highlit wax
      waxGrad.addColorStop(1, '#b45309'); // Right side shadow

      this.ctx.fillStyle = waxGrad;
      this.ctx.beginPath();
      this.ctx.arc(centerX, candleTopY, candleWidth/2, Math.PI, 0, false);
      this.ctx.rect(centerX - candleWidth/2, candleTopY, candleWidth, candleHeight);
      this.ctx.fill();

      // Wax drips
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.beginPath();
      this.ctx.arc(centerX - 4, candleTopY + 12, 3, 0, Math.PI * 2);
      this.ctx.arc(centerX + 6, candleTopY + 22, 2.5, 0, Math.PI * 2);
      this.ctx.fill();

      // 2. Draw Wick
      this.ctx.strokeStyle = '#27272a';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, candleTopY);
      this.ctx.quadraticCurveTo(centerX - 2, candleTopY - 8, centerX - 1, candleTopY - 15);
      this.ctx.stroke();

      // 3. Draw Flickering Flame (layered shapes with bezier curves)
      const flameWiggleX = Math.sin(time * 0.007) * 1.5 + (Math.random() - 0.5) * 0.8;
      const flameWiggleY = Math.cos(time * 0.004) * 2 + Math.random() * 0.6;
      const flameBaseX = centerX - 1;
      const flameBaseY = candleTopY - 14;

      // Outer glow of the flame (Soft orange aura)
      const outerGlow = this.ctx.createRadialGradient(flameBaseX, flameBaseY - 20, 0, flameBaseX, flameBaseY - 20, 60 + Math.sin(time * 0.01) * 4);
      outerGlow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      outerGlow.addColorStop(0.5, 'rgba(217, 119, 6, 0.06)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = outerGlow;
      this.ctx.beginPath();
      this.ctx.arc(flameBaseX, flameBaseY - 20, 70, 0, Math.PI * 2);
      this.ctx.fill();

      // Flame Layer 1: Outer Orange Flame
      this.drawFlameLayer(flameBaseX, flameBaseY, 13 + flameWiggleX * 0.1, 44 + flameWiggleY, flameWiggleX, 'rgba(239, 68, 68, 0.45)');

      // Flame Layer 2: Middle Yellow Flame
      this.drawFlameLayer(flameBaseX, flameBaseY - 3, 9 + flameWiggleX * 0.2, 34 + flameWiggleY, flameWiggleX * 0.8, '#f59e0b');

      // Flame Layer 3: Inner White Flame
      this.drawFlameLayer(flameBaseX, flameBaseY - 6, 5, 22 + flameWiggleY * 0.6, flameWiggleX * 0.5, '#fef3c7');

      // Flame Layer 4: Blue Flame Core at the bottom wick
      const blueGrad = this.ctx.createRadialGradient(flameBaseX, flameBaseY, 1, flameBaseX, flameBaseY, 8);
      blueGrad.addColorStop(0, 'rgba(37, 99, 235, 0.8)');
      blueGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
      blueGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = blueGrad;
      this.ctx.beginPath();
      this.ctx.arc(flameBaseX, flameBaseY, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  // Helper to draw realistic teardrop-shaped flame layers using bezier curves
  drawFlameLayer(bx, by, w, h, wiggle, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    
    // Start at bottom center
    this.ctx.moveTo(bx, by);
    
    // Left curve to tip
    this.ctx.bezierCurveTo(
      bx - w, by - h * 0.2,
      bx - w * 0.8 + wiggle, by - h * 0.8,
      bx + wiggle, by - h
    );
    
    // Right curve back to base
    this.ctx.bezierCurveTo(
      bx + w * 0.8 + wiggle, by - h * 0.8,
      bx + w, by - h * 0.2,
      bx, by
    );
    
    this.ctx.fill();
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
