(function () {
  function apiLogin() {
    var u = document.getElementById('username').value.trim();
    var p = document.getElementById('password').value.trim();
    var err = document.getElementById('error-msg');
    var btn = document.getElementById('login-btn');
    if (!u || !p) {
      err.textContent = 'Please fill in all fields.';
      err.classList.add('show');
      return;
    }
    err.classList.remove('show');
    btn.textContent = 'Verifying...';
    btn.disabled = true;
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    })
      .then(function (response) {
        return response.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!response.ok || !data.success) {
            var message =
              (data && data.message) ||
              'ACCESS DENIED — Invalid credentials';
            throw new Error(message);
          }
          var params = new URLSearchParams({
            userId: String(data.userId || ''),
            username: data.username || ''
          });
          window.location.href = 'homepage.html?' + params.toString();
        });
      })
      .catch(function (error) {
        err.textContent = error.message || 'Login failed. Please try again.';
        err.classList.add('show');
        if (window.triggerHelper) window.triggerHelper();
      })
      .finally(function () {
        btn.textContent = 'Log In';
        btn.disabled = false;
      });
  }

  var btn = document.getElementById('login-btn');
  if (!btn) return;

  btn.addEventListener(
    'click',
    function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      apiLogin();
    },
    true
  );

  document.addEventListener(
    'keydown',
    function (e) {
      if (e.key !== 'Enter') return;
      e.stopImmediatePropagation();
      apiLogin();
    },
    true
  );
})();
