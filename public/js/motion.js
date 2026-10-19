// Public-site behaviour: scroll effects, reveals, pointer-driven card/grid/CTA motion.
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- Scroll: progress bar, nav border, back-to-top, active link ----------
  function initScroll() {
    var nav = document.querySelector('.site-nav');
    var bar = document.getElementById('scroll-progress');
    var topBtn = document.getElementById('back-to-top');
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav-menu] a[href^="#"]'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('header[id], section[id], footer[id]'));
    var ticking = false;

    function onFrame() {
      ticking = false;
      var y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 24);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (y / max) * 100 : 0;
        bar.style.width = pct.toFixed(2) + '%';
        if (topBtn) topBtn.style.setProperty('--sp', pct.toFixed(1) + '%');
      }
      if (topBtn) topBtn.classList.toggle('visible', y > 600);

      var line = y + window.innerHeight * 0.35;
      var current = null;
      sections.forEach(function (s) {
        if (s.offsetTop <= line) current = s;
      });
      links.forEach(function (l) {
        l.classList.toggle('active', !!current && l.getAttribute('href') === '#' + current.id);
      });
    }

    function queue() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onFrame);
      }
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    if (topBtn) {
      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      });
    }
    requestAnimationFrame(onFrame);
  }

  // ---------- Hero headline: words rise out of a mask ----------
  function splitHeadline() {
    var h1 = document.querySelector('.hero-title');
    if (!h1 || REDUCED) return;
    var words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute('aria-label', words.join(' '));
    h1.textContent = '';
    words.forEach(function (w, i) {
      var outer = document.createElement('span');
      outer.className = 'split-w';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.className = 'split-wi';
      inner.style.setProperty('--w', i);
      inner.textContent = w;
      outer.appendChild(inner);
      h1.appendChild(outer);
      if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
    });
    setTimeout(function () { h1.classList.add('is-done'); }, 900 + words.length * 70);
  }

  // ---------- Reveal on scroll ----------
  function initReveal() {
    if (REDUCED || !('IntersectionObserver' in window)) return;

    function finish(el) {
      el.classList.remove('rv', 'rv-in');
      el.style.removeProperty('--rv-delay');
    }

    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.style.setProperty('--rv-delay', Math.min(batch++, 6) * 80 + 'ms');
        el.classList.add('rv-in');
        el.addEventListener('transitionend', function done(e) {
          if (e.target !== el || e.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', done);
          finish(el);
        });
        setTimeout(function () { finish(el); }, 2000);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('section.block .card, .timeline-item, .pill-list').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('rv');
      io.observe(el);
    });
  }

  // ---------- Section titles: wipe + rule draw ----------
  function initSectionTitles() {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    // A clipped title never intersects, so its parent is observed instead.
    var byParent = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        byParent.get(e.target).classList.add('st-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    document.querySelectorAll('section.block h2').forEach(function (t) {
      if (t.getBoundingClientRect().top < window.innerHeight) return;
      t.classList.add('st-rv');
      byParent.set(t.parentElement, t);
      io.observe(t.parentElement);
    });
  }

  // ---------- Pointer effects (fine pointers, no reduced motion) ----------
  function initPointer() {
    if (REDUCED || !FINE) return;

    var hero = document.querySelector('.hero');
    var grid = hero && hero.querySelector('.hero-grid');
    if (grid) {
      var x = 0, y = 0, queued = false;
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        x = e.clientX - r.left;
        y = e.clientY - r.top;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          queued = false;
          grid.style.setProperty('--hx', x + 'px');
          grid.style.setProperty('--hy', y + 'px');
        });
      }, { passive: true });
      hero.addEventListener('pointerleave', function () {
        grid.style.setProperty('--hx', '-999px');
        grid.style.setProperty('--hy', '-999px');
      });
    }

    document.querySelectorAll('section.block .card').forEach(function (el) {
      el.classList.add('glow-track');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', e.clientX - r.left + 'px');
        el.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });

    var TILT = '.project-card, .achievement-card, .referee-card';
    var tiltEl = null;
    function resetTilt(c) {
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    }
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest(TILT);
      if (card !== tiltEl) {
        if (tiltEl) resetTilt(tiltEl);
        tiltEl = card;
        if (card) card.classList.add('tilt');
      }
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 4).toFixed(2) + 'deg');
      card.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 5).toFixed(2) + 'deg');
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
      if (tiltEl) { resetTilt(tiltEl); tiltEl = null; }
    });

    document.querySelectorAll('.btn:not(.secondary)').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.translate = (dx * 6).toFixed(1) + 'px ' + (dy * 5).toFixed(1) + 'px';
      });
      btn.addEventListener('pointerleave', function () { btn.style.translate = '0 0'; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initScroll();
    splitHeadline();
    initSectionTitles();
    initReveal();
    initPointer();
  });
})();
