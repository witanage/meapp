// Simulated QA automation CI/CD: one build flows commit -> build -> test stages -> gate -> release.
// Failures drop into the defect tracker; results feed the report and trend chart.
(function () {
  'use strict';

  var host = document.getElementById('qa-graphs');
  if (!host) return;

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var W = 900, H = 350;
  var NW = 94, NH = 62, GAP = 18, X0 = (W - (8 * NW + 7 * GAP)) / 2, NY = 36;

  var STAGES = [
    { t: 'Commit', s: 'PR merged', n: 0, d: 0.7 },
    { t: 'Build', s: 'Docker image', n: 0, d: 0.9 },
    { t: 'Unit', s: 'Jest / JUnit', n: 420, d: 1.0 },
    { t: 'API', s: 'REST suite', n: 180, d: 1.1 },
    { t: 'UI E2E', s: 'Playwright', n: 64, d: 1.7 },
    { t: 'Regression', s: 'Full pack', n: 240, d: 1.4 },
    { t: 'Gate', s: 'Pass >= 95%', n: 0, d: 0.8 },
    { t: 'Release', s: 'Deploy', n: 0, d: 0.9 }
  ];
  var BUGS = [null, 'build: lockfile drift', 'unit: null total in cart', 'api: 500 on /orders', 'ui: checkout flow timeout', 'reg: invoice rounding'];
  var BROWSERS = ['Chrome', 'Firefox', 'WebKit'];
  var TOTAL = STAGES.reduce(function (a, s) { return a + s.n; }, 0);
  var TREND_N = 20;
  var TX = 330, TY = 206, TW = 290, TH = 110;

  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, str, cls) {
    var t = el('text', { x: x, y: y, class: 'qa-t ' + (cls || '') }, parent);
    t.textContent = str;
    return t;
  }

  host.innerHTML =
    '<div class="qa-bar">' +
      '<div class="qa-hud">' +
        '<span>build <b class="h-run">#128</b></span>' +
        '<span>tests <b class="h-tests">0</b></span>' +
        '<span>pass rate <b class="h-rate">0%</b></span>' +
        '<span>open defects <b class="h-open">0</b></span>' +
      '</div>' +
      '<div class="qa-bar-right">' +
        '<span class="qa-live"><i class="qa-dot"></i> live</span>' +
        '<button type="button" class="qa-btn qa-fail">Inject failure</button>' +
        '<button type="button" class="qa-btn qa-pause" aria-pressed="false">Pause</button>' +
      '</div>' +
    '</div>' +
    '<div class="qa-stage"></div>' +
    '<p class="qa-note">Simulated data: shows how I wire test automation into CI/CD, not real results.</p>';

  var q = function (s) { return host.querySelector(s); };
  var hud = { run: q('.h-run'), tests: q('.h-tests'), rate: q('.h-rate'), open: q('.h-open') };
  var svg = el('svg', { class: 'qa-svg', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' }, q('.qa-stage'));

  // ---- pipeline nodes and links ----
  var cx = function (i) { return X0 + i * (NW + GAP) + NW / 2; };
  for (var i = 0; i < 7; i++) {
    el('line', { x1: cx(i) + NW / 2, y1: NY + NH / 2, x2: cx(i + 1) - NW / 2, y2: NY + NH / 2, class: 'qa-link' }, svg);
  }
  var nodes = STAGES.map(function (s, i) {
    var g = el('g', { class: 'qa-node' }, svg);
    var x = cx(i) - NW / 2;
    el('rect', { x: x, y: NY, width: NW, height: NH, rx: 10, class: 'qa-box' }, g);
    txt(g, cx(i), NY + 20, s.t, 'qa-title qa-c');
    txt(g, cx(i), NY + 34, s.s, 'qa-sub qa-c');
    el('rect', { x: x + 10, y: NY + NH - 14, width: NW - 20, height: 4, rx: 2, class: 'qa-track' }, g);
    var bar = el('rect', { x: x + 10, y: NY + NH - 14, width: 0, height: 4, rx: 2, class: 'qa-fill' }, g);
    var cnt = txt(g, cx(i), NY + NH + 14, s.n ? '0 / ' + s.n : '', 'qa-sub qa-c');
    return { g: g, bar: bar, cnt: cnt, w: NW - 20 };
  });

  // browser matrix runs in parallel under UI E2E
  var chips = BROWSERS.map(function (b, i) {
    var g = el('g', { class: 'qa-chip' }, svg);
    el('rect', { x: cx(4) - 36, y: NY + NH + 26 + i * 15, width: 72, height: 12, rx: 6, class: 'qa-chip-bg' }, g);
    txt(g, cx(4), NY + NH + 35 + i * 15, b, 'qa-c qa-chip-t');
    return g;
  });

  // ---- bottom panels ----
  function panel(x, w, title) {
    el('rect', { x: x, y: 172, width: w, height: 166, rx: 12, class: 'qa-panel' }, svg);
    txt(svg, x + 14, 192, title, 'qa-title');
  }
  panel(12, 300, 'Test report');
  panel(TX - 14, TW + 28, 'Pass-rate trend');
  panel(646, 242, 'Defect tracker');

  var rp = el('rect', { x: 26, y: 206, width: 0, height: 10, rx: 3, class: 'qa-ok' }, svg);
  var rs = el('rect', { x: 26, y: 206, width: 0, height: 10, class: 'qa-warn' }, svg);
  var rf = el('rect', { x: 26, y: 206, width: 0, height: 10, rx: 3, class: 'qa-bad' }, svg);
  var rep = {
    pass: txt(svg, 26, 240, 'passed 0', 'qa-big qa-okt'),
    fail: txt(svg, 26, 262, 'failed 0', 'qa-sub qa-badt'),
    flaky: txt(svg, 26, 278, 'flaky 0', 'qa-sub qa-warnt'),
    dur: txt(svg, 26, 294, 'duration 0m 00s', 'qa-sub'),
    cov: txt(svg, 26, 310, 'coverage 84%', 'qa-sub')
  };
  txt(svg, 190, 240, 'Allure + HTML', 'qa-sub');
  txt(svg, 190, 254, 'report published', 'qa-sub');

  el('line', { x1: TX, y1: TY + TH * 0.25, x2: TX + TW, y2: TY + TH * 0.25, class: 'qa-target' }, svg);
  txt(svg, TX + TW, TY + TH * 0.25 - 4, '95% gate', 'qa-sub qa-end');
  var area = el('path', { class: 'qa-area' }, svg);
  var line = el('path', { class: 'qa-line' }, svg);
  var tip = el('circle', { r: 3.5, class: 'qa-tip' }, svg);
  var yOf = function (p) { return TY + TH - ((clamp(p, 80, 100) - 80) / 20) * TH; };

  var defects = { open: 3, list: ['ui: date picker locale', 'api: 429 not retried', 'reg: stale cache key'] };
  var defNum = txt(svg, 664, 240, '3', 'qa-num');
  txt(svg, 700, 238, 'open', 'qa-sub');
  var defRows = [0, 1, 2].map(function (k) { return txt(svg, 664, 268 + k * 18, '', 'qa-sub'); });
  var defBox = { x: 646 + 121, y: 172 };

  // ---- packet (one build moving through the pipeline) ----
  var halo = el('circle', { r: 11, class: 'qa-pkt-halo' }, svg);
  var pkt = el('circle', { r: 6, class: 'qa-pkt' }, svg);
  var pkx = cx(0), pky = NY + NH / 2;

  // ---- state ----
  var series = [];
  for (var s = 0; s < TREND_N; s++) series.push(clamp(93 + Math.sin(s / 2.5) * 2.5 + rand(-1.5, 1.5), 84, 99));
  var runNo = 128, passed = 0, failed = 0, flaky = 0, secs = 0, coverage = 84;
  var b = null, forceFail = false;
  var paused = false, visible = true, raf = 0, last = 0;

  function setPkt(x, y) {
    pkx = x; pky = y;
    [pkt, halo].forEach(function (c) { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); });
    followPacket(x);
  }

  // On narrow screens the stage scrolls sideways; keep the packet in view unless the user is scrolling.
  var stageEl = q('.qa-stage'), userScrollUntil = 0;
  ['touchstart', 'wheel', 'pointerdown'].forEach(function (ev) {
    stageEl.addEventListener(ev, function () { userScrollUntil = performance.now() + 4000; }, { passive: true });
  });
  function followPacket(x) {
    var over = stageEl.scrollWidth - stageEl.clientWidth;
    if (over <= 0 || performance.now() < userScrollUntil) return;
    var target = clamp((x / W) * svg.clientWidth - stageEl.clientWidth / 2, 0, over);
    stageEl.scrollLeft += (target - stageEl.scrollLeft) * 0.15;
  }
  function setPktState(cls) {
    pkt.setAttribute('class', 'qa-pkt ' + cls);
    halo.setAttribute('class', 'qa-pkt-halo ' + cls);
  }

  function renderTrend() {
    var step = TW / (TREND_N - 1);
    var d = series.map(function (v, i) { return (i ? 'L' : 'M') + (TX + i * step).toFixed(1) + ' ' + yOf(v).toFixed(1); }).join(' ');
    line.setAttribute('d', d);
    area.setAttribute('d', d + ' L' + (TX + TW) + ' ' + (TY + TH) + ' L' + TX + ' ' + (TY + TH) + ' Z');
    tip.setAttribute('cx', TX + TW);
    tip.setAttribute('cy', yOf(series[series.length - 1]).toFixed(1));
  }

  function renderReport() {
    var tot = Math.max(1, passed + failed + flaky), wFull = 272;
    var wp = (passed / tot) * wFull, ws = (flaky / tot) * wFull, wf = (failed / tot) * wFull;
    rp.setAttribute('width', wp.toFixed(1));
    rs.setAttribute('x', (26 + wp).toFixed(1)); rs.setAttribute('width', ws.toFixed(1));
    rf.setAttribute('x', (26 + wp + ws).toFixed(1)); rf.setAttribute('width', wf.toFixed(1));
    rep.pass.textContent = 'passed ' + passed;
    rep.fail.textContent = 'failed ' + failed;
    rep.flaky.textContent = 'flaky ' + flaky;
    rep.dur.textContent = 'duration ' + Math.floor(secs / 60) + 'm ' + String(Math.floor(secs % 60)).padStart(2, '0') + 's';
    rep.cov.textContent = 'coverage ' + Math.round(coverage) + '%';
  }

  function renderHud() {
    var done = passed + failed + flaky;
    hud.run.textContent = '#' + runNo;
    hud.tests.textContent = done + ' / ' + TOTAL;
    hud.rate.textContent = (done ? (passed / done) * 100 : series[series.length - 1]).toFixed(1) + '%';
    hud.open.textContent = defects.open;
    defNum.textContent = defects.open;
    defRows.forEach(function (r, i) { r.textContent = defects.list[i] ? '- ' + defects.list[i] : ''; });
  }

  function startBuild() {
    runNo++;
    passed = failed = flaky = 0; secs = 0;
    nodes.forEach(function (n, i) {
      n.g.setAttribute('class', 'qa-node');
      n.bar.setAttribute('width', 0);
      if (STAGES[i].n) n.cnt.textContent = '0 / ' + STAGES[i].n;
    });
    chips.forEach(function (c) { c.setAttribute('class', 'qa-chip'); });
    setPktState('');
    var failAt = -1;
    if (forceFail || Math.random() < 0.28) failAt = 1 + Math.floor(Math.random() * 5);
    forceFail = false;
    b = { i: 0, mode: 'work', t: 0, failAt: failAt, wps: null };
    setPkt(cx(0), NY + NH / 2);
    nodes[0].g.classList.add('is-work');
  }

  function finishStage() {
    var i = b.i, n = STAGES[i].n, node = nodes[i];
    node.g.classList.remove('is-work');
    if (i === b.failAt) {
      var bad = n ? Math.max(1, Math.round(n * rand(0.04, 0.12))) : 0;
      passed += n - bad; failed += bad;
      if (n) node.cnt.textContent = (n - bad) + ' / ' + n;
      node.g.classList.add('is-fail');
      chips.forEach(function (c) { c.classList.remove('is-run'); });
      setPktState('is-bad');
      b.mode = 'fail';
      b.wps = [[cx(i), 160], [defBox.x, 160], [defBox.x, defBox.y + 4]];
      return;
    }
    var fl = i === 4 && Math.random() < 0.4 ? 1 : 0;
    flaky += fl; passed += n - fl;
    if (n) node.cnt.textContent = n + ' / ' + n;
    node.g.classList.add('is-pass');
    if (i === 4) chips.forEach(function (c) { c.classList.remove('is-run'); c.classList.add('is-pass'); });
    if (i === STAGES.length - 1) {
      series.push(clamp(97 + rand(-1.2, 2.5), 90, 100)); series.shift();
      renderTrend();
      setPktState('is-ok');
      b.mode = 'done'; b.t = 0;
      return;
    }
    b.i++;
    b.mode = 'move';
  }

  function onDefect() {
    defects.open++;
    defects.list.unshift(BUGS[b.failAt] || 'unclassified failure');
    defects.list = defects.list.slice(0, 3);
    series.push(clamp(passed / Math.max(1, passed + failed + flaky) * 100, 82, 99)); series.shift();
    coverage = clamp(coverage + rand(-0.8, 0.6), 78, 92);
    renderTrend();
    b.mode = 'wait'; b.t = 0;
  }

  function step(dt) {
    if (!b) { startBuild(); return; }
    if (b.mode === 'work' || b.mode === 'move') secs += dt * 28;
    if (b.mode === 'work') {
      b.t += dt;
      var i = b.i, p = clamp(b.t / STAGES[i].d, 0, 1), node = nodes[i];
      node.bar.setAttribute('width', (node.w * p).toFixed(1));
      if (STAGES[i].n) node.cnt.textContent = Math.round(STAGES[i].n * p) + ' / ' + STAGES[i].n;
      if (i === 4) chips.forEach(function (c, k) { c.classList.toggle('is-run', p > k * 0.15 && p < 1); });
      if (p >= 1) finishStage();
    } else if (b.mode === 'move') {
      var dx = cx(b.i) - pkx, sp = 340 * dt;
      if (Math.abs(dx) <= sp) {
        setPkt(cx(b.i), NY + NH / 2);
        b.mode = 'work'; b.t = 0;
        nodes[b.i].g.classList.add('is-work');
      } else setPkt(pkx + Math.sign(dx) * sp, pky);
    } else if (b.mode === 'fail') {
      var w = b.wps[0], ddx = w[0] - pkx, ddy = w[1] - pky, dist = Math.hypot(ddx, ddy), mv = 300 * dt;
      if (dist <= mv) {
        setPkt(w[0], w[1]);
        b.wps.shift();
        if (!b.wps.length) onDefect();
      } else setPkt(pkx + (ddx / dist) * mv, pky + (ddy / dist) * mv);
    } else {
      b.t += dt;
      if (b.t > (b.mode === 'done' ? 2.2 : 1.8)) b = null;
    }
    renderReport();
    renderHud();
  }

  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    try { step(dt); } finally {
      if (!paused && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
  }

  function kick() {
    if (raf || REDUCED || paused || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // ---- boot ----
  renderTrend();
  if (REDUCED) {
    nodes.forEach(function (n, i) {
      n.g.classList.add('is-pass');
      n.bar.setAttribute('width', n.w);
      if (STAGES[i].n) n.cnt.textContent = STAGES[i].n + ' / ' + STAGES[i].n;
    });
    passed = TOTAL - 1; flaky = 1; secs = 252;
    setPkt(cx(7), NY + NH / 2);
    setPktState('is-ok');
    renderReport();
    renderHud();
  } else {
    renderReport();
    renderHud();
    kick();
  }

  q('.qa-fail').addEventListener('click', function () { forceFail = true; });
  var pauseBtn = q('.qa-pause');
  pauseBtn.addEventListener('click', function () {
    paused = !paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.textContent = paused ? 'Play' : 'Pause';
    host.classList.toggle('is-paused', paused);
    kick();
  });
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[e.length - 1].isIntersecting;
      kick();
    }).observe(host);
  }
})();
