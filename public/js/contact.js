(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = form.getAttribute('data-email');
    if (!to) return;
    var f = form.elements;
    var subject = f.subject.value.trim() || 'Message from ' + f.name.value.trim();
    var body = f.message.value + '\n\n' + f.name.value.trim() + '\n' + f.email.value.trim();
    window.location.href = 'mailto:' + encodeURIComponent(to) +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
