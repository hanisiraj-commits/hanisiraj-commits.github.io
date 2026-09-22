gsap.registerPlugin(ScrollTrigger);
const EASE = 'power4.out';

document.addEventListener('DOMContentLoaded', () => {

  // Cinema hero
  if (typeof initCinemaHero === 'function') initCinemaHero();

  // Page entrance
  const overlay = document.querySelector('.page-transition');
  if (overlay) {
    gsap.to(overlay, { opacity: 0, duration: 0.7, ease: 'power2.inOut', onComplete: () => overlay.style.display = 'none' });
  }

  // ---- HERO TEXT ENTRANCE ----
  const heroTl = gsap.timeline({ defaults: { ease: EASE }, delay: 0.2 });
  heroTl
    .from('.hero__greeting', { y: 8, opacity: 0, duration: 0.8 })
    .from('.hero__title', { y: 14, opacity: 0, duration: 1 }, '-=0.6')
    .from('.hero__subtitle', { y: 10, opacity: 0, duration: 0.8 }, '-=0.7')
    .from('.hero__actions', { y: 8, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero__scroll-indicator', { opacity: 0, duration: 0.5 }, '-=0.3');

  // ---- SCATTER EMAILS: fly in staggered, then disperse on scroll ----
  const scatterEmails = gsap.utils.toArray('.scatter-email');

  if (scatterEmails.length) {
    // Entrance: emails fly in from right with stagger
    scatterEmails.forEach((email, i) => {
      const delay = parseFloat(email.style.getPropertyValue('--delay')) || i * 0.12;
      gsap.fromTo(email, {
        x: 200, opacity: 0, scale: 0.7, rotation: 0
      }, {
        x: 0, opacity: 0.85, scale: 1,
        rotation: parseFloat(getComputedStyle(email).getPropertyValue('--rot')) || 0,
        duration: 1.2, delay: 0.5 + delay, ease: 'power3.out'
      });
    });

    // Scroll dispersion: emails scatter left/right radially as user scrolls
    scatterEmails.forEach((email, i) => {
      const dir = email.dataset.dir || 'left';
      const xDist = dir === 'left' ? -(300 + i * 80) : (300 + i * 80);
      const yDist = (i % 2 === 0 ? -1 : 1) * (100 + i * 40);

      gsap.to(email, {
        x: xDist,
        y: yDist,
        rotation: (dir === 'left' ? -1 : 1) * (15 + i * 5),
        opacity: 0,
        scale: 0.3,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-scatter',
          start: 'top top',
          end: '80% top',
          scrub: 0.6
        }
      });
    });
  }

  // Hero text parallax
  gsap.to('.hero-scatter__text', {
    y: -40, ease: 'none',
    scrollTrigger: { trigger: '.hero-scatter', start: '60% top', end: 'bottom top', scrub: true }
  });

  // ---- SCROLL REVEALS — DISABLED (all sections visible immediately) ----
  // Removed: .reveal, .scrub-up, .stagger-group animations

  // ---- CARD TILT + GLOW ----
  document.querySelectorAll('.case-card').forEach(card => {
    const glow = document.createElement('div');
    glow.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 0.5s;border-radius:12px;z-index:2;';
    card.style.position = 'relative';
    card.appendChild(glow);
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      gsap.to(card, { rotateY: (x/r.width-0.5)*3, rotateX: -(y/r.height-0.5)*3, duration: 0.5, ease: 'power2.out', transformPerspective: 1000 });
      glow.style.background = `radial-gradient(500px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 50%)`;
      glow.style.opacity = '1';
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power2.out' });
      glow.style.opacity = '0';
    });
  });

  // ---- PAGE TRANSITIONS ----
  document.querySelectorAll('a[href$=".html"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const ov = document.querySelector('.page-transition');
      if (ov) { ov.style.display = 'block'; gsap.to(ov, { opacity: 1, duration: 0.35, ease: 'power2.inOut', onComplete: () => window.location.href = href }); }
      else window.location.href = href;
    });
  });

  // ---- MOBILE NAV ----
  const toggle = document.querySelector('.nav__mobile-toggle');
  const navLinks = document.querySelector('.nav__links');
  if (toggle) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      toggle.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    });
  }

  // ---- SMOOTH SCROLL ----
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(link.getAttribute('href'));
      if (t) {
        // Skip hero animation if it hasn't played yet
        if (window.skipHeroAnimation) window.skipHeroAnimation();
        window.scrollTo({ top: t.offsetTop - 56, behavior: 'smooth' });
        if (navLinks) navLinks.classList.remove('active');
      }
    });
  });

  // ---- CASE STUDY PAGE ----
  gsap.utils.toArray('.case-timeline__item').forEach((item, i) => {
    gsap.from(item, { x: -14, opacity: 0, duration: 0.8, delay: i * 0.08, ease: EASE, scrollTrigger: { trigger: item, start: 'top 90%', once: true } });
  });
  gsap.utils.toArray('.case-stat-card').forEach((card, i) => {
    gsap.from(card, { y: 14, opacity: 0, duration: 0.7, delay: i * 0.08, ease: EASE, scrollTrigger: { trigger: card, start: 'top 92%', once: true } });
  });
  gsap.utils.toArray('.case-hero__metric-value').forEach((el, i) => {
    gsap.from(el, { y: 10, opacity: 0, duration: 0.8, delay: 0.3 + i * 0.1, ease: EASE, scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  gsap.utils.toArray('.visual-card').forEach((card, i) => {
    gsap.from(card, { y: 30, opacity: 0, duration: 0.7, delay: i * 0.1, ease: EASE, scrollTrigger: { trigger: card.parentElement, start: 'top 85%', once: true } });
  });
  gsap.utils.toArray('.mockup-frame').forEach(frame => {
    gsap.from(frame, { scale: 0.92, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: frame, start: 'top 88%', once: true } });
  });
});
