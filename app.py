from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from werkzeug.utils import secure_filename
from sqlalchemy import Column, Integer, String, LargeBinary
import os

app = Flask(__name__)
bcrypt = Bcrypt(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:89168117733@localhost/habit_tracker_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Модель пользователя
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    avatar = db.Column(LargeBinary, nullable=True) 


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




UPLOAD_FOLDER = 'static/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



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
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user_id": user.id,
            "username": user.username
        }), 200
    return jsonify({"success": False, "message": "Invalid username or password"}), 401


# Маршрут для загрузки главной страницы
@app.route('/main')
def main_page():
    return render_template('main.html')



habits = []

# Маршрут для создания новой привычки
@app.route('/api/habits', methods=['GET', 'POST'])
def handle_habits():
    if request.method == 'POST':
        # Обработка POST
        data = request.get_json()
        print("POST запрос - данные:", data)
        return jsonify({"success": True, "message": "Habit created successfully"}), 201
    elif request.method == 'GET':
        return jsonify(habits)



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



# Маршрут для окна профиля
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    try:
        username = request.form.get('username')
        new_username = request.form.get('new_username')
        email = request.form.get('email')

        print(f"Полученные данные: username={username}, new_username={new_username}, email={email}")

        # Найти пользователя и обновить данные
        user = User.query.filter_by(username=username).first()
        if not user:
            print("Пользователь не найден")
            return jsonify({"message": "User not found"}), 404

        if new_username:
            user.username = new_username
        if email:
            user.email = email

        db.session.commit()
        print("Данные пользователя успешно обновлены")
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
        return jsonify({
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar or "/static/avatars/default.png"
        }), 200
    return jsonify({"message": "User not found"}), 404












if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
