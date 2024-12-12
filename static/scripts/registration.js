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

// Функция для регистрации пользователя
async function registerUser(username, email, password) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Результат регистрации:', result);
        return result;
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, message: error.message };
    }
}

// Обработка регистрации
signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    console.log('Данные для отправки:', { username, email, password });

    if (!username || !email || !password) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    if (password.length < 6) {
        alert('Пароль должен содержать не менее 6 символов.');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        console.log('Ответ от сервера:', response);

        if (response.ok) {
            alert('Пользователь успешно зарегистрирован!');
        } else if (response.status === 409) {
            alert('Пользователь с таким именем или почтой уже существует.');
        } else {
            const result = await response.json();
            alert(`Ошибка: ${result.message}`);
        }
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        alert('Не удалось зарегистрировать пользователя. Попробуйте позже.');
    }
});



// Функция для входа пользователя
async function loginUser(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Результат входа:', result);
        return result;
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, message: error.message };
    }
}

// Обработка входа
signinForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value.trim();

    if (username && password) {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('username', username);
            window.location.href = '/main';
        } else {
            alert(result.message || 'Ошибка входа.');
        }
    } else {
        alert('Заполните все поля.');
    }
});
