// Hero background: honeycomb cells flashing like a test run (pass = green, fail = red, running = signal colour).
// Lattice matches the CSS .hero-grid mask: 56x97 tile, pointy-top hexes, R = 56/sqrt(3).
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

  var DX = 56, DY = 48.5, R = 56 / Math.sqrt(3);
  var PASS = '80,250,123', FAIL = '255,85,85';
  var W = 0, H = 0, DPR = 1, rgb = '97,175,239', raf = 0, visible = true;
  var cells = [], lastSpawn = 0, hover = null;

  function readColour() {
    var hex = getComputedStyle(document.documentElement).getPropertyValue('--signal').trim().replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
    var n = parseInt(hex, 16);
    if (!isNaN(n)) rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(',');
  }

  function center(c, r) {
    return { x: c * DX + (r & 1 ? DX / 2 : 0), y: r * DY };
  }

  function hexPath(x, y, k) {
    var s = R * k;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 30);
      var px = x + s * Math.cos(a), py = y + s * Math.sin(a);
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function nearestCell(px, py) {
    var r0 = Math.round(py / DY), best = null, bd = 1e9;
    for (var r = r0 - 1; r <= r0 + 1; r++) {
      var c0 = Math.round((px - (r & 1 ? DX / 2 : 0)) / DX);
      for (var c = c0 - 1; c <= c0 + 1; c++) {
        var p = center(c, r), d = (p.x - px) * (p.x - px) + (p.y - py) * (p.y - py);
        if (d < bd) { bd = d; best = p; }
      }
    }
    return best;
  }

  function spawn(now) {
    var cols = Math.ceil(W / DX) + 1, rows = Math.ceil(H / DY) + 1;
    var p = center(Math.floor(Math.random() * cols), Math.floor(Math.random() * rows));
    var roll = Math.random();
    cells.push({
      x: p.x, y: p.y, born: now,
      life: 2400 + Math.random() * 1800,
      kind: roll < 0.14 ? 'fail' : roll < 0.6 ? 'pass' : 'run'
    });
  }

  function drawCell(cell, now) {
    var t = (now - cell.born) / cell.life;
    if (t < 0 || t > 1) return;
    var fade = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
    var settled = cell.kind !== 'run' && t >= 0.3;
    var col = settled ? (cell.kind === 'pass' ? PASS : FAIL) : rgb;
    hexPath(cell.x, cell.y, 0.92);
    ctx.fillStyle = 'rgba(' + col + ',' + (0.16 * fade).toFixed(3) + ')';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + col + ',' + (0.55 * fade).toFixed(3) + ')';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (!settled) return;
    ctx.strokeStyle = 'rgba(' + col + ',' + (0.85 * fade).toFixed(3) + ')';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (cell.kind === 'pass') {
      ctx.moveTo(cell.x - 8, cell.y); ctx.lineTo(cell.x - 2, cell.y + 7); ctx.lineTo(cell.x + 9, cell.y - 7);
    } else {
      ctx.moveTo(cell.x - 7, cell.y - 7); ctx.lineTo(cell.x + 7, cell.y + 7);
      ctx.moveTo(cell.x + 7, cell.y - 7); ctx.lineTo(cell.x - 7, cell.y + 7);
    }
    ctx.stroke();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < cells.length; i++) drawCell(cells[i], now);
    if (hover) {
      hexPath(hover.x, hover.y, 0.92);
      ctx.fillStyle = 'rgba(' + rgb + ',0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + rgb + ',0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function resize() {
    var r = hero.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cells = [];
    var now = performance.now(), seed = Math.round(Math.min(14, (W * H) / 60000));
    for (var i = 0; i < seed; i++) spawn(now - Math.random() * 2000);
    draw(now);
  }

  function tick(now) {
    raf = 0;
    cells = cells.filter(function (c) { return now - c.born < c.life; });
    var max = Math.round(Math.min(18, (W * H) / 45000)) + 2;
    if (now - lastSpawn > 260 && cells.length < max) { spawn(now); lastSpawn = now; }
    draw(now);
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
    hover = nearestCell(e.clientX - r.left, e.clientY - r.top);
    if (REDUCED) draw(performance.now());
  }, { passive: true });
  hero.addEventListener('pointerleave', function () {
    hover = null;
    if (REDUCED) draw(performance.now());
  });
  document.addEventListener('visibilitychange', kick);
  new MutationObserver(function () { readColour(); draw(performance.now()); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[e.length - 1].isIntersecting;
      kick();
    }).observe(hero);
  }
})();
