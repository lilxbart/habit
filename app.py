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
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1324@localhost/priv'
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

    # Если нужно отдельное поле completed (для "выполнена ли сегодня?"), раскомментируйте:
    # completed = db.Column(db.Boolean, default=False)

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
            "img": "/assets/achievement.png"
        },
        {
            "name": "Мастер планирования",
            "description": "Заведи привычки на месяц, заполнив свой календарь целей и задач.",
            "img": "/assets/achievement.png"
        },
        {
            "name": "Пять дней подряд",
            "description": "Поддержи свою привычку как минимум 5 дней подряд!",
            "img": "/assets/achievement.png"
        },
        {
            "name": "Первая выполненная привычка",
            "description": "Поздравляем с первой выполненной привычкой!",
            "img": "/assets/achievement.png"
        }
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
    # "Первые шаги": если у пользователя >= 1 привычка
    habit_count = Habit.query.filter_by(user_id=user_id).count()
    if habit_count >= 1:
        unlock_achievement(user_id, "Первые шаги")

    # "Мастер планирования": условие примерное - 30 привычек
    if habit_count >= 30:
        unlock_achievement(user_id, "Мастер планирования")


def check_achievements_on_habit_completion(user_id):
    # "Пять дней подряд": ищем привычку со streak_count >= 5
    habit_with_5_streak = Habit.query.filter_by(user_id=user_id).filter(Habit.streak_count >= 5).first()
    if habit_with_5_streak:
        unlock_achievement(user_id, "Пять дней подряд")

    # "Первая выполненная привычка": если есть хотя бы одна запись в HabitCompletion у этого user_id
    # То есть, если пользователь выполнил хотя бы одну привычку
    # Проверяем через объединение Habit -> HabitCompletion
    # (или можно проще: any(HabitCompletion.query.join(Habit).filter(Habit.user_id == user_id).all()))
    any_completion = db.session.query(HabitCompletion).join(Habit).filter(Habit.user_id == user_id).first()
    if any_completion:
        unlock_achievement(user_id, "Первая выполненная привычка")


# Функции прогресса
def calculate_daily_progress(user_id):
    local_tz = pytz.timezone('Europe/Moscow')
    today = datetime.now(local_tz).date()

    habits = Habit.query.filter_by(user_id=user_id).all()
    if not habits:
        return 0

    days_map = {0: "ПН", 1: "ВТ", 2: "СР", 3: "ЧТ", 4: "ПТ", 5: "СБ", 6: "ВС"}
    weekday_name = days_map[today.weekday()]

    valid_habits = [
        habit for habit in habits
        if habit.recurrence and weekday_name in habit.recurrence.split(', ')
    ]
    if not valid_habits:
        return 0

    completions_today = HabitCompletion.query.filter(
        HabitCompletion.date == today,
        HabitCompletion.habit_id.in_([h.id for h in valid_habits])
    ).count()

    daily_progress = (completions_today / len(valid_habits)) * 100
    return daily_progress


def calculate_monthly_progress(user_id):
    local_tz = pytz.timezone('Europe/Moscow')
    today = datetime.now(local_tz).date()

    habits = Habit.query.filter_by(user_id=user_id).all()
    if not habits:
        return 0

    current_month = today.month
    current_year = today.year

    if current_month == 12:
        days_in_month = 31
    else:
        days_in_month = (datetime(current_year, current_month + 1, 1, tzinfo=local_tz)
                         - timedelta(days=1)).day

    days_map = {0: "ПН", 1: "ВТ", 2: "СР", 3: "ЧТ", 4: "ПТ", 5: "СБ", 6: "ВС"}

    fully_completed_days = 0
    days_with_habits = 0

    for day in range(1, days_in_month + 1):
        date_ = datetime(current_year, current_month, day, tzinfo=local_tz).date()
        day_of_week = days_map[date_.weekday()]

        day_habits = [
            h for h in habits
            if h.recurrence and day_of_week in h.recurrence.split(', ')
        ]
        if not day_habits:
            continue

        days_with_habits += 1

        day_completions = HabitCompletion.query.filter(
            HabitCompletion.date == date_,
            HabitCompletion.habit_id.in_([h.id for h in day_habits])
        ).count()

        if day_completions == len(day_habits):
            fully_completed_days += 1

    if days_with_habits == 0:
        return 0

    monthly_progress = (fully_completed_days / days_with_habits) * 100
    return monthly_progress


# Маршруты

@app.route('/')
def registration_page():
    return render_template('registration.html')


@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print("Полученные данные:", data)

        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if not username or not email or not password:
            return jsonify({"message": "Заполните все поля"}), 400

        if len(password) < 6:
            return jsonify({"message": "Пароль должен содержать не менее 6 символов"}), 400

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            return jsonify({"message": "Пользователь с таким именем или почтой уже существует"}), 409

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(username=username, email=email, password=hashed_password)

        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Пользователь успешно зарегистрирован"}), 201
    except Exception as e:
        print("Ошибка:", e)
        return jsonify({"message": "Ошибка сервера"}), 500


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


@app.route('/main')
def main_page():
    return render_template('main.html')


@app.route('/api/habits', methods=['POST'])
def create_habit():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        name = data.get('name')

        if not all([user_id, name]):
            return jsonify({"message": "User ID and name are required"}), 400

        description = data.get('description', None)
        recurrence = data.get('recurrence', None)
        reminder_text = data.get('reminder_text', None)
        reminder_time = data.get('reminder_time', None)

        new_habit = Habit(
            user_id=user_id,
            name=name,
            description=description,
            recurrence=recurrence,
            reminder_text=reminder_text,
            reminder_time=reminder_time,
            date_created=datetime.now(),
            # completed=False
        )

        db.session.add(new_habit)
        db.session.commit()

        # Проверяем достижения после добавления привычки
        check_achievements_on_habit_creation(user_id)
        return jsonify({"message": "Habit added successfully"}), 201

    except Exception as e:
        print(f"Ошибка при создании привычки: {e}")
        return jsonify({"message": "Error while creating habit"}), 500


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
                "completed": completed_today,
                "streak_count": habit.streak_count,
            })

        return jsonify({"success": True, "habits": habits_list}), 200
    except Exception as e:
        print("Error fetching habits:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get(habit_id)
    if habit:
        db.session.delete(habit)
        db.session.commit()
        return jsonify({"success": True, "message": "Habit deleted successfully"}), 200
    return jsonify({"success": False, "message": "Habit not found"}), 404


@app.route('/api/habits/<int:habit_id>/complete', methods=['PATCH'])
def toggle_habit_complete(habit_id):
    habit = Habit.query.get(habit_id)
    if not habit:
        return jsonify({"success": False, "message": "Habit not found"}), 404

    selected_date = request.json.get('selected_date')
    if not selected_date:
        return jsonify({"success": False, "message": "Selected date is required"}), 400

    selected_date = datetime.strptime(selected_date, '%Y-%m-%d').date()
    completion = HabitCompletion.query.filter_by(habit_id=habit_id, date=selected_date).first()

    if completion:
        db.session.delete(completion)
        if habit.streak_count > 0:
            habit.streak_count -= 1
    else:
        new_completion = HabitCompletion(habit_id=habit_id, date=selected_date)
        db.session.add(new_completion)

        previous_date = selected_date - timedelta(days=1)
        previous_completion = HabitCompletion.query.filter_by(habit_id=habit_id, date=previous_date).first()

        if previous_completion:
            habit.streak_count += 1
        else:
            habit.streak_count = 1

    db.session.commit()

    # Проверяем достижения
    check_achievements_on_habit_completion(habit.user_id)

    return jsonify({"success": True, "completed": not completion, "streak_count": habit.streak_count})


@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        user_id = request.form.get('user_id')
        if not user_id:
            return jsonify({"message": "User ID is required"}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({"message": "User not found"}), 404

        if 'avatar' in request.files:
            avatar = request.files['avatar']
            if avatar and allowed_file(avatar.filename):
                filename = secure_filename(avatar.filename)
                avatar_path = os.path.join(app.config['UPLOAD_FOLDER'], f"user_{user_id}_{filename}")
                avatar.save(avatar_path)
                user.avatar = avatar_path

        username = request.form.get('username')
        email = request.form.get('email')
        new_username = request.form.get('new_username')

        if new_username:
            if User.query.filter_by(username=new_username).first():
                return jsonify({"message": "Новое имя пользователя уже занято"}), 409
            user.username = new_username

        if email:
            if User.query.filter_by(email=email).first():
                return jsonify({"message": "Этот email уже используется"}), 409
            user.email = email

        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при обновлении профиля: {e}")
        return jsonify({"message": f"Error updating profile: {str(e)}"}), 500


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
            "avatar": url_for('static', filename=os.path.join('avatars', os.path.basename(avatar_url))) if user.avatar else "/assets/default-avatar.png"
        }), 200
    return jsonify({"message": "User not found"}), 404


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
            "achieved_date": next((ua.achieved_date.strftime('%Y-%m-%d %H:%M:%S')
                                   for ua in user.user_achievements
                                   if ua.achievement_id == ach.id), None)
        })
    return jsonify({"achievements": achievements_list}), 200


@app.route('/api/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400

    try:
        daily_progress = calculate_daily_progress(user_id)
        monthly_progress = calculate_monthly_progress(user_id)

        return jsonify({
            "success": True,
            "daily_progress": daily_progress,
            "monthly_progress": monthly_progress
        })
    except Exception as e:
        print("Error calculating progress:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        initialize_achievements()
    app.run(debug=True)
