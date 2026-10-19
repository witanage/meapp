(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var modal = document.getElementById('contact-modal');
  var captchaEl = document.getElementById('contact-captcha');
  var captchaErr = document.getElementById('contact-captcha-error');
  var status = document.getElementById('contact-status');
  var success = document.getElementById('contact-success');
  var widgetId = null;
  var scriptLoading = false;
  var sending = false;

  function closeModal() { modal.hidden = true; captchaErr.textContent = ''; }

  function resetCaptcha() {
    if (window.grecaptcha && widgetId !== null) window.grecaptcha.reset(widgetId);
  }

  function send(token) {
    if (sending) return;
    sending = true;
    var f = form.elements;
    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: f.name.value,
        email: f.email.value,
        subject: f.subject.value,
        message: f.message.value,
        captchaToken: token,
      }),
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok) throw new Error(d.error || 'Could not send message.');
        });
      })
      .then(function () {
        form.reset();
        closeModal();
        resetCaptcha();
        success.hidden = false;
        document.getElementById('contact-success-close').focus();
      })
      .catch(function (err) {
        captchaErr.textContent = err.message;
        resetCaptcha();
      })
      .then(function () { sending = false; });
  }

  function renderWidget() {
    if (widgetId !== null) { window.grecaptcha.reset(widgetId); return; }
    widgetId = window.grecaptcha.render(captchaEl, {
      sitekey: captchaEl.getAttribute('data-sitekey'),
      theme: 'dark',
      callback: send,
    });
  }

  window.onContactRecaptchaLoad = function () { window.grecaptcha.ready(renderWidget); };

  function loadCaptcha() {
    if (!captchaEl.getAttribute('data-sitekey')) {
      captchaErr.textContent = 'Captcha is not configured (missing RECAPTCHA_SITE_KEY).';
      return;
    }
    if (window.grecaptcha && window.grecaptcha.render) return renderWidget();
    if (scriptLoading) return;
    scriptLoading = true;
    var s = document.createElement('script');
    s.src = 'https://www.google.com/recaptcha/api.js?onload=onContactRecaptchaLoad&render=explicit';
    s.async = true;
    s.onerror = function () { scriptLoading = false; captchaErr.textContent = 'Captcha failed to load.'; };
    document.head.appendChild(s);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';
    status.style.color = '';
    if (!form.checkValidity()) { form.reportValidity(); return; }
    modal.hidden = false;
    loadCaptcha();
  });

  function closeSuccess() { success.hidden = true; }
  document.getElementById('contact-success-close').addEventListener('click', closeSuccess);
  success.addEventListener('click', function (e) { if (e.target === success) closeSuccess(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !success.hidden) closeSuccess(); });
  document.getElementById('contact-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
})();
