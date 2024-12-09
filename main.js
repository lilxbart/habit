const modal = document.getElementById('habit-modal');
const addHabitButton = document.getElementById('add-habit-button');
const closeButton = document.querySelector('.close-button');
const submitHabitButton = document.getElementById('submit-habit');
const habitsContainer = document.getElementById('habits-container');
let selectedDate = null;
let habitsData = {};

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

//создание календаря
function updateCalendar() {
    const calendarContainer = document.getElementById('calendar');
    calendarContainer.innerHTML = '';

    const today = new Date();
    const daysOfWeek = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

    for (let i = 30; i > 0; i--) {
        const pastDate = new Date(today);
        pastDate.setDate(today.getDate() - i);

        const dayElement = createDayElement(pastDate, daysOfWeek);
        calendarContainer.appendChild(dayElement);
    }

    const todayElement = createDayElement(today, daysOfWeek, true);
    calendarContainer.appendChild(todayElement);

    for (let i = 1; i <= 30; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);

        const dayElement = createDayElement(futureDate, daysOfWeek);
        calendarContainer.appendChild(dayElement);
    }

    todayElement.scrollIntoView({ inline: 'center', behavior: 'smooth' });
}

//создание элемента дня
function createDayElement(date, daysOfWeek, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    if (isToday) dayElement.classList.add('active');

    const dayName = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1];
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    dayElement.setAttribute('data-date', date.toISOString().split('T')[0]);
    dayElement.innerHTML = `
        <div class="day-header">${dayName}<br><span>${day}.${month}</span></div>
    `;

    dayElement.addEventListener('click', () => {
        selectedDate = dayElement.getAttribute('data-date');
        document.querySelectorAll('.day').forEach(d => d.classList.remove('selected'));
        dayElement.classList.add('selected');
        displayHabitsForSelectedDate();
    });

    return dayElement;
}

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
            recurrence: selectedDays.join(', ') || 'Нет'
        };

        addHabitWithRecurrence(newHabit);
        displayHabitsForSelectedDate();

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


//добавление привычки на конкретную дату
function addHabitForDate(date, habit) {
    const dateStr = date.toISOString().split('T')[0];
    if (!habitsData[dateStr]) {
        habitsData[dateStr] = [];
    }
    habitsData[dateStr].push(habit);
}

//добавление привычек с учётом повторений
function addHabitWithRecurrence(habit) {
    const startDate = new Date(selectedDate);
    const recurrenceDays = selectedDays;

    for (let i = 0; i < 365; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        if (recurrenceDays.includes("КАЖДЫЙ ДЕНЬ")) {
            addHabitForDate(currentDate, habit);
        } else {
            const dayOfWeek = currentDate.toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase();
            if (recurrenceDays.includes(dayOfWeek)) {
                addHabitForDate(currentDate, habit);
            }
        }
    }
}

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
