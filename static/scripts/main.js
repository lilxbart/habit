const modal = document.getElementById('habit-modal');
const addHabitButton = document.getElementById('add-habit-button');
const closeHabitModalButton = modal.querySelector('.close-button');
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

// Функция для получения локальной даты в формате YYYY-MM-DD
function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Инициализация отображения привычек при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const today = getLocalDate();
    selectedDate = today;

    // Обновляем календарь
    updateCalendar();
    // Ставим визуальный фокус на сегодняшний день
    highlightSelectedDay(selectedDate);
    // Отображаем привычки
    displayHabitsForSelectedDate();
    // Установка текущей даты в заголовке
    setCurrentDate();
    // Обновляем прогресс
    updateProgressBars();
    // Загружаем достижения сразу
    updateAchievementsUI();
});

// Выделяем выбранный день в календаре
function highlightSelectedDay(dateString) {
    const allDays = document.querySelectorAll('.day');
    allDays.forEach(d => d.classList.remove('selected'));
    const activeDayElement = document.querySelector(`.day[data-date="${dateString}"]`);
    if (activeDayElement) {
        activeDayElement.classList.add('selected');
        activeDayElement.scrollIntoView({ inline: 'center', behavior: 'smooth' });
    }
}

// Обработчики календаря
function setupDateSelection() {
    document.querySelectorAll('.day').forEach(day => {
        day.addEventListener('click', (event) => {
            event.preventDefault();
            selectedDate = day.getAttribute('data-date');
            highlightSelectedDay(selectedDate);
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

// Обновление календаря
function updateCalendar() {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = '';

    updateCurrentMonth();

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayElement = createDayElement(date);
        calendarContainer.appendChild(dayElement);
    }
    setupDateSelection();
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');

    const localDate = getLocalDate(date);
    dayElement.setAttribute('data-date', localDate);

    const dayIndex = getDayIndex(date);
    const dayName = daysOfWeek[dayIndex];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    dayElement.innerHTML = `
        ${dayName}<br><span>${day}.${month}</span>
    `;
    return dayElement;
}

document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCalendar();
    highlightSelectedDay(selectedDate);
    displayHabitsForSelectedDate();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCalendar();
    highlightSelectedDay(selectedDate);
    displayHabitsForSelectedDate();
});

// Установка текущей даты в заголовке
function setCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('ru-RU', options);
    currentDateElement.textContent = formattedDate;
}

// ПРИВЫЧКИ - создание
addHabitButton.addEventListener('click', () => {
    if (selectedDate) {
        modal.style.display = 'flex';
    } else {
        alert("Пожалуйста, выберите дату, прежде чем добавлять привычку.");
    }
});

closeHabitModalButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Кнопки повторения
const recurrenceButtons = document.querySelectorAll('.habit-recurrence button');
let selectedDays = [];

recurrenceButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();

        const day = button.textContent;
        if (selectedDays.includes(day)) {
            selectedDays = selectedDays.filter(selectedDay => selectedDay !== day);
            button.classList.remove('selected');
        } else {
            selectedDays.push(day);
            button.classList.add('selected');
        }
    });
});

// Форма создания новой привычки
submitHabitButton.addEventListener('click', async () => {
    const habitName = document.getElementById('habit-name').value.trim();
    const habitDescription = document.getElementById('habit-description').value.trim();
    const reminder = document.getElementById('habit-reminder').checked;
    const time = document.getElementById('habit-time').value;

    if (!habitName) {
        alert('Введите название привычки!');
        return;
    }

    const newHabit = {
        user_id: localStorage.getItem('user_id'),
        name: habitName,
        description: habitDescription,
        reminder_text: reminder ? `Напоминание: ${time}` : null,
        reminder_time: time || null,
        recurrence: selectedDays.join(', ') || 'Нет',
        // Можно передавать дату старта, если нужно
    };

    try {
        const response = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHabit),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Привычка успешно добавлена:', result);

        modal.style.display = 'none';
        displayHabitsForSelectedDate();
        updateProgressBars();
        updateAchievementsUI(); // обновляем список достижений

    } catch (error) {
        console.error('Ошибка при отправке привычки:', error);
    }
});

// Отображение имени пользователя
document.addEventListener('DOMContentLoaded', function () {
    const userNicknameElement = document.getElementById('user-nickname');
    const username = localStorage.getItem('username');

    if (username) {
        userNicknameElement.textContent = username;
    } else {
        console.error('Имя пользователя не найдено в localStorage.');
    }
});

// Получение привычек с сервера
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

// Отображение привычек для выбранной даты
async function displayHabitsForSelectedDate() {
    const userId = localStorage.getItem('user_id');
    if (!userId) return console.error('Не найден user_id');

    const habits = await fetchHabits(userId);
    const habitsContainer = document.getElementById('habits-container');
    habitsContainer.innerHTML = '';

    const selectedYear = currentMonth.getFullYear();
    const selectedMonth = currentMonth.getMonth();

    habits.forEach(habit => {
        const habitDates = getDatesFromRecurrence(habit.recurrence || '', selectedYear, selectedMonth);
        const habitStartDate = habit.date_created.split(' ')[0]; // YYYY-MM-DD

        if (habitDates.includes(selectedDate) && selectedDate >= habitStartDate) {
            const habitElement = createHabitElement(habit, selectedDate === getLocalDate());
            habitsContainer.appendChild(habitElement);
        }
    });
}

// Создание элемента привычки
function createHabitElement(habit, isToday) {
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    if (habit.completed) habitDiv.classList.add('completed');

    habitDiv.innerHTML = `
        <div class="habit-info">
            <h3 class="habit-name">${habit.name}</h3>
            <p class="habit-description">${habit.description || ''}</p>
            <p class="habit-streak">Серия: ${habit.streak_count || 0} дней</p>
        </div>
        <div class="habit-actions">
            ${isToday ? `<button class="complete-habit" data-id="${habit.id}">+</button>` : ''}
            ${isToday ? `<button class="delete-habit" data-id="${habit.id}">-</button>` : ''}
        </div>
    `;

    if (isToday) {
        habitDiv.querySelector('.complete-habit').addEventListener('click', () => toggleHabitComplete(habit.id, habitDiv));
        habitDiv.querySelector('.delete-habit').addEventListener('click', () => confirmDeleteHabit(habit.id));
    }

    return habitDiv;
}

// Переключение состояния привычки
async function toggleHabitComplete(habitId, habitElement) {
    const today = getLocalDate(new Date());

    try {
        const response = await fetch(`/api/habits/${habitId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selected_date: today })
        });

        if (response.ok) {
            const data = await response.json();

            habitElement.classList.toggle('completed', data.completed);
            const streakElement = habitElement.querySelector('.habit-streak');
            if (streakElement) {
                streakElement.textContent = `Серия: ${data.streak_count} дней`;
            }

            updateProgressBars();
            // Обновляем достижения (если вдруг разблокировалось что-то новое)
            updateAchievementsUI();

        } else {
            const error = await response.json();
            console.error('Ошибка при обновлении привычки:', error.message);
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
    }
}

// Удаление привычки с подтверждением
function confirmDeleteHabit(habitId) {
    const deleteModal = document.getElementById('delete-confirm-modal');
    const deleteMessage = document.getElementById('delete-confirm-message');

    if (deleteMessage) {
        deleteMessage.textContent = "Вы уверены, что хотите удалить привычку навсегда?";
    } else {
        console.error("Delete message element not found!");
    }

    deleteModal.style.display = 'flex';

    const confirmButton = document.getElementById('confirm-delete');
    const cancelButton = document.getElementById('cancel-delete');

    confirmButton.onclick = async () => {
        await deleteHabit(habitId);
        deleteModal.style.display = 'none';
    };

    cancelButton.onclick = () => {
        deleteModal.style.display = 'none';
    };
}

async function deleteHabit(habitId) {
    try {
        const response = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
        if (response.ok) {
            displayHabitsForSelectedDate();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка при удалении привычки');
        }
    } catch (error) {
        console.error('Ошибка при удалении привычки:', error);
    }
}

// Преобразование повторяющихся дней недели в даты
function getDatesFromRecurrence(recurrence, year, month) {
    const daysMap = { "ПН": 1, "ВТ": 2, "СР": 3, "ЧТ": 4, "ПТ": 5, "СБ": 6, "ВС": 0 };
    const days = recurrence.split(', ').map(day => daysMap[day]);
    const dates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (days.includes(date.getDay())) {
            dates.push(getLocalDate(date));
        }
    }
    return dates;
}

// ПРОГРЕСС
async function updateProgressBars() {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const response = await fetch(`/api/progress?user_id=${userId}`);
        const data = await response.json();

        if (!data.success) {
            console.error("Ошибка данных прогресса:", data.message);
            return;
        }

        const dailyValue = Math.round(data.daily_progress) || 0;
        const monthlyValue = Math.round(data.monthly_progress) || 0;

        if (dailyProgressFill) {
            dailyProgressFill.style.width = dailyValue + "%";
        }
        if (dailyProgressText) {
            dailyProgressText.textContent = `${dailyValue}% Выполнено`;
        }
        if (monthlyProgressFill) {
            monthlyProgressFill.style.width = monthlyValue + "%";
        }
        if (monthlyProgressText) {
            monthlyProgressText.textContent = `${monthlyValue}% Выполнено`;
        }

    } catch (error) {
        console.error("Ошибка при получении прогресса:", error);
    }
}

const dailyProgressFill = document.querySelector('.daily-progress-fill');
const dailyProgressText = document.getElementById('daily-progress-text');
const monthlyProgressFill = document.querySelector('.monthly-progress-fill');
const monthlyProgressText = document.getElementById('monthly-progress-text');

// ДОСТИЖЕНИЯ (из БД)
// 1. Фетчим с сервера /api/achievements/<user_id>
async function fetchUserAchievements() {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return [];

        const response = await fetch(`/api/achievements/${userId}`);
        if (!response.ok) {
            console.error("Ошибка при загрузке достижений:", response.status);
            return [];
        }
        const data = await response.json();
        // data.achievements — массив вида:
        // [{id, name, description, img, achieved, achieved_date}, ...]
        return data.achievements || [];
    } catch (error) {
        console.error("Ошибка при загрузке достижений:", error);
        return [];
    }
}

// 2. Обновляем UI, опираясь на реальные данные
async function updateAchievementsUI() {
    const achievementsList = document.querySelector('.achievements-list');
    if (!achievementsList) {
        // Если на странице нет .achievements-list, можно просто выйти
        return;
    }

    const achievementsFromServer = await fetchUserAchievements();
    achievementsList.innerHTML = '';

    achievementsFromServer.forEach(achievement => {
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

        // При клике открываем модалку с деталями
        div.addEventListener('click', () => {
            showAchievementDetails(achievement);
        });

        achievementsList.appendChild(div);
    });
}

// 3. Модалка деталей достижения
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

    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    newCloseButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Профиль пользователя
const userProfileModal = document.getElementById('user-profile-modal');
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatar-img');
const saveProfileButton = document.getElementById('save-profile');
const userIcon = document.getElementById('user-icon');
const closeProfileModalButton = userProfileModal.querySelector('.close-button');

userIcon.addEventListener('click', async () => {
    userProfileModal.style.display = 'flex';
    await loadUserProfile();
});

closeProfileModalButton.addEventListener('click', () => {
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
            avatarPreview.src = userData.avatar || '/assets/default-avatar.png';
        } else {
            alert(userData.message || 'Ошибка загрузки профиля.');
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
}

saveProfileButton.addEventListener('click', async (event) => {
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
            localStorage.setItem('username', username);
            if (avatar) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    userIcon.querySelector('img').src = e.target.result;
                };
                reader.readAsDataURL(avatar);
            }
            userProfileModal.style.display = 'none';
        } else {
            alert(result.message || 'Ошибка обновления профиля.');
        }
    } catch (error) {
        console.error('Ошибка сохранения профиля:', error);
        alert('Произошла ошибка. Попробуйте позже.');
    }
});
