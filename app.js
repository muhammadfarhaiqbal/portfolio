// Muhammad Farhan Iqbal — portfolio interactions
// Small interactions only: smooth scroll, glass navbar on scroll,
// reveal-on-scroll, subtle tilt on project cards. No tracking.

(function () {
  'use strict';

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
