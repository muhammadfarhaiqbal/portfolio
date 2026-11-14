// Muhammad Farhan Iqbal — portfolio interactions
// Small interactions only: smooth scroll, glass navbar on scroll,
// reveal-on-scroll, subtle tilt on project cards. No tracking.

(function () {
  'use strict';

  // Intro overlay: split the name into letters that stagger in, silver bar
  // fills, then the overlay lifts away after ~2.1s (tap to skip). Skipped
  // entirely under prefers-reduced-motion, and removed from the DOM after.
  var intro = document.getElementById('intro-overlay');
  if (intro) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.remove();
    } else {
      var introName = intro.querySelector('.intro-name');
      if (introName) {
        var introText = introName.textContent;
        introName.textContent = '';
        introText.split('').forEach(function (ch, i) {
          var letter = document.createElement('span');
          letter.className = 'intro-letter';
          letter.textContent = ch === ' ' ? '\u00A0' : ch;
          letter.style.animationDelay = (i * 0.05).toFixed(2) + 's';
          introName.appendChild(letter);
        });
      }
      var introDone = false;
      function finishIntro() {
        if (introDone) return;
        introDone = true;
        intro.classList.add('done');
        setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 500);
      }
      intro.addEventListener('click', finishIntro);
      setTimeout(finishIntro, 2100);
    }
  }

  // Visible silver particle canvas — inspired by the old site's aurora
  // canvas, rebuilt in silver/black glass: floating silver particles,
  // connecting lines, expanding rings, mouse parallax. No red/crimson.
  function initSilverCanvas() {
    var canvas = document.getElementById('silver-canvas');
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var width = 0, height = 0, raf = null, running = false, frame = 0;
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: -9999, py: -9999 };
    var trail = [];
    var particles = [];
    var rings = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // At least 140 particles on desktop, fewer on small screens
      var count = Math.min(170, Math.max(70, Math.floor(width * height / 11000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.9, vy: (Math.random() - 0.5) * 0.9,
          r: 1 + Math.random() * 2.6, tw: Math.random() * Math.PI * 2
        });
      }
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();
    window.addEventListener('mousemove', function (e) {
      mouse.tx = e.clientX / width; mouse.ty = e.clientY / height;
      mouse.px = e.clientX; mouse.py = e.clientY;
      trail.unshift({ x: e.clientX, y: e.clientY });
      if (trail.length > 16) trail.pop();
    }, { passive: true });

    function render() {
      if (!running) return;
      frame++;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, width, height);

      // Expanding silver rings from the hero centre, one every ~2.5 seconds
      if (frame % 150 === 0) rings.push({ r: 0, max: Math.max(width, height) * 0.6 });
      rings = rings.filter(function (ring) { return ring.r < ring.max; });
      rings.forEach(function (ring) {
        ring.r += 1.8;
        var alpha = Math.max(0, 0.2 * (1 - ring.r / ring.max));
        ctx.strokeStyle = 'rgba(232, 232, 236, ' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(width * 0.5 + (mouse.x - 0.5) * 30, height * 0.42 + (mouse.y - 0.5) * 30, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Mouse trail — fading silver dots following the cursor
      trail.forEach(function (pt, i) {
        var trailAlpha = 0.5 * (1 - i / trail.length);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + trailAlpha.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4.5 * (1 - i / trail.length) + 1, 0, Math.PI * 2); ctx.fill();
      });

      // Particles, drifting faster + gently pushed by the mouse.
      // Particles near the mouse glow brighter and link to the cursor.
      particles.forEach(function (p) {
        p.tw += 0.04;
        p.x += p.vx + (mouse.x - 0.5) * 0.35;
        p.y += p.vy + (mouse.y - 0.5) * 0.35;
        if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10; if (p.y > height + 10) p.y = -10;
        var dxm = p.x - mouse.px, dym = p.y - mouse.py;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        var near = dm < 160 ? (1 - dm / 160) : 0;
        var a = Math.min(1, 0.6 + Math.sin(p.tw) * 0.35 + near * 0.5);
        if (near > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (near * 0.25).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (near * 0.55).toFixed(2) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.px, mouse.py); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(232, 232, 236, ' + a.toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });

      // Connecting lines between close particles — the visible network
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var a = particles[i], b = particles[j];
          var dx = a.x - b.x, dy = a.y - b.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.strokeStyle = 'rgba(192, 192, 200, ' + (0.3 * (1 - d / 140)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(render);
    }
    function start() { if (!running) { running = true; render(); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    start();
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
  }
  initSilverCanvas();

  // Glass navbar on scroll
  var nav = document.getElementById('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  // Count-up animation for the stats numbers
  var stats = document.querySelectorAll('.stat strong');
  function animateStat(el) {
    var text = el.textContent.trim();
    var match = text.match(/^([\d.]+)(.*)$/);
    if (!match || reducedMotion) return;
    var target = parseFloat(match[1]);
    var suffix = match[2] || '';
    var decimals = (match[1].split('.')[1] || '').length;
    var start = null, duration = 1200;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { statObserver.observe(el); });
  }

  // Silver sparkles floating in the background
  if (!reducedMotion) {
    var ambient = document.querySelector('.ambient');
    if (ambient) {
      for (var i = 0; i < 14; i++) {
        var s = document.createElement('span');
        s.className = 'sparkle';
        s.style.left = (Math.random() * 96) + '%';
        s.style.top = (Math.random() * 96) + '%';
        s.style.animationDelay = (Math.random() * 3).toFixed(2) + 's';
        s.style.animationDuration = (2.4 + Math.random() * 2.4).toFixed(2) + 's';
        ambient.appendChild(s);
      }
    }
  }

  // Mouse-follow glow on skill and project cards
  document.querySelectorAll('.skill, .project').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });

  // Subtle tilt on project cards (desktop, pointer devices only)
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }
})();
