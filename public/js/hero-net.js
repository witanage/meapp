// Hero background: drifting node network drawn in the active theme's --signal colour.
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-net';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, DPR = 1, pts = [], rgb = '97,175,239', raf = 0, visible = true;
  var mouse = { x: -9999, y: -9999 };
  var LINK = 140;

  function readColour() {
    var hex = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim().replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    var n = parseInt(hex, 16);
    if (!isNaN(n)) rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var count = Math.round(Math.min(90, (W * H) / 16000));
    pts = [];
    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() < 0.15 ? 2.2 : 1.2
      });
    }
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      for (var j = i + 1; j < pts.length; j++) {
        var b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.16 * (1 - Math.sqrt(d) / LINK)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      var mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 180) {
        ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.4 * (1 - md / 180)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + rgb + ',' + (a.r > 2 ? 0.75 : 0.45) + ')';
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function tick() {
    raf = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
    }
    draw();
    kick();
  }

  function kick() {
    if (raf || REDUCED || !visible || document.hidden) return;
    raf = requestAnimationFrame(tick);
  }

  readColour();
  resize();
  kick();

  var rt = 0, lastW = W, lastH = H;
  function queueResize() {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var r = hero.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 1 && Math.abs(r.height - lastH) < 1) return;
      lastW = r.width; lastH = r.height;
      resize();
    }, 150);
  }
  if ('ResizeObserver' in window) new ResizeObserver(queueResize).observe(hero);
  else window.addEventListener('resize', queueResize, { passive: true });
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  document.addEventListener('visibilitychange', kick);
  new MutationObserver(function () { readColour(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[e.length - 1].isIntersecting;
      kick();
    }).observe(hero);
  }
})();
