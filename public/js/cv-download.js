(function () {
  var openBtn = document.getElementById('cv-open');
  if (!openBtn) return;
  var modal = document.getElementById('cv-modal');
  var form = document.getElementById('cv-form');
  var captchaEl = document.getElementById('cv-captcha');
  var errorEl = document.getElementById('cv-error');
  var token = '';
  var widgetId = null;
  var scriptLoading = false;
  var submitBtn = form.querySelector('button[type="submit"]');
  var loader = document.createElement('div');
  loader.className = 'loader-row';
  loader.setAttribute('role', 'status');
  loader.hidden = true;
  loader.innerHTML = '<span class="spinner"></span><span>Loading captcha...</span>';
  captchaEl.parentNode.insertBefore(loader, captchaEl);
  var downloading = false;

  function renderWidget() {
    loader.hidden = true;
    if (widgetId !== null) { window.grecaptcha.reset(widgetId); token = ''; return; }
    widgetId = window.grecaptcha.render(captchaEl, {
      sitekey: captchaEl.getAttribute('data-sitekey'),
      theme: 'dark',
      callback: function (t) { token = t; },
      'expired-callback': function () { token = ''; },
      'error-callback': function () { token = ''; },
    });
  }

  window.onRecaptchaLoad = function () { window.grecaptcha.ready(renderWidget); };

  function loadCaptcha() {
    if (!captchaEl.getAttribute('data-sitekey')) {
      errorEl.textContent = 'Captcha is not configured (missing RECAPTCHA_SITE_KEY).';
      return;
    }
    if (window.grecaptcha && window.grecaptcha.render) return renderWidget();
    if (scriptLoading) return;
    scriptLoading = true;
    loader.hidden = false;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    s.async = true;
    s.onerror = function () { scriptLoading = false; loader.hidden = true; errorEl.textContent = 'Captcha failed to load.'; };
    document.head.appendChild(s);
  }

  function close() { modal.hidden = true; errorEl.textContent = ''; openBtn.focus(); }

  openBtn.addEventListener('click', function () {
    modal.hidden = false;
    loadCaptcha();
    form.elements.email.focus();
  });
  document.getElementById('cv-cancel').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorEl.textContent = '';
    if (!token) { errorEl.textContent = 'Please complete the captcha.'; return; }
    if (downloading) return;
    downloading = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'Downloading...';
    fetch('/cv/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.elements.email.value, captchaToken: token }),
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (d) { throw new Error(d.error || 'Download failed.'); });
        }
        return r.blob();
      })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'Chinthaka_Withanage_CV.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        form.reset();
        close();
      })
      .catch(function (err) {
        errorEl.textContent = err.message;
        if (window.grecaptcha && widgetId !== null) { window.grecaptcha.reset(widgetId); token = ''; }
      })
      .then(function () {
        downloading = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'Download';
      });
  });
})();
