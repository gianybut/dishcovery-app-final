// ✅ SEARCH FUNCTION
document.getElementById("search-btn").addEventListener("click", () => {
    const ingredient = document.getElementById("ingredient-input").value.trim();
    const filter = document.getElementById("filter-select").value;

    if (ingredient === "") {
        alert("Please enter an ingredient!");
        return;
    }

    fetch(`/search?ingredient=${ingredient}&filter=${filter}`)
        .then(response => response.json())
        .then(data => {
            displayRecipes(data.recipes);
        })
        .catch(error => console.error("Error fetching recipes:", error));
});

// ✅ DISPLAY RECIPES FUNCTION
function displayRecipes(meals) {
    const recipesContainer = document.querySelector(".recipe-grid"); // ✅ Ensures it updates correctly
    recipesContainer.innerHTML = ""; // Clear previous results

    if (!meals || meals.length === 0) {
        recipesContainer.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    meals.forEach(meal => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card");

        recipeCard.innerHTML = `
            <img src="${meal.image}" alt="${meal.name}">
            <h3>${meal.name} <button class="favorite-btn" data-id="${meal.id}">
                <img src="static/images/heart-empty.png" alt="Unfavorite">
                <img src="static/images/heart-filled.png" alt="Favorite" style="display: none;">
            </button></h3>
            <a href="/recipe/${meal.id}">View Recipe</a> <!-- ✅ Flask-compatible link -->
        `;

        recipesContainer.appendChild(recipeCard);

        // Add event listener for the favorite button
        const favoriteBtn = recipeCard.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', toggleFavorite);
        checkIfFavorited(meal.id, favoriteBtn);
    });
}

// ✅ FETCH RANDOM RECOMMENDED RECIPES
async function fetchRecommendedRecipes() {
    const recommendationsContainer = document.getElementById("recipe-grid");
    recommendationsContainer.innerHTML = "";

    for (let i = 0; i < 12; i++) {  
        try {
            const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
            const data = await response.json();
            displayRecommendation(data.meals[0], recommendationsContainer);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        }
    }
}

function displayRecommendation(meal, container) {
    const recipeCard = document.createElement("div");
    recipeCard.classList.add("recipe-card");

    recipeCard.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <h3>${meal.strMeal} <button class="favorite-btn" data-id="${meal.idMeal}">
            <img src="static/images/heart-empty.png" alt="Unfavorite">
            <img src="static/images/heart-filled.png" alt="Favorite" style="display: none;">
        </button></h3>
        <a href="/recipe/${meal.idMeal}">View Recipe</a>
    `;

    container.appendChild(recipeCard);

    // Add event listener for the favorite button
    const favoriteBtn = recipeCard.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', toggleFavorite);
    checkIfFavorited(meal.idMeal, favoriteBtn);
}

// ✅ RUN RECOMMENDATIONS ON PAGE LOAD
window.onload = fetchRecommendedRecipes;

// ✅ FIX LOGOUT FUNCTION FOR FLASK
document.getElementById("logout-btn").addEventListener("click", () => {
    window.location.href = "/logout";  // ✅ Flask logout route
});

async function toggleFavorite(event) {
    const mealId = event.target.closest('.favorite-btn').getAttribute('data-id');
    const isFavorited = event.target.closest('.favorite-btn').classList.contains('favorited');
    const url = isFavorited ? '/remove-from-favorites' : '/add-to-favorites';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mealId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
            const favoriteBtn = event.target.closest('.favorite-btn');
            favoriteBtn.classList.toggle('favorited');
            const [unfavoriteImg, favoriteImg] = favoriteBtn.querySelectorAll('img');
            if (isFavorited) {
                unfavoriteImg.style.display = 'block';
                favoriteImg.style.display = 'none';
            } else {
                unfavoriteImg.style.display = 'none';
                favoriteImg.style.display = 'block';
            }
            alert(isFavorited ? 'Removed from favorites!' : 'Added to favorites!');
        } else {
            alert(isFavorited ? 'Failed to remove from favorites.' : 'Failed to add to favorites.');
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
    }
}

async function checkIfFavorited(mealId, button) {
    try {
        const response = await fetch(`/is-favorited?mealId=${mealId}`);
        const result = await response.json();
        if (result.isFavorited) {
            button.classList.add('favorited');
            const [unfavoriteImg, favoriteImg] = button.querySelectorAll('img');
            unfavoriteImg.style.display = 'none';
            favoriteImg.style.display = 'block';
        }
    } catch (error) {
        console.error("Error checking if favorited:", error);
    }
}

document.getElementById('home-btn').addEventListener('click', () => {
    fetchRecommendedRecipes();
});

document.getElementById('favorites-btn').addEventListener('click', async () => {
    const recipesContainer = document.getElementById("recipe-grid");
    recipesContainer.innerHTML = "";

    try {
        const response = await fetch('/favorites');
        const data = await response.json();

        if (!data.recipes || data.recipes.length === 0) {
            recipesContainer.innerHTML = "<p>No favorite recipes found.</p>";
            return;
        }

        data.recipes.forEach(meal => {
            const recipeCard = document.createElement("div");
            recipeCard.classList.add("recipe-card");

            recipeCard.innerHTML = `
                <img src="${meal.image}" alt="${meal.name}">
                <h3>${meal.name} <button class="favorite-btn favorited" data-id="${meal.id}">
                    <img src="static/images/heart-empty.png" alt="Unfavorite" style="display: none;">
                    <img src="static/images/heart-filled.png" alt="Favorite">
                </button></h3>
                <a href="/recipe/${meal.id}">View Recipe</a>
            `;

            recipesContainer.appendChild(recipeCard);

            // Add event listener for the favorite button
            recipeCard.querySelector('.favorite-btn').addEventListener('click', toggleFavorite);
        });
    } catch (error) {
        console.error("Error fetching favorite recipes:", error);
    }
});

// ✅ CHATBOT SCRIPT
document.getElementById('chatbot-send').addEventListener('click', async () => {
    const input = document.getElementById('chatbot-input').value;
    const messagesContainer = document.getElementById('chatbot-messages');

    // Display user message
    const userMessage = document.createElement('div');
    userMessage.textContent = input;
    userMessage.className = 'user-message';
    messagesContainer.appendChild(userMessage);

    try {
        // Call OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer [ENTER API KEY OF AI CHAT BOT UPON DOWNLOADING FILE]', // Replace with real API key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "model": "moonshotai/moonlight-16b-a3b-instruct:free",
                "messages": [
                    {
                        "role": "user",
                        "content": input
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data); 

        // Display bot response
        const botMessage = document.createElement('div');
        botMessage.textContent = data.choices[0].message.content;
        botMessage.className = 'bot-message';
        messagesContainer.appendChild(botMessage);
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
    }

    // Clear input
    document.getElementById('chatbot-input').value = '';
});

// ✅ FUNCTION TO TOGGLE CHATBOT VISIBILITY
function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    chatbotContainer.classList.toggle('hidden');
    chatbotContainer.classList.toggle('visible');
}

// Function to show recommended recipes and hide favorite recipes
function showRecommendedRecipes() {
    document.getElementById('reco-recipes').style.display = 'block';
    document.getElementById('fav-recipes').style.display = 'none';
    fetchRecommendedRecipes(); // Fetch and display recommended recipes
}

// Function to show favorite recipes and hide recommended recipes
function showFavoriteRecipes() {
    document.getElementById('reco-recipes').style.display = 'none';
    document.getElementById('fav-recipes').style.display = 'block';
    fetchFavoriteRecipes(); // Fetch and display favorite recipes
}

// Event listener for the Home button
document.getElementById('home-btn').addEventListener('click', showRecommendedRecipes);

// Event listener for the Favorites button
document.getElementById('favorites-btn').addEventListener('click', showFavoriteRecipes);