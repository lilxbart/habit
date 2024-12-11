const toggleButton = document.getElementById('toggle-button');
const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');

// Переключение между формами регистрации и входа
toggleButton.addEventListener('click', function () {
    if (!signupForm.classList.contains('hidden')) {
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
        toggleButton.textContent = 'Перейти к регистрации';
    } else {
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        toggleButton.textContent = 'Перейти к входу в систему';
    }
});

// Обработка входа
signinForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    if (username && password) {
        const response = await loginUser(username, password);

        if (response.success) {
            // Сохраняем имя пользователя в localStorage (опционально)
            localStorage.setItem('username', username);
            // Перенаправляем на страницу main
            window.location.href = '/main';
        } else {
            alert('Ошибка входа: ' + response.message);
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
});

// Функция для регистрации пользователя
async function registerUser(username, email, password) {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    return response.json();
}

// Функция для входа пользователя
async function loginUser(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return response.json();
}

// Обработка регистрации
signinForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    if (username && password) {
        const response = await loginUser(username, password);

        if (response.success) {
            // Сохраняем user_id в localStorage
            localStorage.setItem('user_id', response.user_id);
            window.location.href = '/main';
        } else {
            alert('Ошибка входа: ' + response.message);
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
});
