const toggleButton = document.getElementById('toggle-button');
const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const mainPageLink = document.getElementById('main-page-link');

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




signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }

    if (username && password) {
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Пользователь зарегистрирован:', result);

            alert('Регистрация успешна!');
            toggleButton.click();
        } catch (error) {
            console.error('Ошибка при регистрации:', error);
            alert('Не удалось зарегистрировать пользователя.');
        }
    } else {
        alert('Заполните все поля.');
    }
});



signinForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('signin-username').value.trim();
    const password = document.getElementById('signin-password').value.trim();

    if (username && password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log('Вход выполнен:', result);

            if (result.success) {
                window.location.href = '/main';
            } else {
                alert('Неверное имя пользователя или пароль.');
            }
        } catch (error) {
            console.error('Ошибка при входе:', error);
            alert('Не удалось войти. Проверьте соединение с сервером.');
        }
    } else {
        alert('Заполните все поля.');
    }
});
