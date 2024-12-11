from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.exc import IntegrityError
from datetime import datetime

app = Flask(__name__)
bcrypt = Bcrypt(app)

# Настройка подключения к базе данных PostgreSQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1324@localhost/priv'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# Модель пользователя
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)


# Модель привычки
class Habit(db.Model):
    __tablename__ = 'habits'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    reminder_text = db.Column(db.String(100))
    recurrence = db.Column(db.String(50))
    date_created = db.Column(db.Date, default=datetime.today)
    completed = db.Column(db.Boolean, default=False)

    user = db.relationship('User', backref=db.backref('habits', lazy=True))


# Главная страница для регистрации
@app.route('/')
def registration_page():
    return render_template('registration.html')


# Маршрут для регистрации
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return jsonify({"message": "Заполните все поля"}), 400

    new_user = User(username=username, email=email, password=bcrypt.generate_password_hash(password).decode('utf-8'))

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Username or email already exists"}), 409


# Маршрут для входа
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({"success": True, "message": "Login successful", "user_id": user.id})
    return jsonify({"success": False, "message": "Invalid username or password"}), 401


# Маршрут для загрузки главной страницы
@app.route('/main')
def main_page():
    return render_template('main.html')


# Маршрут для получения данных пользователя (например, имя пользователя, прогресс и т.д.)
@app.route('/api/user-data')
def get_user_data():
    user_id = request.args.get('user_id')
    user = User.query.get(user_id)
    if user:
        progress_days = Habit.query.filter_by(user_id=user_id, completed=True).count()
        return jsonify({"username": user.username, "progressDays": progress_days})
    return jsonify({"message": "User not found"}), 404


# Маршрут для создания новой привычки
@app.route('/api/habits', methods=['POST'])
def create_habit():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        habit_name = data.get('habit_name')
        description = data.get('description')
        reminder_text = data.get('reminder_text')
        recurrence = data.get('recurrence')

        if not all([user_id, habit_name]):
            return jsonify({"message": "User ID and habit name are required"}), 400

        new_habit = Habit(
            user_id=user_id,
            name=habit_name,
            description=description,
            reminder_text=reminder_text,
            recurrence=recurrence
        )

        db.session.add(new_habit)
        db.session.commit()
        return jsonify({"success": True, "message": "Habit created successfully", "habit_id": new_habit.id}), 201
    except Exception as e:
        db.session.rollback()
        print("Error:", e)
        return jsonify({"success": False, "message": "Failed to create habit"}), 400


# Маршрут для удаления привычки
@app.route('/api/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    habit = Habit.query.get(habit_id)
    if habit:
        db.session.delete(habit)
        db.session.commit()
        return jsonify({"success": True, "message": "Habit deleted successfully"})
    return jsonify({"success": False, "message": "Habit not found"}), 404


# Маршрут для отметки привычки как выполненной
@app.route('/api/habits/<int:habit_id>/complete', methods=['PATCH'])
def complete_habit(habit_id):
    habit = Habit.query.get(habit_id)
    if habit:
        habit.completed = True
        db.session.commit()
        return jsonify({"success": True, "message": "Habit marked as completed"})
    return jsonify({"success": False, "message": "Habit not found"}), 404


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
