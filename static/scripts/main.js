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
//логика выбора дней для повторения привычек
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
//отображение привычек для выбранной даты
function displayHabitsForSelectedDate() {
    habitsContainer.innerHTML = '';

    const habitsForDate = habitsData[selectedDate] || [];
    
    habitsForDate.forEach((habit, index) => {
        const habitElement = document.createElement('div');
        habitElement.classList.add('habit');
        
        habitElement.innerHTML = `
            <button class="delete-habit" data-index="${index}">-</button>
            <span>${habit.name}</span>
            <div class="habit-reminder">
                <p>${habit.reminderText}</p>
                <p>Повторение: ${habit.recurrence}</p>
            </div>
            <button class="complete-habit" data-index="${index}">+</button>
        `;

        habitElement.querySelector('.delete-habit').addEventListener('click', (e) => {
            const habitIndex = e.target.getAttribute('data-index');
            confirmHabitDeletion(habitIndex, habit.name);
        });

         const today = new Date().toISOString().split('T')[0];
         if (selectedDate === today) {
             habitElement.querySelector('.complete-habit').addEventListener('click', (e) => {
                 const habitIndex = e.target.getAttribute('data-index');
                 markHabitAsCompleted(habitIndex, habitElement);
             });
         } else {
             habitElement.querySelector('.complete-habit').disabled = true;
         }
 
         habitsContainer.appendChild(habitElement);
     });
 }

function deleteHabit(index) {
    if (habitsData[selectedDate]) {
        habitsData[selectedDate].splice(index, 1);
        displayHabitsForSelectedDate();
    }
}

function markHabitAsCompleted(index, habitElement) {
    if (habitsData[selectedDate] && habitsData[selectedDate][index]) {
        habitElement.style.backgroundColor = '#a9dfbf';
        habitElement.querySelector('.complete-habit').disabled = true;
    }
}

//добавление привычки в выбранный день
submitHabitButton.addEventListener('click', () => {
    console.log('Клик по кнопке "Добавить"!');

    const habitName = document.getElementById('habit-name').value.trim();
    const habitDescription = document.getElementById('habit-description').value.trim();
    const reminder = document.getElementById('habit-reminder').checked;
    const time = document.getElementById('habit-time').value;
    const startDate = selectedDate;

    if (!habitName) {
        alert('Пожалуйста, введите название привычки!');
        console.log('Ошибка: Название не введено');
        return;
    }

    const newHabit = {
        name: habitName,
        description: habitDescription,
        reminderText: reminder ? `Напоминание: ${time}` : 'Без напоминания',
        days: selectedDays,
        startDate: startDate
    };

    console.log('Новая привычка:', newHabit);

    addHabitWithRecurrence(newHabit);
    displayHabitsForSelectedDate();

    modal.style.display = 'none';

    document.getElementById('habit-name').value = '';
    document.getElementById('habit-description').value = '';
    document.getElementById('habit-reminder').checked = false;
    document.getElementById('habit-time').value = '10:00';
    selectedDays = [];
    recurrenceButtons.forEach(button => button.classList.remove('selected'));

    console.log('Привычка добавлена и окно закрыто');
});
//добавление привычки на конкретную дату
function addHabitForDate(date, habit) {
    const dateStr = date.toISOString().split('T')[0];

    if (!habitsData[dateStr]) {
        habitsData[dateStr] = [];
    }

    const isHabitAlreadyAdded = habitsData[dateStr].some(existingHabit => existingHabit.name === habit.name);
    if (!isHabitAlreadyAdded) {
        habitsData[dateStr].push(habit);
    }
}


//добавление привычек с учётом повторений
function addHabitWithRecurrence(habit) {
    const startDate = new Date(habit.startDate || selectedDate);
    const recurrenceDays = habit.days;
    const maxDays = 365;

    for (let i = 0; i < maxDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dayIndex = (currentDate.getDay() + 6) % 7;
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




//форма новой привычки
submitHabitButton.addEventListener('click', async () => {
    const habitName = document.getElementById('habit-name').value;
    const habitDescription = document.getElementById('habit-description').value;
    const reminder = document.getElementById('habit-reminder').checked;
    const time = document.getElementById('habit-time').value;

    if (habitName && selectedDate) {
        const reminderText = reminder ? `Напоминание: ${time}` : 'Без напоминания';

        const newHabit = {
            name: habitName,
            description: habitDescription,
            reminderText: reminderText,
            recurrence: selectedDays.join(', ') || 'Нет',
        };

        addHabitWithRecurrence(newHabit);
        displayHabitsForSelectedDate();

        try {
            // Отправляем данные на сервер
            const response = await fetch('http://127.0.0.1:5000', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: habitName,
                    description: habitDescription,
                    reminder: reminder,
                    time: reminder ? time : null,
                    days: selectedDays,
                    startDate: selectedDate,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Привычка успешно добавлена на сервер:', result);
                alert('Привычка успешно добавлена!');
            } else {
                console.error('Ошибка при отправке данных на сервер:', response.status);
                alert('Произошла ошибка при добавлении привычки на сервер.');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Произошла ошибка сети. Проверьте подключение.');
        }
        // Закрываем модальное окно и сбрасываем форму
        modal.style.display = 'none';
        document.getElementById('habit-name').value = '';
        document.getElementById('habit-description').value = '';
        document.getElementById('habit-reminder').checked = false;
        document.getElementById('habit-time').value = '10:00';
        selectedDays = [];
        recurrenceButtons.forEach(button => button.classList.remove('selected'));
    } else {
        alert('Пожалуйста, выберите день и введите название привычки');
    }
});



// Функция для получения привычек с сервера
async function fetchHabitsFromServer() {
    try {
        const response = await fetch('http://localhost:3000/habits'); // Укажи свой сервер
        if (response.ok) {
            const habits = await response.json(); // Получаем привычки с сервера
            console.log('Привычки с сервера:', habits);

            // Распределяем привычки по дням
            habits.forEach((habit) => {
                addHabitWithRecurrence(habit); // Используем обновленную функцию
            });

            // Обновляем отображение для выбранной даты
            displayHabitsForSelectedDate();
        } else {
            console.error('Ошибка при получении данных с сервера:', response.status);
        }
    } catch (error) {
        console.error('Ошибка сети:', error);
    }
}









// Для работы с достижениями
const achievements = [
    { 
        name: "Первые шаги", 
        achieved: false,
        description: "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Мастер планирования", 
        achieved: false,
        description: "Заведи привычки на месяц, заполнив свой календарь целей и задач.",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

    },
    { 
        name: "Пять дней подряд", 
        achieved: true,
        description: "Поддержи свою привычку как минимум 5 дней подряд!",
        img: "file:///C:/Users/natalia/Desktop/пп/images/1111.png"

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



localStorage.setItem('userNickname', 'ivan_ivanov');
const userNickname = localStorage.getItem('userNickname');
document.getElementById('user-nickname').textContent = userNickname;







const userIcon = document.getElementById('user-icon');

function showUserProfile() {
    alert("Это место для информации о пользователе.");
}

userIcon.addEventListener('click', showUserProfile);



const userProfileModal = document.getElementById('user-profile-modal');
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatar-img');
const saveButton = document.getElementById('save-profile');

userIcon.addEventListener('click', () => {
    userProfileModal.style.display = 'flex';
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
            localStorage.setItem('userAvatar', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

saveButton.addEventListener('click', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const nickname = document.getElementById('nickname').value;
    const email = document.getElementById('email').value;

    localStorage.setItem('userName', name);
    localStorage.setItem('userNickname', nickname);
    localStorage.setItem('userEmail', email);

    userProfileModal.style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
        userIcon.querySelector('img').src = savedAvatar;
        avatarPreview.src = savedAvatar;
    }

    const savedName = localStorage.getItem('userName');
    const savedNickname = localStorage.getItem('userNickname');
    const savedEmail = localStorage.getItem('userEmail');

    if (savedName) document.getElementById('name').value = savedName;
    if (savedNickname) document.getElementById('nickname').value = savedNickname;
    if (savedEmail) document.getElementById('email').value = savedEmail;
});