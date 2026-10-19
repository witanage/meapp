// Applied synchronously in <head> to avoid a flash of the wrong theme.
(function () {
  var stored = localStorage.getItem('theme-preference-v2');
  var theme = stored === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
})();
