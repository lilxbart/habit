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
let selectedDate = currentDate.toISOString().split('T')[0];

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

function updateCalendar() {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = '';

    updateCurrentMonth();

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayElement = createDayElement(date);
        calendarContainer.appendChild(dayElement);

        if (
            date.getDate() === currentDate.getDate() &&
            date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
        ) {
            setTimeout(() => {
                dayElement.scrollIntoView({ inline: 'start', behavior: 'smooth' });
            }, 0);
        }
    }
}

function createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.setAttribute('data-date', date.toISOString().split('T')[0]);

    const dayIndex = (date.getDay() + 6) % 7;
    const dayName = daysOfWeek[dayIndex];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    dayElement.innerHTML = `
        ${dayName}<br><span>${day}.${month}</span>
    `;

    if (
        date.getDate() === currentDate.getDate() &&
        date.getMonth() === currentDate.getMonth() &&
        date.getFullYear() === currentDate.getFullYear()
    ) {
        dayElement.classList.add('active');
    }

    if (date.toISOString().split('T')[0] === selectedDate) {
        dayElement.classList.add('selected');
    }

    dayElement.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach((d) => d.classList.remove('selected'));
        dayElement.classList.add('selected');
        selectedDate = date.toISOString().split('T')[0];
        displayHabitsForSelectedDate();
    });

    return dayElement;
}


// Функция отображения привычек для выбранной даты
function displayHabitsForSelectedDate() {
    const habitsContainer = document.getElementById('habits-container');
    habitsContainer.innerHTML = '';

    const habitsForDate = habitsData[selectedDate] || [];
    habitsForDate.forEach((habit) => {
        const habitElement = document.createElement('div');
        habitElement.classList.add('habit');
        habitElement.textContent = habit.name;
        habitsContainer.appendChild(habitElement);
    });
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




//ПРИВЫЧКИ добавление
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

const recurrenceButtons = document.querySelectorAll('.habit-recurrence button');
let selectedDays = [];

recurrenceButtons.forEach(button => {
    button.addEventListener('click', () => {
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









//ПРИВЫЧКИ  отображение
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('user_id');
    if (userId) {
        fetchHabitsFromServer(userId);
    } else {
        console.error('Пользователь не авторизован.');
    }
});

async function fetchHabitsFromServer(userId) {
    try {
        const response = await fetch(`/api/habits/${userId}`);
        const data = await response.json();
        console.log('Ответ сервера:', data); // Отладка
    } catch (error) {
        console.error('Ошибка при получении привычек:', error);
    }
}



function displayHabitsForSelectedDate() {
    habitsContainer.innerHTML = '';

    const habitsForDate = habitsData[selectedDate] || [];
    console.log('Привычки для выбранной даты:', selectedDate, habitsForDate);
    const today = new Date().toISOString().split('T')[0];

    console.log('Данные привычек:', habitsData);
    console.log('Выбранная дата:', selectedDate);
    console.log('Привычки для даты:', habitsForDate);

    habitsForDate.forEach((habit, index) => {
        const habitElement = document.createElement('div');
        habitElement.classList.add('habit');

        habitElement.innerHTML = `
            <div class="habit-info">
                <h4 class="habit-name">${habit.name}</h4>
                <p class="habit-description">${habit.description || 'Без описания'}</p>
                <p class="habit-days">Повторение: ${habit.recurrence || 'Нет'}</p>
                ${habit.reminder_text ? `<p class="habit-reminder">${habit.reminder_text}</p>` : ''}
            </div>
            <div class="habit-actions">
                <button class="delete-habit" data-index="${index}" title="Удалить привычку" ${selectedDate !== today ? 'disabled' : ''}>✖</button>
                <button 
                    class="complete-habit" 
                    data-index="${index}" 
                    title="Отметить как выполнено" 
                    ${selectedDate !== today ? 'disabled' : ''}
                >
                    ${habit.completed ? '✔' : '+'}
                </button>
            </div>
        `;

        attachHabitEventListeners(habitElement, habit, index);

        if (habit.completed) {
            habitElement.classList.add('habit-completed');
        }

        habitsContainer.appendChild(habitElement);
    });
}

function attachHabitEventListeners(habitElement, habit, index) {
    const deleteButton = habitElement.querySelector('.delete-habit');
    const completeButton = habitElement.querySelector('.complete-habit');

    deleteButton.addEventListener('click', () => {
        if (deleteButton.disabled) return;
        confirmHabitDeletion(index, habit.name);
    });

    completeButton.addEventListener('click', () => {
        if (completeButton.disabled) return;
        markHabitAsCompleted(index, habitElement);
    });
}

function markHabitAsCompleted(index, habitElement) {
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate !== today) {
        alert('Привычку можно отметить как выполненную только в текущий день.');
        return;
    }

    if (habitsData[selectedDate] && habitsData[selectedDate][index]) {
        const habit = habitsData[selectedDate][index];

        fetch(`/api/habits/${habit.id}/complete`, { method: 'PATCH' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Ошибка сервера: ${response.status}`);
                }
                habit.completed = true;

                habitElement.classList.add('habit-completed');
                const completeButton = habitElement.querySelector('.complete-habit');
                completeButton.disabled = true;
                completeButton.textContent = '✔';
            })
            .catch((error) => {
                console.error('Ошибка при отметке привычки:', error);
                alert('Не удалось отметить привычку как выполненную.');
            });
    }
}

function addHabitWithRecurrence(habit) {
    const startDate = new Date(habit.startDate || selectedDate);
    const recurrenceDays = habit.recurrence ? habit.recurrence.split(', ') : [];
    const maxDays = 365;

    for (let i = 0; i < maxDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayIndex = getDayIndex(currentDate);
        const currentDayName = daysOfWeek[dayIndex];

        if (recurrenceDays.includes('КАЖДЫЙ ДЕНЬ') || recurrenceDays.includes(currentDayName)) {
            const dateStr = currentDate.toISOString().split('T')[0];

            if (!habitsData[dateStr]) {
                habitsData[dateStr] = [];
            }

            const isHabitAlreadyAdded = habitsData[dateStr].some(h => h.name === habit.name);
            if (!isHabitAlreadyAdded) {
                habitsData[dateStr].push(habit);
            }
        }
    }
}

function getDayIndex(date) {
    const jsDayIndex = date.getDay();
    return jsDayIndex === 0 ? 6 : jsDayIndex - 1;
}

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

        alert('Привычка добавлена!');
        await fetchHabitsFromServer(localStorage.getItem('user_id'));
        modal.style.display = 'none';
    } catch (error) {
        console.error('Ошибка при добавлении привычки:', error);
        alert('Не удалось добавить привычку. Проверьте настройки сервера.');
    }
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
