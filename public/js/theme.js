(function () {
  var STORAGE_KEY = 'theme-preference-v2';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function updateLabels(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.textContent = theme === 'light' ? 'Dark mode' : 'Light mode';
    });
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateLabels(theme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateLabels(currentTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTheme(currentTheme() === 'light' ? 'dark' : 'light');
      });
    });
  });
})();
