from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
import requests

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Change this to a random secret key

# Configuring SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    """User Model"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Favorite(db.Model):
    """Favorite Model"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    meal_id = db.Column(db.String(50), nullable=False)

def fetch_recipes_from_api():
    """Fetch recipes from an external API (TheMealDB)"""
    api_url = "https://www.themealdb.com/api/json/v1/1/search.php?s="
    response = requests.get(api_url)
    
    if response.status_code == 200:
        data = response.json()
        recipes = []
        
        if 'meals' in data and data['meals']:
            for meal in data['meals']:
                recipes.append({
                    "id": meal["idMeal"],
                    "name": meal["strMeal"],
                    "image": meal["strMealThumb"],
                    "category": meal["strCategory"]
                })
        return recipes
    else:
        return []

def fetch_recipe_by_id(recipe_id):
    """Fetch details of a specific recipe from TheMealDB"""
    api_url = f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={recipe_id}"
    response = requests.get(api_url)

    if response.status_code == 200:
        data = response.json()
        if 'meals' in data and data['meals']:
            meal = data['meals'][0]

            ingredients = []
            for i in range(1, 21):
                ingredient = meal.get(f"strIngredient{i}")
                measurement = meal.get(f"strMeasure{i}")
                if ingredient and ingredient.strip():
                    ingredients.append(f"{measurement.strip()} {ingredient.strip()}")

            return {
                "id": meal["idMeal"],
                "name": meal["strMeal"],
                "image": meal["strMealThumb"],
                "category": meal["strCategory"],
                "instructions": meal["strInstructions"],
                "ingredients": ingredients
            }
    return None

def add_favorite(user_id, meal_id):
    """Add a meal to the user's favorites"""
    if not Favorite.query.filter_by(user_id=user_id, meal_id=meal_id).first():
        favorite = Favorite(user_id=user_id, meal_id=meal_id)
        db.session.add(favorite)
        db.session.commit()
        return True
    return False

def remove_favorite(user_id, meal_id):
    """Remove a meal from the user's favorites"""
    favorite = Favorite.query.filter_by(user_id=user_id, meal_id=meal_id).first()
    if favorite:
        db.session.delete(favorite)
        db.session.commit()
        return True
    return False

def get_favorites(user_id):
    """Get favorite meals for a user"""
    favorites = Favorite.query.filter_by(user_id=user_id).all()
    favorite_meals = []
    for favorite in favorites:
        meal = fetch_recipe_by_id(favorite.meal_id)
        if meal:
            favorite_meals.append(meal)
    return favorite_meals

def is_favorited(user_id, meal_id):
    """Check if a meal is favorited by the user"""
    return Favorite.query.filter_by(user_id=user_id, meal_id=meal_id).first() is not None

@app.route('/')
def home():
    """Displays Index or redirects logged-in users to Main Page"""
    if 'username' in session:
        return redirect(url_for('main'))
    return render_template('index.html')

@app.route('/login', methods=['POST'])
def login():
    """Handles user login"""
    username = request.form['username']
    password = request.form['password']
    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        session['username'] = username
        session['user_id'] = user.id
        return render_template('main.html', username=username)  # Pass username to set in localStorage
    return render_template('index.html', error='Invalid username or password.')

@app.route('/register', methods=['GET', 'POST'])
def register():
    """Handles user registration"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()

        if user:
            return render_template('register.html', error='Username already exists.')
        else:
            new_user = User(username=username)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            session['username'] = username
            session['user_id'] = new_user.id
            return redirect(url_for('main'))

    return render_template('register.html')

@app.route('/main')
def main():
    """Renders the DishCovery main page with recommended recipes"""
    if 'username' in session:
        recipes = fetch_recipes_from_api()
        return render_template('main.html', username=session['username'], recipes=recipes)
    return redirect(url_for('home'))

@app.route('/logout')
def logout():
    """Logs out user and redirects to home"""
    session.pop('username', None)
    session.pop('user_id', None)
    return redirect(url_for('home'))

@app.route('/recipe/<int:recipe_id>')
def recipe_detail(recipe_id):
    """Displays the details of a specific recipe"""
    recipe = fetch_recipe_by_id(recipe_id)
    if not recipe:
        return "Recipe not found", 404
    return render_template('recipe_detail.html', recipe=recipe)

@app.route('/search')
def search():
    """Search for recipes based on an ingredient"""
    ingredient = request.args.get('ingredient')
    filter_category = request.args.get('filter')

    if not ingredient:
        return {"recipes": []}

    api_url = f"https://www.themealdb.com/api/json/v1/1/filter.php?i={ingredient}"
    response = requests.get(api_url)

    if response.status_code == 200:
        data = response.json()
        recipes = []

        if 'meals' in data and data['meals']:
            for meal in data['meals']:
                recipe = {
                    "id": meal["idMeal"],
                    "name": meal["strMeal"],
                    "image": meal["strMealThumb"]
                }

                if filter_category:
                    meal_details_url = f"https://www.themealdb.com/api/json/v1/1/lookup.php?i={meal['idMeal']}"
                    meal_response = requests.get(meal_details_url)
                    meal_data = meal_response.json()

                    if "meals" in meal_data and meal_data["meals"]:
                        category = meal_data["meals"][0]["strCategory"]
                        if category != filter_category:
                            continue

                recipes.append(recipe)

        return {"recipes": recipes}

    return {"recipes": []}

@app.route('/favorites', methods=['GET'])
def favorites():
    """Fetch favorite recipes for the logged-in user"""
    if 'user_id' in session:
        user_id = session['user_id']
        favorites = get_favorites(user_id)
        return jsonify({'recipes': favorites})
    return jsonify({'recipes': []})

@app.route('/add-to-favorites', methods=['POST'])
def add_to_favorites():
    """Add a recipe to the user's favorites"""
    if 'user_id' in session:
        user_id = session['user_id']
        data = request.get_json()
        meal_id = data.get('mealId')

        if not meal_id:
            return jsonify({'success': False, 'message': 'No meal ID provided'}), 400

        success = add_favorite(user_id, meal_id)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Failed to add to favorites'}), 500
    return jsonify({'success': False, 'message': 'User not logged in'}), 401

@app.route('/remove-from-favorites', methods=['POST'])
def remove_from_favorites():
    """Remove a recipe from the user's favorites"""
    if 'user_id' in session:
        user_id = session['user_id']
        data = request.get_json()
        meal_id = data.get('mealId')

        if not meal_id:
            return jsonify({'success': False, 'message': 'No meal ID provided'}), 400

        success = remove_favorite(user_id, meal_id)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': 'Failed to remove from favorites'}), 500
    return jsonify({'success': False, 'message': 'User not logged in'}), 401

@app.route('/is-favorited', methods=['GET'])
def is_favorited_route():
    """Check if a recipe is favorited by the logged-in user"""
    if 'user_id' in session:
        user_id = session['user_id']
        meal_id = request.args.get('mealId')
        if not meal_id:
            return jsonify({'isFavorited': False})
        is_fav = is_favorited(user_id, meal_id)
        return jsonify({'isFavorited': is_fav})
    return jsonify({'isFavorited': False})

@app.route('/about')
def about():
    """Renders the About Us page"""
    return render_template('about_us.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Ensures DB is initialized
    app.run(debug=True)

