/* Hero: Orbit → lineup → takeoff → counter, driven entirely by scroll.

   TRUE CSS 3D approach:
   - perspective on .world creates the 3D projection
   - preserve-3d on .orbit lets cards live in real 3D space
   - orbit is rotateX(TILT) — tilts the ring plane
   - each email: translate3d(x, y, 0) + rotateX(-TILT) — positioned on ring, faces viewer

   One owner for card state: render() computes every card's transform, opacity and filter
   from a handful of numbers (rotation, fade, spin, morph, launch). Tweens and ScrollTrigger
   only move those numbers — nothing else writes to the cards — so nothing fights, and
   scrolling back up reverses the whole sequence cleanly. No scroll locking, no autoplay,
   no programmatic scrolling. */

function initCinemaHero() {
  gsap.registerPlugin(ScrollTrigger);

  var section   = document.querySelector('.hero-cinema');
  var scene     = document.querySelector('.hero-cinema__scene');
  var orbit     = document.querySelector('.hero-cinema__orbit');
  var emails    = gsap.utils.toArray('.orbit-email');
  var textEl    = document.querySelector('.hero-cinema__text');
  var scrollInd = document.querySelector('.hero-cinema__scroll');
  var counterEl = document.querySelector('.hero-cinema__counter');
  var counterVal= document.querySelector('.hero-cinema__counter-value');
  var counterLbl= document.querySelector('.hero-cinema__counter-label');
  var ringLine  = document.querySelector('.orbit-ring-line');

  if (!emails.length || !orbit || !scene) return;

  var isMobile     = window.innerWidth <= 834;
  var emailCount   = isMobile ? 5 : 8;
  var LINE_SPACING = isMobile ? 100 : 240;
  var LINEUP_COUNT = isMobile ? 3 : 4;  // fewer cards line up on mobile
  var EXHAUST_MAX  = isMobile ? 120 : 200;

  // ===== 3D RING CONFIG =====
  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var RADIUS   = isMobile ? Math.min(vw * 0.40, 280) : Math.min(Math.max(vh * 0.48, 400), 560);
  var TILT_DEG = 38;  // degrees — ring tilts this much from vertical
  var lineStartX = -((LINEUP_COUNT - 1) * LINE_SPACING) / 2;

  var blastPaths = [
    { x: -1400, y: -700, rot: -30 }, { x: 1500, y: -500, rot: 25 },
    { x: -900, y: -900, rot: -45 },  { x: 1200, y: -800, rot: 35 },
    { x: 200, y: -1200, rot: 5 },    { x: -1600, y: -300, rot: -20 },
    { x: 800, y: -1000, rot: 15 },    { x: -500, y: -1100, rot: -40 }
  ];

  // The only state the cards are drawn from
  var state = {
    rotation: 0,   // idle orbit angle (radians), always turning
    fade: 0,       // entrance fade 0 → 1
    spin: 0,       // entrance sweep offset (radians) → 0
    morph: 0,      // 0 = ring, 1 = horizontal lineup    (scroll)
    launch: 0      // 0 = parked, 1 = blasted off screen (scroll)
  };

  orbit.style.transformStyle = 'preserve-3d';
  if (ringLine) {
    ringLine.style.width = RADIUS * 2 + 'px';
    ringLine.style.height = RADIUS * 2 + 'px';
    ringLine.style.transform = 'translate(-50%, -50%)';
  }

  emails.forEach(function(e, i) {
    e._angle = (i / emailCount) * Math.PI * 2;
    e._card = e.querySelector('.orbit-email__card');
    var ex = document.createElement('div');
    ex.className = 'orbit-email__exhaust';
    e.appendChild(ex);
    e._exhaust = ex;
  });

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(v, a, b) { return clamp01((v - a) / (b - a)); }   // 0→1 as v goes a→b
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeIn(t) { return t * t; }

  // ===== RENDER — the single writer for every card =====
  function render() {
    var m = state.morph, L = state.launch;
    var tilt = TILT_DEG * (1 - m);
    gsap.set(orbit, { rotationX: tilt });

    emails.forEach(function(email, i) {
      if (i >= emailCount) return;
      var angle = email._angle + state.rotation + state.spin;

      // --- Ring position + depth atmosphere ---
      var rX = Math.cos(angle) * RADIUS;
      var rY = -Math.sin(angle) * RADIUS;
      var nearness = rY / RADIUS;  // -1 = top/far, +1 = bottom/near
      var rOpacity = nearness < -0.2 ? 0.12 + (1 + nearness) * 0.25 : 0.55 + Math.max(0, nearness) * 0.35;
      rOpacity = Math.min(rOpacity, 0.9);
      if (nearness > 0.3) {
        // Fade cards that pass directly in front of the headline
        var textHalfW = isMobile ? 200 : 350;
        var frontAmount = (nearness - 0.3) / 0.7;
        var centerAmount = Math.max(0, 1 - Math.abs(rX) / textHalfW);
        rOpacity *= (1 - frontAmount * centerAmount * 0.95);
      }
      var rBright = 0.35 + ((nearness + 1) / 2) * 0.55;
      var rBlur = nearness < -0.2 ? (-nearness - 0.2) * 3 : 0;

      var x, y, rotY, scale, opacity, bright, blur, rot = 0;
      if (i < LINEUP_COUNT) {
        // --- Blend ring → lineup ---
        x = lerp(rX, lineStartX + i * LINE_SPACING, m);
        y = lerp(rY, 0, m);
        rotY = lerp(Math.cos(angle) * 14, 0, m);
        scale = lerp(0.85, 1, m);
        opacity = lerp(rOpacity, 0.85, m);
        bright = lerp(rBright, 1, m);
        blur = lerp(rBlur, 0, m);

        // --- Takeoff: rumble, rise, blast ---
        var rumble = seg(L, 0.05, 0.12) * (1 - seg(L, 0.24, 0.3));
        x += Math.sin(L * 400) * 3 * rumble;
        y -= 180 * easeIn(seg(L, 0.2, 0.45));
        var p = blastPaths[i % blastPaths.length];
        var k = easeIn(seg(L, 0.42 + i * 0.05, 0.8 + i * 0.05));
        x += p.x * k; y += p.y * k; rot = p.rot * k;
        opacity *= (1 - k);

        var exH = L <= 0 ? 0 : lerp(EXHAUST_MAX * 0.35, EXHAUST_MAX, seg(L, 0.08, 0.4)) * seg(L, 0, 0.08);
        email._exhaust.style.height = exH.toFixed(0) + 'px';
        email._exhaust.style.opacity = (seg(L, 0, 0.06) * (1 - k)).toFixed(2);
      } else {
        // Extra cards leave during the morph
        var out = seg(m, 0, 0.6);
        x = rX; y = rY; rotY = Math.cos(angle) * 14;
        scale = lerp(0.85, 0.5, out);
        opacity = rOpacity * (1 - out);
        bright = rBright;
        blur = rBlur + out * 4;
      }
      opacity *= state.fade;

      var filterStr = 'brightness(' + bright.toFixed(2) + ')';
      if (blur > 0.3) filterStr += ' blur(' + blur.toFixed(1) + 'px)';
      gsap.set(email, {
        x: x, y: y, z: 0,
        rotationX: -tilt, rotationY: rotY, rotation: rot,
        scale: scale, opacity: opacity, filter: filterStr,
        visibility: opacity < 0.005 ? 'hidden' : 'visible'
      });

      // Shadows follow depth on the ring, settle in the lineup
      if (email._card) {
        var sd = lerp(Math.max(0, (nearness + 1) * 0.5), 0.6, m);
        var sY = 4 + sd * 16;
        email._card.style.boxShadow =
          '0 ' + sY.toFixed(0) + 'px ' + (sY * 2.5).toFixed(0) + 'px rgba(0,0,0,' + (0.25 + sd * 0.35).toFixed(2) + '),' +
          ' 0 0 35px rgba(60,120,255,' + ((1 - Math.abs(nearness)) * 0.05 * (1 - m)).toFixed(3) + '),' +
          ' 0 0 1px rgba(255,255,255,0.05)';
      }
    });
  }

  // ---- ENTRANCE: text rises, cards fade up already spread on the ring and sweep into orbit ----
  var eTl = gsap.timeline({ delay: 0.3, onUpdate: render });
  eTl.from('.hero-cinema__greeting', { y:15, opacity:0, duration:0.9, ease:'power3.out' })
     .from('.hero-cinema__title', { y:20, opacity:0, duration:1.1, ease:'power3.out' }, '-=0.6')
     .from('.hero-cinema__actions', { y:10, opacity:0, duration:0.8, ease:'power3.out' }, '-=0.5')
     .from('.hero-cinema__scroll', { opacity:0, duration:0.5 }, '-=0.3');
  state.spin = -Math.PI / 2;
  eTl.to(state, { fade: 1, duration: 1.6, ease: 'power2.out' }, 0.2);
  eTl.to(state, { spin: 0, duration: 2.6, ease: 'power3.out' }, 0);
  if (counterEl) gsap.set(counterEl, { opacity: 0 });
  render();

  // ---- IDLE ROTATION — one full turn a minute; skips drawing once the cards have lined up ----
  gsap.to(state, {
    rotation: Math.PI * 2, duration: 60, repeat: -1, ease: 'none',
    onUpdate: function() { if (state.morph < 1) render(); }
  });

  // ---- SCROLL: one pin, one timeline, every stage scrubbed ----
  var counterObj = { val: 0 };
  var scrollTl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: render,
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: isMobile ? '+=260%' : '+=300%',
      scrub: 0.5,
      pin: scene,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  scrollTl.to(scrollInd, { opacity: 0, duration: 0.5 }, 0);
  scrollTl.to(textEl, { opacity: 0, y: -40, duration: 1.2, ease: 'power2.in' }, 0.2);
  if (ringLine) scrollTl.to(ringLine, { opacity: 0, duration: 1.2 }, 0.2);
  scrollTl.to(state, { morph: 1, duration: 2.2, ease: 'power3.inOut' }, 1);
  scrollTl.to(state, { launch: 1, duration: 2.8 }, 3.4);
  if (counterEl) {
    scrollTl.to(counterEl, { opacity: 1, duration: 0.8 }, 5.6);
    scrollTl.to(counterObj, {
      val: 10000000, duration: 3, ease: 'power1.inOut',
      onUpdate: function() {
        var n = Math.round(counterObj.val);
        counterVal.textContent = n >= 10000000 ? '$10,000,000+' : '$' + n.toLocaleString('en-US');
      }
    }, 5.8);
  }
  if (counterLbl) scrollTl.fromTo(counterLbl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 8.4);
  scrollTl.to({}, { duration: 1 });  // hold the finished counter before the pin releases
}
