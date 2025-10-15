// API Base URL
const API_URL = window.location.origin;

// Toggle between login and register forms
function toggleForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const formTitle = document.getElementById('form-title');
    const toggleBtn = document.getElementById('toggle-btn');

    if (loginForm.classList.contains('hidden')) {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        formTitle.textContent = 'Entrar no Sistema';
        toggleBtn.textContent = 'crie uma nova conta';
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        formTitle.textContent = 'Criar Nova Conta';
        toggleBtn.textContent = 'já tenho uma conta';
    }

    // Hide any error messages
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('register-error').classList.add('hidden');
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const errorDiv = document.getElementById('login-error');
    const errorMsg = document.getElementById('login-error-message');

    try {
        const response = await fetch(`${API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.json();

        if (response.ok) {
            // Save token
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_type', data.token_type);

            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            errorMsg.textContent = data.detail || 'Erro ao fazer login. Verifique suas credenciais.';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorMsg.textContent = 'Erro de conexão com o servidor.';
        errorDiv.classList.remove('hidden');
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById('register-fullname').value;
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    const errorDiv = document.getElementById('register-error');
    const errorMsg = document.getElementById('register-error-message');

    try {
        const response = await fetch(`${API_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                full_name: fullName,
                username: username,
                email: email,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Registration already returns a token, use it directly
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_type', data.token_type);
            window.location.href = '/dashboard.html';
        } else {
            errorMsg.textContent = data.detail || 'Erro ao criar conta. Tente novamente.';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        errorMsg.textContent = 'Erro de conexão com o servidor.';
        errorDiv.classList.remove('hidden');
    }
}

// Check if already logged in
if (localStorage.getItem('access_token')) {
    window.location.href = '/dashboard.html';
}
