/* Hero: Orbit → lineup → takeoff → counter.
   
   TRUE CSS 3D approach:
   - perspective on .world creates the 3D projection
   - preserve-3d on .orbit lets cards live in real 3D space  
   - orbit is rotateX(TILT) — tilts the ring plane
   - each email: translate3d(x, y, 0) + rotateX(-TILT) — positioned on ring, faces viewer
   - the BROWSER handles perspective distortion (trapezoid cards, natural depth)
   - NO manual pScale. NO fake scale. Real 3D. */

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
  var statVal   = document.querySelector('.revenue-stat__value');
  var ringLine  = document.querySelector('.orbit-ring-line');

  if (!emails.length || !orbit || !scene) return;

  var isMobile     = window.innerWidth <= 834;
  var emailCount   = isMobile ? 5 : 8;
  var LINE_SPACING = isMobile ? 100 : 240;
  var LINEUP_COUNT = isMobile ? 3 : 4;  // fewer cards line up on mobile
  var rotationOffset = 0;
  var orbitActive    = true;
  // Entrance state read by updateRing: cards fade up while sweeping round the ring.
  // One owner for card opacity — a separate opacity tween would fight updateRing every frame.
  var intro = { fade: 0, spin: 0 };
  var hasPlayed = sessionStorage.getItem('heroAnimPlayed');
  var hasLaunchedOnce = !!hasPlayed;

  // ===== 3D RING CONFIG =====
  var vh = window.innerHeight;
  var vw = window.innerWidth;
  var RADIUS   = isMobile ? Math.min(vw * 0.40, 280) : Math.min(Math.max(vh * 0.48, 400), 560);
  var TILT_DEG = 38;  // degrees — ring tilts this much from vertical

  // Enable the 3D ring plane
  orbit.style.transformStyle = 'preserve-3d';
  gsap.set(orbit, { rotationX: TILT_DEG });

  // Ring line — circle in the orbit's 3D plane, projected by perspective
  if (ringLine) {
    var d = RADIUS * 2;
    ringLine.style.width = d + 'px';
    ringLine.style.height = d + 'px';
    ringLine.style.transform = 'translate(-50%, -50%)';
  }

  // Distribute emails evenly
  emails.forEach(function(e, i) {
    if (i >= emailCount) return;
    e._angle = (i / emailCount) * Math.PI * 2;
  });

  gsap.set(emails, { opacity: 0 });
  if (counterEl) gsap.set(counterEl, { opacity: 0 });

  // ===== UPDATE RING =====
  function updateRing() {
    if (!orbitActive) return;
    emails.forEach(function(email, i) {
      if (i >= emailCount) return;
      var angle = email._angle + rotationOffset + intro.spin;

      // Position on the ring circle (orbit's local XY plane)
      var posX = Math.cos(angle) * RADIUS;
      var posY = -Math.sin(angle) * RADIUS;

      // Nearness: +1 = front/bottom (closest to camera), -1 = back/top (furthest)
      var nearness = -(-Math.sin(angle));  // = sin(angle)
      // sin(π/2) = 1 → top of ring = far → nearness should be -1
      // Actually: posY = -sin(angle)*R. At angle=π/2: posY = -R (top).
      // After orbit rotateX, top goes BACK (further). So top = far.
      // nearness = posY / RADIUS = -sin(angle) / 1 → maps to -1(top/far) to +1(bottom/near)
      nearness = posY / RADIUS;  // -1 = top/far, +1 = bottom/near

      // --- Atmospheric effects based on depth ---
      // Cards fade to 0 when directly in front of the text center
      var absX = Math.abs(posX);
      var textHalfW = isMobile ? 200 : 350;
      var opacity;

      if (nearness < -0.2) {
        // Back of ring — dim, atmospheric
        opacity = 0.12 + (1 + nearness) * 0.25;
      } else {
        // Front and sides — visible
        opacity = 0.55 + Math.max(0, nearness) * 0.35;
      }
      opacity = Math.min(opacity, 0.9) * intro.fade;

      // FRONT FADE: when card passes directly in front of text, fade to 0
      if (nearness > 0.3) {
        var frontAmount = (nearness - 0.3) / 0.7;  // 0 at nearness=0.3, 1 at nearness=1.0
        var centerAmount = Math.max(0, 1 - absX / textHalfW);  // 1 at center, 0 at text edge
        opacity *= (1 - frontAmount * centerAmount * 0.95);  // fade almost to 0 at dead center front
      }

      // Card rotation — follows the ring surface
      var cardRotX = -TILT_DEG;  // counter the orbit tilt so card faces viewer
      var cardRotY = Math.cos(angle) * 14;  // sides face slightly inward

      // Brightness + blur based on depth
      var brightness = 0.35 + ((nearness + 1) / 2) * 0.55;
      var blur = nearness < -0.2 ? (-nearness - 0.2) * 3 : 0;

      var filterStr = 'brightness(' + brightness.toFixed(2) + ')';
      if (blur > 0.3) filterStr += ' blur(' + blur.toFixed(1) + 'px)';

      // Position in 3D — the browser's perspective does the rest
      gsap.set(email, {
        x: posX,
        y: posY,
        z: 0,
        rotationX: cardRotX,
        rotationY: cardRotY,
        scale: 0.85,
        opacity: opacity,
        filter: filterStr
      });

      // Shadows
      var sd = Math.max(0, (nearness + 1) * 0.5);
      var sY = 4 + sd * 16;
      var sB = sY * 2.5;
      var sA = (0.25 + sd * 0.35).toFixed(2);
      var gA = ((1 - Math.abs(nearness)) * 0.05).toFixed(3);

      var card = email.querySelector('.orbit-email__card');
      if (card) card.style.boxShadow =
        '0 ' + sY.toFixed(0) + 'px ' + sB.toFixed(0) + 'px rgba(0,0,0,' + sA + '),' +
        ' 0 0 35px rgba(60,120,255,' + gA + '),' +
        ' 0 0 1px rgba(255,255,255,0.05)';
    });
  }

  // Exhaust elements
  emails.forEach(function(email) {
    var ex = document.createElement('div');
    ex.className = 'orbit-email__exhaust';
    email.appendChild(ex);
    email._exhaust = ex;
  });

  // ---- ENTRY ANIMATION (skip if returning from case study) ----
  if (hasPlayed) {
    // Returning from a case study — skip entrance, show orbit immediately
    gsap.set(['.hero-cinema__greeting', '.hero-cinema__title', '.hero-cinema__actions'], { opacity: 1, y: 0 });
    gsap.set('.hero-cinema__scroll', { opacity: 1 });
    intro.fade = 1;
    updateRing();
  } else {
    var eTl = gsap.timeline({ delay: 0.3 });
    eTl.from('.hero-cinema__greeting', { y:15, opacity:0, duration:0.9, ease:'power3.out' })
       .from('.hero-cinema__title', { y:20, opacity:0, duration:1.1, ease:'power3.out' }, '-=0.6')
       .from('.hero-cinema__actions', { y:10, opacity:0, duration:0.8, ease:'power3.out' }, '-=0.5')
       .from('.hero-cinema__scroll', { opacity:0, duration:0.5 }, '-=0.3');
    // Cards start already spread on the ring, a quarter-turn back, and glide into the idle orbit
    intro.spin = -Math.PI / 2;
    eTl.to(intro, { fade: 1, duration: 1.6, ease: 'power2.out' }, 0.2);
    eTl.to(intro, { spin: 0, duration: 2.6, ease: 'power3.out' }, 0);
    updateRing();
    sessionStorage.setItem('heroAnimPlayed', '1');
  }

  // ---- IDLE ROTATION ----
  var idleTween = gsap.to({ val: 0 }, {
    val: Math.PI * 2, duration: 60, repeat: -1, ease: 'none',
    onUpdate: function() { rotationOffset = this.targets()[0].val; updateRing(); }
  });

  function lockScroll() { document.body.style.overflow = 'hidden'; document.body.style.touchAction = 'none'; }
  function unlockScroll() { document.body.style.overflow = ''; document.body.style.touchAction = ''; }

  var lineStartX = -((LINEUP_COUNT - 1) * LINE_SPACING) / 2;

  // On return from case study: just orbit, no scroll animation
  if (hasPlayed) return;

  // ---- SCROLL TIMELINE ----
  var scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: '+=100%',
      scrub: 1,
      pin: scene,
      onUpdate: function(self) {
        if (self.progress > 0.92 && !hasLaunchedOnce && self.direction === 1) {
          hasLaunchedOnce = true;
          runAutoPlay();
        }
        if (self.progress > 0.15 && orbitActive && !hasLaunchedOnce && self.direction === 1) {
          orbitActive = false;
          idleTween.pause();
        }
      }
    }
  });

  scrollTl.to(scrollInd, { opacity: 0, duration: 0.5 }, 0);
  scrollTl.to(textEl, { opacity: 0, y: -40, duration: 1.2, ease: 'power2.in' }, 0.2);
  // Flatten the orbit ring as part of the transition
  scrollTl.to(orbit, { rotationX: 0, duration: 1.8, ease: 'power3.inOut' }, 1);
  if (ringLine) scrollTl.to(ringLine, { opacity: 0, duration: 1 }, 0.2);

  emails.forEach(function(email, i) {
    if (i >= emailCount) return;
    if (i < LINEUP_COUNT) {
      // First 4: move to horizontal lineup
      scrollTl.to(email, {
        x: lineStartX + i * LINE_SPACING, y: 0, z: 0,
        rotationX: 0, rotationY: 0,
        opacity: 0.85, scale: 1, filter: 'none',
        duration: 1.8, ease: 'power3.inOut'
      }, 1);
    } else {
      // Extra cards: fade out during transition
      scrollTl.to(email, {
        opacity: 0, scale: 0.5, filter: 'blur(4px)',
        duration: 1.2, ease: 'power2.in'
      }, 0.8);
    }
  });


  // ---- SKIP ANIMATION (called by CTA clicks) ----
  window.skipHeroAnimation = function() {
    if (scrollTl.scrollTrigger) scrollTl.scrollTrigger.kill(true);
    idleTween.pause();
    orbitActive = false;
    hasLaunchedOnce = true;
    gsap.set(textEl, { opacity: 1, y: 0, clearProps: 'all' });
    gsap.set(scrollInd, { opacity: 0 });
    if (counterEl) gsap.set(counterEl, { opacity: 0 });
    emails.forEach(function(e, i) {
      if (i >= emailCount) return;
      gsap.set(e, { clearProps: 'all', opacity: 0 });
      if (e._exhaust) gsap.set(e._exhaust, { height: 0, opacity: 0 });
    });
    window.skipHeroAnimation = null;
  };

  // ---- TAKEOFF (preserved) ----
  var blastPaths = [
    { x: -1400, y: -700, rot: -30 }, { x: 1500, y: -500, rot: 25 },
    { x: -900, y: -900, rot: -45 },  { x: 1200, y: -800, rot: 35 },
    { x: 200, y: -1200, rot: 5 },    { x: -1600, y: -300, rot: -20 },
    { x: 800, y: -1000, rot: 15 },    { x: -500, y: -1100, rot: -40 }
  ];

  function runAutoPlay() {
    lockScroll();
    orbitActive = false;
    idleTween.pause();

    var counterObj = { val: 0 };
    if (counterEl) {
      gsap.set(counterEl, { opacity: 0 });
      if (counterVal) counterVal.textContent = '$0';
    }

    var tl = gsap.timeline({
      onComplete: function() {
        // Set revenue-stat to match the counter
        if (statVal) statVal.textContent = '$10,000,000+';

        // Smooth fade: counter fades out while we transition
        var exitTl = gsap.timeline({
          onComplete: function() {
            // Now kill pin and hand off to static page
            if (scrollTl.scrollTrigger) scrollTl.scrollTrigger.kill(true);

            gsap.set(textEl, { opacity: 1, y: 0, clearProps: 'all' });
            gsap.set(scrollInd, { opacity: 0 });
            gsap.set(orbit, { rotationX: TILT_DEG });
            orbit.style.display = '';
            if (ringLine) gsap.set(ringLine, { opacity: 1 });
            emails.forEach(function(e, i) {
              if (i >= emailCount) return;
              gsap.set(e._exhaust, { height: 0, opacity: 0 });
              gsap.set(e, { clearProps: 'all', opacity: 0 });
            });
            orbitActive = true;
            idleTween.resume();
            updateRing();

            var revStat = document.querySelector('.revenue-stat');
            if (revStat) window.scrollTo({ top: revStat.offsetTop, behavior: 'smooth' });
            unlockScroll();
          }
        });

        // Fade counter out smoothly
        exitTl.to(counterEl, { opacity: 0, y: -20, duration: 0.8, ease: 'power2.inOut' }, 0);
        // Brief pause so it doesn't feel jarring
        exitTl.to({}, { duration: 0.3 });
      }
    });

    emails.forEach(function(email, i) {
      if (i >= LINEUP_COUNT) return;
      tl.to(email._exhaust, { height: isMobile ? 50 : 70, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
    });
    emails.forEach(function(email, i) {
      if (i >= LINEUP_COUNT) return;
      tl.to(email, { x: '+=3', yoyo: true, repeat: 8, duration: 0.04, ease: 'none' }, 0.3);
    });
    emails.forEach(function(email, i) {
      if (i >= LINEUP_COUNT) return;
      tl.to(email._exhaust, { height: isMobile ? 120 : 200, duration: 1 }, 1);
    });
    emails.forEach(function(email, i) {
      if (i >= LINEUP_COUNT) return;
      tl.to(email, { y: '-=180', duration: 0.8, ease: 'power1.in' }, 1.5);
    });
    emails.forEach(function(email, i) {
      if (i >= LINEUP_COUNT) return;
      var p = blastPaths[i % blastPaths.length];
      tl.to(email, { x: '+=' + p.x, y: '+=' + p.y, rotation: p.rot, opacity: 0, duration: 1.2, ease: 'power2.in' }, 2.3 + i * 0.15);
    });

    tl.call(function() { orbit.style.display = 'none'; }, [], 3.8);
    tl.to(counterEl, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 3.5);

    tl.to(counterObj, {
      val: 10000000, duration: 2.5, ease: 'power2.in',
      onUpdate: function() {
        var n = Math.round(counterObj.val);
        counterVal.textContent = n >= 10000000 ? '$10,000,000+' : '$' + n.toLocaleString('en-US');
      }
    }, 3.8);

    if (counterLbl) {
      tl.fromTo(counterLbl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 5.8);
    }

    tl.to({}, { duration: 1.5 });
  }
}
