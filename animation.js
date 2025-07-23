// animation.js
(function(){
  // ------------------------------------------------
  // Configuration Constants
  // ------------------------------------------------
  const CONFIG = {
    //txPos:         { x: 0.12, y: 0.50 },
	txPos:         { x: 0.88, y: 0.50 },
    //rxPositions:   [ { x: 0.88, y: 0.33 }, { x: 0.88, y: 0.67 } ],
	rxPositions:   [ { x: 0.12, y: 0.33 }, { x: 0.12, y: 0.67 } ],
    rayCount:      12,        // rays per burst
    burstInterval: 1000,      // ms
    speed:         100,       // px/sec
    wallLoss:      0.8,
    rxRadius:      12,        // px
    rayLife:       60.0,      // seconds
    fadeTime:      30.0,      // seconds
    colors: {
      ray:            'rgba(81,255,230,',
      tip:            'rgba(0,119,255,',
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------
    // Canvas Setup
    // ------------------------------------------------
    const canvas = document.getElementById('multipathCanvas');
    const ctx    = canvas.getContext('2d');
    let width, height;
    function resizeCanvas() {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ------------------------------------------------
    // Hero‑inner Obstacle Lookup
    // ------------------------------------------------
    const heroElem = document.querySelector('.hero-inner');
    function getObstacleRect() {
      // get bounding box of the glass panel
      const br = heroElem.getBoundingClientRect();
      return { x: br.left, y: br.top, w: br.width, h: br.height };
    }

    // ------------------------------------------------
    // Ray Class Definition
    // ------------------------------------------------
    class Ray {
      constructor(x,y,vx,vy,energy=1) {
        this.x      = x;
        this.y      = y;
        this.vx     = vx;
        this.vy     = vy;
        this.energy = energy;
        this.age    = 0;
        this.prev   = { x, y };
        this.trail  = [];
      }

      update(delta, obstacle) {
        this.age += delta;
        if (this.age > CONFIG.rayLife) {
          this.energy = 0;
          return;
        }

        // advance
        this.prev.x = this.x; this.prev.y = this.y;
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        // record trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 10) this.trail.shift();

        // receiver hit
        for (const rx of receivers) {
          const dx = this.x - rx.x, dy = this.y - rx.y;
          if (this.energy > 0 && Math.hypot(dx, dy) < CONFIG.rxRadius) {
            rx.flash = 0.1;
            this.energy = 0;
            return;
          }
        }

        // bounce off viewport edges
        if (this.y <= 0 && this.vy < 0) { this.y = 0; this.vy *= -1; this.energy *= CONFIG.wallLoss; }
        if (this.y >= height && this.vy > 0) { this.y = height; this.vy *= -1; this.energy *= CONFIG.wallLoss; }
        if (this.x <= 0 && this.vx < 0) { this.x = 0; this.vx *= -1; this.energy *= CONFIG.wallLoss; }
        if (this.x >= width && this.vx > 0) { this.x = width; this.vx *= -1; this.energy *= CONFIG.wallLoss; }

        // bounce off hero‐inner obstacle
        const { x: ox, y: oy, w: ow, h: oh } = obstacle;
        // left edge
        if (this.prev.x < ox && this.x >= ox && this.y >= oy && this.y <= oy + oh) {
          this.x = ox; this.vx *= -1; this.energy *= CONFIG.wallLoss;
        }
        // right edge
        if (this.prev.x > ox + ow && this.x <= ox + ow && this.y >= oy && this.y <= oy + oh) {
          this.x = ox + ow; this.vx *= -1; this.energy *= CONFIG.wallLoss;
        }
        // top edge
        if (this.prev.y < oy && this.y >= oy && this.x >= ox && this.x <= ox + ow) {
          this.y = oy; this.vy *= -1; this.energy *= CONFIG.wallLoss;
        }
        // bottom edge
        if (this.prev.y > oy + oh && this.y <= oy + oh && this.x >= ox && this.x <= ox + ow) {
          this.y = oy + oh; this.vy *= -1; this.energy *= CONFIG.wallLoss;
        }
      }

      draw() {
        if (this.energy <= 0) return;

        // fade factor
        let fadeFactor = 1;
        const fadeStart = CONFIG.rayLife - CONFIG.fadeTime;
        if (this.age > fadeStart) {
          fadeFactor = Math.max(0, (CONFIG.rayLife - this.age) / CONFIG.fadeTime);
        }

        // draw trail
        ctx.beginPath();
        this.trail.forEach((pt, i, arr) => {
          if (i > 0) {
            const prev = arr[i-1];
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.strokeStyle = CONFIG.colors.ray + (0.15 * this.energy * fadeFactor) + ')';
        ctx.lineWidth   = 2;
        ctx.stroke();

        // draw tip
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
        ctx.fillStyle = CONFIG.colors.tip + (this.energy * fadeFactor) + ')';
        ctx.fill();
      }
    }

    // ------------------------------------------------
    // Transmitter & Receivers
    // ------------------------------------------------
    function mkPoint(p) {
      return { x: p.x * width, y: p.y * height, flash: 0 };
    }
    let transmitter = mkPoint(CONFIG.txPos);
    let receivers    = CONFIG.rxPositions.map(mkPoint);

    // update on resize
    window.addEventListener('resize', () => {
      transmitter = mkPoint(CONFIG.txPos);
      receivers    = CONFIG.rxPositions.map(mkPoint);
    });

    let rays = [];

    // ------------------------------------------------
    // Spawn bursts
    // ------------------------------------------------
    function spawnBurst() {
      const step = (Math.PI * 2) / CONFIG.rayCount;
      for (let i = 0; i < CONFIG.rayCount; i++) {
        const θ = i * step;
        rays.push(new Ray(
          transmitter.x, transmitter.y,
          Math.cos(θ) * CONFIG.speed,
          Math.sin(θ) * CONFIG.speed
        ));
      }
    }
    setInterval(spawnBurst, CONFIG.burstInterval);

    // ------------------------------------------------
    // Animation Loop
    // ------------------------------------------------
    let lastTime = performance.now();
    function animate(time) {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // get updated obstacle rect each frame
      const obstacle = getObstacleRect();

      rays.forEach(r => r.update(delta, obstacle));
      rays = rays.filter(r => r.energy > 0);

      ctx.clearRect(0, 0, width, height);

      // draw receivers/transmitter
      drawAntennas(obstacle);

      rays.forEach(r => r.draw());

      requestAnimationFrame(animate);
    }

    // ------------------------------------------------
    // Draw Antenna Helpers
    // ------------------------------------------------
    function drawAntennas() {
      renderAntenna(transmitter.x, transmitter.y, false);
      receivers.forEach(rx => {
        renderAntenna(rx.x, rx.y, rx.flash > 0);
        rx.flash = Math.max(0, rx.flash - 0.016);
      });
    }

    function renderAntenna(x, y, active) {
      ctx.save();
      ctx.translate(x, y);
      for (let i = 3; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(0, 0, i*6+4, 1.25*Math.PI, 1.75*Math.PI);
        const alpha = active
          ? 0.6 + 0.4 * Math.random()
          : (i === 3 ? 0.7 : 0.3);
        ctx.strokeStyle = `rgba(81,255,230,${alpha})`;
        ctx.lineWidth   = 3;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, 2*Math.PI);
      ctx.fillStyle = active ? '#51ffe6' : '#161d2d';
      ctx.fill();
      ctx.restore();
    }

    // kick off animation
    requestAnimationFrame(animate);
  });
})();
