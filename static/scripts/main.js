const modal = document.getElementById('habit-modal');
const addHabitButton = document.getElementById('add-habit-button');
const closeButton = document.querySelector('.close-button');
const submitHabitButton = document.getElementById('submit-habit');
const habitsContainer = document.getElementById('habits-container');
const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
let habitsData = {};
let currentDate = new Date();
let currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
let selectedDate = getLocalDate(currentDate);

function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}



// Инициализация отображения привычек при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const today = getLocalDate(); // Получаем локальную дату
    selectedDate = today;

    // Находим и выделяем текущий день в календаре
    const activeDayElement = document.querySelector(`.day[data-date="${selectedDate}"]`);
    if (activeDayElement) {
        document.querySelectorAll('.day').forEach(day => day.classList.remove('selected'));
        activeDayElement.classList.add('selected');
        activeDayElement.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    } else {
        console.error('Не удалось найти текущий день в календаре');
    }

    setupDateSelection(); // Установка обработчиков выбора даты
    displayHabitsForSelectedDate(); // Отображение привычек для выбранного дня
});

// Обновление привычек при выборе даты
function setupDateSelection() {
    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', (event) => {
            event.preventDefault(); // Предотвращаем стандартное поведение
            selectedDate = day.getAttribute('data-date');
            
            // Убираем выделение со всех дней
            document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
            
            // Выделяем выбранный день
            day.classList.add('selected');
            displayHabitsForSelectedDate();
        });
    });
}




function getDayIndex(date) {
    const jsDayIndex = date.getDay();
    return jsDayIndex === 0 ? 6 : jsDayIndex - 1;
}

function updateCurrentMonth() {
    const currentMonthElement = document.getElementById('current-month');
    const monthName = monthNames[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    currentMonthElement.textContent = `${monthName} ${year}`;
}

// Обновление календаря с правильным выбором текущего дня
function updateCalendar() {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = ''; // Очищаем календарь

    updateCurrentMonth();

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayElement = createDayElement(date);
        calendarContainer.appendChild(dayElement);

        // Если текущая дата, выделяем её
        if (getLocalDate(date) === selectedDate) {
            dayElement.classList.add('selected');
        }
    }
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');

    const localDate = getLocalDate(date); // Получаем локальную дату
    dayElement.setAttribute('data-date', localDate);

    const dayIndex = (date.getDay() + 6) % 7; // Индекс дня недели (ПН = 0, ВС = 6)
    const dayName = daysOfWeek[dayIndex];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    dayElement.innerHTML = `
        ${dayName}<br><span>${day}.${month}</span>
    `;

    dayElement.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach((d) => d.classList.remove('selected'));
        dayElement.classList.add('selected');
        selectedDate = localDate; // Устанавливаем локальную дату как выбранную
        displayHabitsForSelectedDate();
    });

    return dayElement;
}

document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCalendar();
});

document.addEventListener('DOMContentLoaded', () => {
    updateCalendar();
    displayHabitsForSelectedDate();
});

//текущей даты в заголовке
function setCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    const today = new Date();

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('ru-RU', options);

    currentDateElement.textContent = formattedDate;
}

setCurrentDate();
updateCalendar();














//ПРИВЫЧКИ создание
addHabitButton.addEventListener('click', () => {
    if (selectedDate) {
        modal.style.display = 'flex';
    } else {
        alert("Пожалуйста, выберите дату, прежде чем добавлять привычку.");
    }
});

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Обработчики для выбора дней в модальном окне
const recurrenceButtons = document.querySelectorAll('.habit-recurrence button');
let selectedDays = [];

recurrenceButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); // Предотвращаем стандартное поведение
        event.stopPropagation(); // Останавливаем всплытие событий

        const day = button.textContent;

        // Добавляем или удаляем день из выбранных
        if (selectedDays.includes(day)) {
            selectedDays = selectedDays.filter(selectedDay => selectedDay !== day);
            button.classList.remove('selected');
        } else {
            selectedDays.push(day);
            button.classList.add('selected');
        }
    });
});


//форма новой привычки
submitHabitButton.addEventListener('click', async () => {
    const habitName = document.getElementById('habit-name').value.trim();
    const habitDescription = document.getElementById('habit-description').value.trim();
    const reminder = document.getElementById('habit-reminder').checked;
    const time = document.getElementById('habit-time').value;
    const startDate = selectedDate;

    if (!habitName) {
        alert('Введите название привычки!');
        return;
    }

    const newHabit = {
        user_id: localStorage.getItem('user_id'),
        name: habitName,
        description: habitDescription,
        reminder_text: reminder ? `Напоминание: ${time}` : null,
        recurrence: selectedDays.join(', ') || 'Нет',
        startDate: startDate
    };

    try {
        const response = await fetch('/api/habits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newHabit),
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Привычка успешно добавлена:', result);

        // Закрываем модальное окно
        modal.style.display = 'none';
    } catch (error) {
        console.error('Ошибка при отправке привычки:', error);
        alert('Не удалось добавить привычку. Проверьте настройки сервера.');
    }
});


document.addEventListener('DOMContentLoaded', function () {
    const userNicknameElement = document.getElementById('user-nickname');
    const username = localStorage.getItem('username');

    if (username) {
        userNicknameElement.textContent = username;
    } else {
        console.error('Имя пользователя не найдено в localStorage.');
    }
});









//ПРИВЫЧКИ отображение
// Получение локальной даты в формате YYYY-MM-DD
function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Функция для получения привычек с сервера
async function fetchHabits(userId) {
    try {
        const response = await fetch(`/api/habits/${userId}`);
        if (!response.ok) throw new Error('Ошибка при загрузке привычек');
        const data = await response.json();
        return data.habits || [];
    } catch (error) {
        console.error('Ошибка:', error);
        return [];
    }
}

// Логика отображения привычек для выбранной даты
async function displayHabitsForSelectedDate() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return console.error('Не найден user_id');

    const habits = await fetchHabits(userId);

    const habitsContainer = document.getElementById('habits-container');
    habitsContainer.innerHTML = ''; // Очистка контейнера

    const today = getLocalDate();

    habits.forEach(habit => {
        const habitDates = getDatesFromRecurrence(habit.recurrence || '');
        const habitStartDate = habit.date_created.split(' ')[0]; // Дата создания из API

        // Проверяем, должна ли привычка отображаться
        if (
            (habitDates.includes(selectedDate) && selectedDate >= habitStartDate) ||
            (habit.recurrence === 'Каждый день' && selectedDate >= habitStartDate)
        ) {
            const habitElement = createHabitElement(habit, selectedDate === today);
            habitsContainer.appendChild(habitElement);
        }
    });
}

// Функция создания элемента привычки
function createHabitElement(habit, isToday) {
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    if (habit.completed) habitDiv.classList.add('completed');

    habitDiv.innerHTML = `
        <div class="habit-info">
            <h3 class="habit-name">${habit.name}</h3>
            <p class="habit-description">${habit.description || ''}</p>
        </div>
        <div class="habit-actions">
            ${isToday ? `<button class="complete-habit" data-id="${habit.id}">✅</button>` : ''}
            ${isToday ? `<button class="delete-habit" data-id="${habit.id}">❌</button>` : ''}
        </div>
    `;

    if (isToday) {
        habitDiv.querySelector('.complete-habit').addEventListener('click', () => toggleHabitComplete(habit.id, habitDiv));
        habitDiv.querySelector('.delete-habit').addEventListener('click', () => confirmDeleteHabit(habit.id));
    }

    return habitDiv;
}

// Переключение состояния привычки (выполнено/не выполнено)
async function toggleHabitComplete(habitId, habitElement) {
    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, { method: 'PATCH' });
        if (response.ok) {
            const data = await response.json();
            habitElement.classList.toggle('completed', data.completed); // Применяем статус с сервера
        } else {
            console.error('Ошибка обновления привычки');
        }
    } catch (error) {
        console.error('Ошибка при переключении состояния привычки:', error);
    }
}

// Удаление привычки с подтверждением
function confirmDeleteHabit(habitId) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <p>Вы уверены, что хотите удалить привычку навсегда?</p>
            <button id="confirm-delete">Да</button>
            <button id="cancel-delete">Нет</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('confirm-delete').addEventListener('click', async () => {
        await deleteHabit(habitId);
        document.body.removeChild(modal);
    });

    document.getElementById('cancel-delete').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Удаление привычки
async function deleteHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
        if (response.ok) displayHabitsForSelectedDate(); // Обновляем список привычек
    } catch (error) {
        console.error('Ошибка при удалении привычки:', error);
    }
}

// Преобразование повторяющихся дней недели в даты
function getDatesFromRecurrence(recurrence) {
    const daysMap = { "ПН": 1, "ВТ": 2, "СР": 3, "ЧТ": 4, "ПТ": 5, "СБ": 6, "ВС": 0 };
    const days = recurrence.split(', ').map(day => daysMap[day]);

    const dates = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    for (let day = 1; day <= 31; day++) {
        const date = new Date(currentYear, currentMonth, day);
        if (date.getMonth() !== currentMonth) break;

        if (days.includes(date.getDay())) dates.push(getLocalDate(date));
    }
    return dates;
}

// Инициализация отображения привычек
document.addEventListener('DOMContentLoaded', () => {
    selectedDate = getLocalDate();
    displayHabitsForSelectedDate();
});









//ДОСТИЖЕНИЯ
const achievements = [
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "/assets/1111.png"

    },
    { 
        name: "Мастер планирования", 
        achieved: false,
        description: "Заведи привычки на месяц, заполнив свой календарь целей и задач.",
        img: "/assets/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "/assets/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "/assets/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "/assets/1111.png"

    }
];
function sortAchievements() {
    return achievements.sort((a, b) => b.achieved - a.achieved);
}
function displayAchievements() {
    const achievementsList = document.querySelector('.achievements-list');
    const sortedAchievements = sortAchievements();
    achievementsList.innerHTML = '';

    sortedAchievements.forEach(achievement => {
        const div = document.createElement('div');
        div.classList.add('achievement');
        
        if (achievement.achieved) {
            div.classList.add('earned');
        } else {
            div.classList.add('available');
        }

        const img = document.createElement('img');
        img.src = achievement.img;
        img.alt = achievement.name;

        div.appendChild(img);

        div.addEventListener('click', () => {
            showAchievementDetails(achievement);
        });

        achievementsList.appendChild(div);
    });
}
function showAchievementDetails(achievement) {
    const modal = document.getElementById('achievement-modal');
    const title = document.getElementById('achievement-title');
    const status = document.getElementById('achievement-status');
    const img = document.getElementById('achievement-img');
    const description = document.getElementById('achievement-description');
    const closeButton = modal.querySelector('.close-achievement-button');

    title.textContent = achievement.name;
    status.textContent = achievement.achieved ? "Статус: Получено" : "Статус: Не получено";
    status.style.color = achievement.achieved ? "#4CAF50" : "#B0B0B0";

    img.src = achievement.img;
    img.alt = achievement.name;
    description.textContent = achievement.description;
    modal.style.display = 'flex';
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

window.onload = function() {
    displayAchievements();
};




async function getHabitsData() {
    try {
        const response = await fetch('/api/habits');
        const data = await response.json();
        return data.habits;
    } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        return [];
    }
}

async function updateProgress() {
    const habits = await getHabitsData();

    const allHabits = habits.length;
    const completedHabits = habits.filter(habit => habit.completed).length;

    const progressPercent = (completedHabits / allHabits) * 100;

    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progress-text');

    progressFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${Math.round(progressPercent)}% Выполнено`;
}

document.addEventListener('DOMContentLoaded', updateProgress);


async function updateProgress() {
    const habits = await getHabitsData();

    const allHabits = habits.length;
    const completedHabits = habits.filter(habit => habit.completed).length;

    const progressPercent = (completedHabits / allHabits) * 100;

    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progress-text');

    progressFill.style.width = `${progressPercent}%`;
    progressText.textContent = `${Math.round(progressPercent)}% Выполнено`;
}

setInterval(updateProgress, 30000);

document.addEventListener('DOMContentLoaded', updateProgress);


function filterHabitsByDate(habits, date) {
    return habits.filter(habit => habit.date === date);
}









const userProfileModal = document.getElementById('user-profile-modal');
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatar-img');
const saveButton = document.getElementById('save-profile');
const userIcon = document.getElementById('user-icon'); // Ваш аватар пользователя

// Открытие модального окна
userIcon.addEventListener('click', async () => {
    userProfileModal.style.display = 'flex';
    await loadUserProfile(); // Загружаем данные с сервера
});

closeButton.addEventListener('click', () => {
    userProfileModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === userProfileModal) {
        userProfileModal.style.display = 'none';
    }
});


avatarInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            avatarPreview.src = e.target.result;
            userIcon.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});



// Загрузка данных пользователя с сервера
async function loadUserProfile() {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Пользователь не авторизован.');
        return;
    }

    try {
        const response = await fetch(`/api/user-data?username=${username}`);
        const userData = await response.json();

        if (response.ok) {
            document.getElementById('name').value = userData.username || '';
            document.getElementById('email').value = userData.email || '';
        } else {
            alert(userData.message || 'Ошибка загрузки профиля.');
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}


// Сохранение данных пользователя на сервере
saveButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const userId = localStorage.getItem('user_id');
    const username = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const avatar = document.getElementById('avatar').files[0];

    if (!userId || !username || !email) {
        alert('Заполните все поля.');
        return;
    }

    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('username', username);
    formData.append('email', email);
    if (avatar) {
        formData.append('avatar', avatar);
    }

    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Профиль успешно обновлен!');
            localStorage.setItem('username', newUsername);
            if (avatar) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    userIcon.querySelector('img').src = e.target.result;
                };
                reader.readAsDataURL(avatar);
            }
        } else {
            alert(result.message || 'Ошибка обновления профиля.');
        }
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Произошла ошибка. Попробуйте позже.');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        await loadUserProfile();
    }
});




document.getElementById('save-profile').addEventListener('click', async (event) => {
    event.preventDefault();

    const username = localStorage.getItem('username');
    const newUsername = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!username || !newUsername || !email) {
        alert('Заполните все поля.');
        return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('new_username', newUsername);
    formData.append('email', email);

    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Профиль успешно обновлен!');
            localStorage.setItem('username', newUsername);
        } else {
            alert(result.message || 'Ошибка обновления профиля.');
        }
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Произошла ошибка. Попробуйте позже.');
    }
});
