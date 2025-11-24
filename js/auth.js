// Credenciais
const CREDENTIALS = {
  username: 'demutran',
  password: 'osasco2025'
};

const SESSION_KEY = 'demutran_session';

// Função de login
function doLogin(username, password) {
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
    return true;
  }
  return false;
}

// Verificar se está autenticado
function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'authenticated';
}

// Logout
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Se estiver na página de login
if (document.querySelector('.login-page')) {
  // Verificar se já está autenticado
  if (isAuthenticated()) {
    window.location.href = 'menu.html';
  }

  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('loginError');

  function attemptLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (doLogin(username, password)) {
      window.location.href = 'menu.html';
    } else {
      errorDiv.textContent = '❌ Usuário ou senha incorretos!';
      errorDiv.classList.add('show');
      setTimeout(() => {
        errorDiv.classList.remove('show');
      }, 3000);
    }
  }

  loginBtn.addEventListener('click', attemptLogin);

  // Login com Enter
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        attemptLogin();
      }
    });
  });
}
