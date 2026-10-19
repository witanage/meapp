(function () {
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-copy-credential]');
    if (!button) return;

    var row = button.closest('.credential-copy');
    var credentialId = row.querySelector('.credential-id').textContent.trim();
    var status = row.querySelector('.copy-status');

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      status.textContent = 'Copy unavailable. Select and copy the ID.';
      return;
    }

    navigator.clipboard.writeText(credentialId).then(function () {
      button.classList.add('is-copied');
      button.setAttribute('aria-label', 'Credential ID copied');
      status.textContent = 'Copied';

      window.setTimeout(function () {
        button.classList.remove('is-copied');
        button.setAttribute('aria-label', 'Copy credential ID');
        status.textContent = '';
      }, 1800);
    }).catch(function () {
      status.textContent = 'Copy failed. Select and copy the ID.';
    });
  });
})();
