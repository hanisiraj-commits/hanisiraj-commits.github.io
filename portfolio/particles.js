/* ============================================
   Space particle system v3
   Star dust + bright blue star clusters + shooting stars
   ============================================ */
(function() {
  const canvas = document.createElement('canvas');
  canvas.id = 'stars';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let w, h, stars = [], blueStars = [], shootingStars = [];
  const DUST_COUNT = 200;
  const BLUE_STAR_COUNT = 6;
  const HERO_BLUE_COUNT = 5;
  const HERO_DUST_COUNT = 150;

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }

  // Fine dust particles — mix of white and faint blue
  function createDust() {
    const isBlue = Math.random() > 0.6;
    return {
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      baseAlpha: Math.random() * 0.55 + 0.1,
      alpha: 0,
      drift: (Math.random() - 0.5) * 0.08,
      fall: Math.random() * 0.06 + 0.01,
      twinkleSpeed: Math.random() * 0.005 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
      blue: isBlue,
    };
  }

  // Bright blue glowing stars — scattered across page
  function createBlueStar() {
    return {
      x: Math.random() * w, y: Math.random() * h,
      coreR: 1.5 + Math.random() * 2,
      glowR: 12 + Math.random() * 25,
      outerR: 30 + Math.random() * 50,
      baseAlpha: 0.5 + Math.random() * 0.5,
      alpha: 0,
      drift: (Math.random() - 0.5) * 0.03,
      fall: Math.random() * 0.02 + 0.005,
      pulseSpeed: Math.random() * 0.002 + 0.001,
      pulseOffset: Math.random() * Math.PI * 2,
      hue: 215 + Math.random() * 15,
    };
  }

  // Blue stars concentrated in hero area
  function createHeroBlueStar() {
    const cx = w * 0.5, cy = h * 0.48;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.5) * Math.min(w, h) * 0.35;
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      coreR: 2 + Math.random() * 2.5,
      glowR: 18 + Math.random() * 30,
      outerR: 40 + Math.random() * 60,
      baseAlpha: 0.6 + Math.random() * 0.4,
      alpha: 0,
      drift: (Math.random() - 0.5) * 0.02,
      fall: Math.random() * 0.01 + 0.002,
      pulseSpeed: Math.random() * 0.002 + 0.001,
      pulseOffset: Math.random() * Math.PI * 2,
      hue: 215 + Math.random() * 15,
    };
  }

  function createShootingStar() {
    const fromLeft = Math.random() > 0.5;
    return {
      x: fromLeft ? -20 : w + 20,
      y: Math.random() * h * 0.6,
      vx: fromLeft ? (4 + Math.random() * 4) : -(4 + Math.random() * 4),
      vy: 1.5 + Math.random() * 2,
      length: 40 + Math.random() * 60,
      alpha: 0.6 + Math.random() * 0.3,
      life: 1,
      decay: 0.008 + Math.random() * 0.005,
    };
  }

  // Dense white dust tight around hero text center
  function createHeroDust() {
    const cx = w * 0.5, cy = h * 0.48;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.8) * Math.min(w, h) * 0.22;
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      r: Math.random() * 1.0 + 0.2,
      baseAlpha: Math.random() * 0.7 + 0.2,
      alpha: 0,
      drift: (Math.random() - 0.5) * 0.03,
      fall: Math.random() * 0.015 + 0.003,
      twinkleSpeed: Math.random() * 0.004 + 0.001,
      twinkleOffset: Math.random() * Math.PI * 2,
      blue: false,
      hero: true,
    };
  }

  function init() {
    resize();
    stars = [];
    blueStars = [];
    for (let i = 0; i < DUST_COUNT; i++) stars.push(createDust());
    for (let i = 0; i < HERO_DUST_COUNT; i++) stars.push(createHeroDust());
    for (let i = 0; i < BLUE_STAR_COUNT; i++) blueStars.push(createBlueStar());
    for (let i = 0; i < HERO_BLUE_COUNT; i++) blueStars.push(createHeroBlueStar());
  }

  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.pageYOffset; }, { passive: true });

  setInterval(() => {
    if (shootingStars.length < 2) shootingStars.push(createShootingStar());
  }, 4000 + Math.random() * 4000);

  function draw(t) {
    ctx.clearRect(0, 0, w, h);

    // Fade particles as user scrolls past the hero
    const fadeStart = h * 0.5;
    const fadeEnd = h * 1.2;
    const scrollFade = scrollY <= fadeStart ? 1 : scrollY >= fadeEnd ? 0.25 : 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart) * 0.75;
    ctx.globalAlpha = scrollFade;

    // --- Blue glowing stars (drawn first, behind dust) ---
    for (const bs of blueStars) {
      bs.alpha = bs.baseAlpha + Math.sin(t * bs.pulseSpeed + bs.pulseOffset) * bs.baseAlpha * 0.3;
      bs.x += bs.drift;
      bs.y += bs.fall;
      const drawY = (bs.y - scrollY * bs.fall * 0.2) % (h + 60);
      const drawYW = drawY < -30 ? drawY + h + 60 : drawY;
      if (bs.x < -60) bs.x = w + 60;
      if (bs.x > w + 60) bs.x = -60;
      if (bs.y > h + 60) { bs.y = -60; bs.x = Math.random() * w; }

      const a = Math.max(0, bs.alpha);

      // Outer glow — big soft halo
      const outerGrad = ctx.createRadialGradient(bs.x, drawYW, 0, bs.x, drawYW, bs.outerR);
      outerGrad.addColorStop(0, `hsla(${bs.hue}, 80%, 60%, ${a * 0.06})`);
      outerGrad.addColorStop(0.4, `hsla(${bs.hue}, 70%, 50%, ${a * 0.03})`);
      outerGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(bs.x, drawYW, bs.outerR, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      // Inner glow
      const innerGrad = ctx.createRadialGradient(bs.x, drawYW, 0, bs.x, drawYW, bs.glowR);
      innerGrad.addColorStop(0, `hsla(${bs.hue}, 80%, 75%, ${a * 0.35})`);
      innerGrad.addColorStop(0.3, `hsla(${bs.hue}, 75%, 60%, ${a * 0.15})`);
      innerGrad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(bs.x, drawYW, bs.glowR, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Bright white-blue core
      ctx.beginPath();
      ctx.arc(bs.x, drawYW, bs.coreR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${bs.hue}, 60%, 90%, ${a * 0.9})`;
      ctx.fill();
    }

    // --- White dust ---
    for (const s of stars) {
      s.alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed + s.twinkleOffset) * s.baseAlpha * 0.6;
      s.x += s.drift;
      s.y += s.fall;
      const drawY = (s.y - scrollY * s.fall * 0.3) % (h + 20);
      const drawYW = drawY < -10 ? drawY + h + 20 : drawY;
      if (s.x < -10) s.x = w + 10;
      if (s.x > w + 10) s.x = -10;
      if (s.y > h + 10) { s.y = -10; s.x = Math.random() * w; }

      const a = Math.max(0, s.alpha);
      ctx.beginPath();
      ctx.arc(s.x, drawYW, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.blue
        ? `rgba(140,180,255,${a})`
        : `rgba(255,255,255,${a})`;
      ctx.fill();
      // Tiny glow on larger dust
      if (s.r > 1.0) {
        ctx.beginPath();
        ctx.arc(s.x, drawYW, s.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = s.blue
          ? `rgba(100,150,255,${a * 0.1})`
          : `rgba(200,220,255,${a * 0.06})`;
        ctx.fill();
      }
    }

    // --- Shooting stars ---
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= ss.decay;

      if (ss.life <= 0 || ss.x < -100 || ss.x > w + 100 || ss.y > h + 100) {
        shootingStars.splice(i, 1);
        continue;
      }

      const mag = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
      const tailX = ss.x - (ss.vx / mag) * ss.length;
      const tailY = ss.y - (ss.vy / mag) * ss.length;

      const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
      grad.addColorStop(0, 'rgba(100,160,255,0)');
      grad.addColorStop(1, `rgba(180,210,255,${ss.alpha * ss.life})`);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(ss.x, ss.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,210,255,${ss.alpha * ss.life * 0.8})`;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  requestAnimationFrame(draw);
})();
