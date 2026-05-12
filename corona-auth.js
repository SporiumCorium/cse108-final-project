(function () {
  function getFields() {
    return {
      username: document.getElementById('username'),
      password: document.getElementById('password'),
      error: document.getElementById('error-msg'),
      loginButton: document.getElementById('login-btn'),
      registerButton: document.getElementById('register-btn')
    };
  }

  function setMessage(errorEl, message, isError) {
    errorEl.textContent = message;
    errorEl.style.color = isError ? '#b03a2e' : '#2e7d32';
    errorEl.classList.add('show');
  }

  function setBusy(fields, isBusy, label) {
    fields.loginButton.disabled = isBusy;
    fields.registerButton.disabled = isBusy;
    fields.loginButton.textContent = isBusy && label === 'login' ? 'Verifying...' : 'Log In';
    fields.registerButton.textContent = isBusy && label === 'register' ? 'Saving...' : 'Register';
  }

  function readCredentials(fields) {
    return {
      username: fields.username.value.trim(),
      password: fields.password.value.trim()
    };
  }

  function requireCredentials(fields) {
    var credentials = readCredentials(fields);
    if (!credentials.username || !credentials.password) {
      setMessage(fields.error, 'Please fill in all fields.', true);
      return null;
    }
    return credentials;
  }

  function parseResponse(response) {
    return response.json().catch(function () {
      return {};
    }).then(function (data) {
      if (!response.ok || !data.success) {
        throw new Error((data && data.message) || 'Request failed.');
      }
      return data;
    });
  }

  function goToUsersPage(data) {
    var params = new URLSearchParams({
      userId: String(data.userId || ''),
      username: data.username || ''
    });
    window.location.href = 'users.html?' + params.toString();
  }

  function login() {
    var fields = getFields();
    var credentials = requireCredentials(fields);
    if (!credentials) return;

    fields.error.classList.remove('show');
    setBusy(fields, true, 'login');

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
      .then(parseResponse)
      .then(goToUsersPage)
      .catch(function (error) {
        setMessage(fields.error, error.message || 'Login failed. Please try again.', true);
        if (window.triggerHelper) window.triggerHelper();
      })
      .finally(function () {
        setBusy(fields, false);
      });
  }

  function register() {
    var fields = getFields();
    var credentials = requireCredentials(fields);
    if (!credentials) return;

    fields.error.classList.remove('show');
    setBusy(fields, true, 'register');

    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
      .then(parseResponse)
      .then(function () {
        setMessage(fields.error, 'Account registered. You can log in now.', false);
      })
      .catch(function (error) {
        setMessage(fields.error, error.message || 'Registration failed. Please try again.', true);
      })
      .finally(function () {
        setBusy(fields, false);
      });
  }

  var fields = getFields();
  if (!fields.loginButton || !fields.registerButton) return;

  fields.loginButton.addEventListener('click', function (event) {
    event.preventDefault();
    login();
  });

  fields.registerButton.addEventListener('click', function (event) {
    event.preventDefault();
    register();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      login();
    }
  });
})();
