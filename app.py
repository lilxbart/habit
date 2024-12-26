from flask import Flask, request, jsonify, render_template, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta
import pytz
from werkzeug.utils import secure_filename
from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
import os

app = Flask(__name__)
bcrypt = Bcrypt(app)

# Конфигурация базы данных
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:89168117733@localhost/habit_tracker_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# Модели
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    avatar = db.Column(db.String(255), nullable=True)  # Хранит путь к аватару

    habits = db.relationship('Habit', back_populates='user', lazy=True)
    user_achievements = db.relationship('UserAchievement', back_populates='user', lazy=True)


class Habit(db.Model):
    __tablename__ = 'habits'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    recurrence = db.Column(db.String(50), nullable=True)
    reminder_text = db.Column(db.String(255), nullable=True)
    reminder_time = db.Column(db.Time, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    completed = db.Column(db.Boolean, default=False)
    streak_count = db.Column(db.Integer, default=0)

    user = db.relationship('User', back_populates='habits')
    completions = db.relationship('HabitCompletion', back_populates='habit', cascade='all, delete-orphan')



class Achievement(db.Model):
    __tablename__ = 'achievements'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    img = db.Column(db.String(255), nullable=False)  # Путь к изображению

    user_achievements = db.relationship('UserAchievement', back_populates='achievement', lazy=True)


class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    achieved_date = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='user_achievements')
    achievement = db.relationship('Achievement', back_populates='user_achievements')

class HabitCompletion(db.Model):
    __tablename__ = 'habit_completions'

    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)

    # Связь с моделью Habit
    habit = db.relationship('Habit', back_populates='completions')


# Конфигурация загрузки файлов
UPLOAD_FOLDER = 'static/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_local_date():
    local_tz = pytz.timezone('Europe/Moscow')
    return datetime.now(local_tz).date()

# Инициализация достижений
def initialize_achievements():
    achievements_data = [
        {
            "name": "Первые шаги",
            "description": "Сделай первый шаг к своим целям, начни отслеживать хотя бы одну привычку.",
            "img": "/assets/achievement1.png"
        },
        {
            "name": "Мастер планирования",
            "description": "Заведи привычки на месяц, заполнив свой календарь целей и задач.",
            "img": "/assets/achievement2.png"
        },
        {
            "name": "Пять дней подряд",
            "description": "Поддержи свою привычку как минимум 5 дней подряд!",
            "img": "/assets/achievement3.png"
        },
        # Добавьте больше достижений по необходимости
    ]

    for ach in achievements_data:
        existing = Achievement.query.filter_by(name=ach["name"]).first()
        if not existing:
            new_achievement = Achievement(
                name=ach["name"],
                description=ach["description"],
                img=ach["img"]
            )
            db.session.add(new_achievement)
    try:
        db.session.commit()
        print("Achievements initialized.")
    except IntegrityError:
        db.session.rollback()
        print("Achievements already initialized.")


# Функции для разблокировки достижений
def unlock_achievement(user_id, achievement_name):
    achievement = Achievement.query.filter_by(name=achievement_name).first()
    if not achievement:
        print(f"Achievement '{achievement_name}' not found.")
        return

    # Проверяем, имеет ли пользователь это достижение
    existing = UserAchievement.query.filter_by(user_id=user_id, achievement_id=achievement.id).first()
    if existing:
        # Достижение уже разблокировано
        return

    # Разблокируем достижение
    user_achievement = UserAchievement(user_id=user_id, achievement_id=achievement.id)
    db.session.add(user_achievement)
    db.session.commit()
    print(f"User {user_id} unlocked achievement '{achievement_name}'.")


def check_achievements_on_habit_creation(user_id):
    # Разблокируем "Первые шаги", когда пользователь добавляет первую привычку
    habit_count = Habit.query.filter_by(user_id=user_id).count()
    if habit_count >= 1:
        unlock_achievement(user_id, "Первые шаги")
    # Добавьте другие условия для достижений, если необходимо


def check_achievements_on_habit_completion(user_id):
    # Разблокируем "Пять дней подряд", когда пользователь выполняет привычку 5 дней подряд
    # Для упрощения проверим, сколько привычек выполнено сегодня
    today = datetime.utcnow().date()
    # Предполагаем, что привычка считается выполненной, если она отмечена как completed
    completed_today = Habit.query.filter_by(user_id=user_id, completed=True).count()
    if completed_today >= 5:
        unlock_achievement(user_id, "Пять дней подряд")
    # Добавьте другие условия для достижений, если необходимо


# Функция для расчета ежедневного прогресса
def calculate_daily_progress(user_id):
    today = datetime.utcnow().date()
    print(f"[DEBUG] Calculating daily progress for user {user_id} on {today}")

    habits = Habit.query.filter_by(user_id=user_id).all()
    print(f"[DEBUG] User {user_id} habits: {[habit.id for habit in habits]}")

    completions_today = HabitCompletion.query.filter(
        HabitCompletion.date == today,
        HabitCompletion.habit_id.in_([habit.id for habit in habits])
    ).count()
    print(f"[DEBUG] Completions today for user {user_id}: {completions_today}")

    if len(habits) == 0:
        print(f"[DEBUG] No habits found for user {user_id}")
        return 0

    daily_progress = (completions_today / len(habits)) * 100
    print(f"[DEBUG] Daily progress for user {user_id}: {daily_progress}%")
    return daily_progress


# Функция для расчета месячного прогресса
def calculate_monthly_progress(user_id):
    """
    Рассчитывает месячный прогресс пользователя.
    """
    today = datetime.utcnow().date()
    habits = Habit.query.filter_by(user_id=user_id).all()
    if not habits:
        return 0

    current_month = today.month
    current_year = today.year

    # Рассчитываем количество дней в месяце с учетом года
    if current_month == 12:
        days_in_month = 31  # Декабрь всегда имеет 31 день
    else:
        days_in_month = (datetime(current_year, current_month + 1, 1) - timedelta(days=1)).day

    completed_days = 0
    for day in range(1, days_in_month + 1):
        date = datetime(current_year, current_month, day).date()
        completions = HabitCompletion.query.filter(
            HabitCompletion.date == date,
            HabitCompletion.habit_id.in_([habit.id for habit in habits])
        ).all()

        if completions and len(completions) == len(habits):
            completed_days += 1

    monthly_progress = (completed_days / days_in_month) * 100
    print(f"[DEBUG] Monthly progress for user {user_id}: {monthly_progress}%")
    return monthly_progress





#МАРШРУТЫ

# Главная страница для регистрации
@app.route('/')
def registration_page():
    return render_template('registration.html')


# Маршрут для регистрации
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()  # Убедимся, что данные приходят как JSON
        print("Полученные данные:", data)

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        print("Имя пользователя:", username, "Email:", email, "Пароль:", password)

        # Проверяем, заполнены ли все поля
        if not username or not email or not password:
            print("Ошибка: не все поля заполнены")
            return jsonify({"message": "Заполните все поля"}), 400

        if len(password) < 6:
            print("Ошибка: слишком короткий пароль")
            return jsonify({"message": "Пароль должен содержать не менее 6 символов"}), 400

        # Проверяем наличие пользователя
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            print("Ошибка: пользователь уже существует")
            return jsonify({"message": "Пользователь с таким именем или почтой уже существует"}), 409

        # Хэшируем пароль и создаем нового пользователя
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)

        db.session.add(new_user)
        db.session.commit()

        print("Пользователь успешно зарегистрирован")
        return jsonify({"message": "Пользователь успешно зарегистрирован"}), 201
    except Exception as e:
        print("Ошибка:", e)
        return jsonify({"message": "Ошибка сервера"}), 500


# Маршрут для входа
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user_id": user.id
        }), 200
    return jsonify({"success": False, "message": "Invalid username or password"}), 401


# Маршрут для загрузки главной страницы
@app.route('/main')
def main_page():
    return render_template('main.html')


# Маршрут для создания новой привычки
@app.route('/api/habits', methods=['POST'])
def create_habit():
    try:
        data = request.get_json()
        print("Полученные данные:", data)

        user_id = data.get('user_id')  # Ensure this is passed from the frontend
        name = data.get('name')

        if not all([user_id, name]):
            print("Ошибка: отсутствуют обязательные поля user_id или name")
            return jsonify({"message": "User ID and name are required"}), 400

        description = data.get('description', None)
        recurrence = data.get('recurrence', None)
        reminder_text = data.get('reminder_text', None)
        reminder_time = data.get('reminder_time', None)

        # Create a new habit
        new_habit = Habit(
            user_id=user_id,
            name=name,
            description=description,
            recurrence=recurrence,
            reminder_text=reminder_text,
            reminder_time=reminder_time,
            date_created=datetime.now(),
            completed=False
        )

        db.session.add(new_habit)
        db.session.commit()
        print("Привычка успешно добавлена")

        # Проверяем достижения после добавления привычки
        check_achievements_on_habit_creation(user_id)

        return jsonify({"message": "Habit added successfully"}), 201

    except Exception as e:
        print(f"Ошибка при создании привычки: {e}")
        return jsonify({"message": "Error while creating habit"}), 500


# Маршрут для получения привычек пользователя
@app.route('/api/habits/<int:user_id>', methods=['GET'])
def get_habits(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        habits = Habit.query.filter_by(user_id=user_id).all()
        habits_list = []
        today = datetime.utcnow().date()

        for habit in habits:
            # Проверяем выполнение привычки для текущей даты
            completed_today = HabitCompletion.query.filter_by(
                habit_id=habit.id,
                date=today
            ).first() is not None

            habits_list.append({
                "id": habit.id,
                "name": habit.name,
                "description": habit.description,
                "recurrence": habit.recurrence,
                "reminder_text": habit.reminder_text,
                "reminder_time": habit.reminder_time.strftime('%H:%M') if habit.reminder_time else None,
                "date_created": habit.date_created.strftime('%Y-%m-%d %H:%M:%S'),
                "completed": completed_today,  # Проверка выполнения
                "streak_count": habit.streak_count,
            })

        return jsonify({"success": True, "habits": habits_list}), 200
    except Exception as e:
        print("Error fetching habits:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


# Маршрут для удаления привычки
@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get(habit_id)
    if habit:
        db.session.delete(habit)
        db.session.commit()
        return jsonify({"success": True, "message": "Habit deleted successfully"}), 200
    return jsonify({"success": False, "message": "Habit not found"}), 404



# Маршрут для переключения статуса привычки (выполнена/не выполнена)
@app.route('/api/habits/<int:habit_id>/complete', methods=['PATCH'])
def toggle_habit_complete(habit_id):
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({"success": False, "message": "Habit not found"}), 404

    # Получаем дату из запроса
    selected_date = request.json.get('selected_date')
    if not selected_date:
        return jsonify({"success": False, "message": "Selected date is required"}), 400

    selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()

    # Проверяем выполнение привычки на указанную дату
    completion = HabitCompletion.query.filter_by(habit_id=habit_id, date=selected_date).first()

    if completion:
        # Если привычка была выполнена, снимаем выполнение
        db.session.delete(completion)
        if habit.streak_count > 0:
            habit.streak_count -= 1
    else:
        # Помечаем привычку как выполненную
        new_completion = HabitCompletion(habit_id=habit_id, date=selected_date)
        db.session.add(new_completion)

        # Проверяем выполнение на предыдущий день
        previous_date = selected_date - timedelta(days=1)
        previous_completion = HabitCompletion.query.filter_by(habit_id=habit_id, date=previous_date).first()

        if previous_completion:
            habit.streak_count += 1
        else:
            habit.streak_count = 1

    db.session.commit()
    return jsonify({"success": True, "completed": not completion, "streak_count": habit.streak_count})

# Маршрут для обновления профиля
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({"message": "User ID is required"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        # Обработка загрузки аватара
        if 'avatar' in request.files:
            avatar = request.files['avatar']
            if avatar and allowed_file(avatar.filename):
                filename = secure_filename(avatar.filename)
                avatar_path = os.path.join(app.config['UPLOAD_FOLDER'], f"user_{user_id}_{filename}")
                avatar.save(avatar_path)
                user.avatar = avatar_path  # Сохраняем путь к аватару в базе данных

        # Обработка обновления имени пользователя и email
        username = request.form.get('username')
        email = request.form.get('email')
        new_username = request.form.get('new_username')

        print(f"Полученные данные: user_id={user_id}, username={username}, new_username={new_username}, email={email}")

        if new_username:
            # Проверка уникальности нового имени пользователя
            if User.query.filter_by(username=new_username).first():
                return jsonify({"message": "Новое имя пользователя уже занято"}), 409
            user.username = new_username

        if email:
            # Проверка уникальности нового email
            if User.query.filter_by(email=email).first():
                return jsonify({"message": "Этот email уже используется"}), 409
            user.email = email

        db.session.commit()
        print("Данные пользователя успешно обновлены")
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при обновлении профиля: {e}")
        return jsonify({"message": f"Error updating profile: {str(e)}"}), 500


# Маршрут для получения данных пользователя
@app.route('/api/user-data', methods=['GET'])
def get_user_data():
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username is required"}), 400

    user = User.query.filter_by(username=username).first()
    if user:
        avatar_url = user.avatar if user.avatar else "/assets/default-avatar.png"
        return jsonify({
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": url_for('static', filename=os.path.join('avatars', os.path.basename(
                avatar_url))) if user.avatar else "/assets/default-avatar.png"
        }), 200
    return jsonify({"message": "User not found"}), 404


# Маршрут для получения достижений пользователя
@app.route('/api/achievements/<int:user_id>', methods=['GET'])
def get_user_achievements(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user_achievement_ids = [ua.achievement_id for ua in user.user_achievements]
    achievements = Achievement.query.all()
    achievements_list = []
    for ach in achievements:
        achievements_list.append({
            "id": ach.id,
            "name": ach.name,
            "description": ach.description,
            "img": ach.img,
            "achieved": ach.id in user_achievement_ids,
            "achieved_date": next((ua.achieved_date.strftime('%Y-%m-%d %H:%M:%S') for ua in user.user_achievements if
                                   ua.achievement_id == ach.id), None)
        })
    return jsonify({"achievements": achievements_list}), 200



# Маршрут для получения прогресса
@app.route('/api/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400

    try:
        daily_progress = calculate_daily_progress(user_id)
        monthly_progress = calculate_monthly_progress(user_id)

        return jsonify({
            "daily_progress": daily_progress,
            "monthly_progress": monthly_progress
        })
    except Exception as e:
        print("Error calculating progress:", e)
        return jsonify({"success": False, "message": "Server error"}), 500




# Маршрут для получения статики
@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)


# Основной блок запуска приложения
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        initialize_achievements()  # Инициализируем достижения
    app.run(debug=True)
