document.getElementById("search-btn").addEventListener("click", () => {
    const ingredient = document.getElementById("ingredient-input").value.trim();
    const filter = document.getElementById("filter-select").value;

    if (ingredient === "") {
        alert("Please enter an ingredient!");
        return;
    }

    fetchRecipes(ingredient, filter);
});

async function fetchRecipes(ingredient, filter) {
    let url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        let meals = data.meals;

        if (filter) {
            meals = await applyFilter(meals, filter);
        }

        displayRecipes(meals);
    } catch (error) {
        console.error("Error fetching recipes:", error);
    }
}

async function applyFilter(meals, category) {
    const filteredMeals = [];

    for (const meal of meals) {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`);
        const details = await res.json();

        if (details.meals[0].strCategory === category) {
            filteredMeals.push(meal);
        }
    }

    return filteredMeals;
}

function displayRecipes(meals) {
    const recipesContainer = document.getElementById("recipes");
    const recommendationsSection = document.querySelector(".recommendation-section");
    
    recipesContainer.innerHTML = "";

    if (!meals || meals.length === 0) {
        recipesContainer.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    meals.forEach(meal => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("recipe-card");

        recipeCard.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>${meal.strMeal}</h3>
            <a href="https://www.themealdb.com/meal/${meal.idMeal}" target="_blank">View Recipe</a>
        `;

        recipesContainer.appendChild(recipeCard);
    });

    // Move recommendations below search results
    recipesContainer.insertAdjacentElement("afterend", recommendationsSection);
}

// Fetch random recommended recipes on page load
async function fetchRecommendedRecipes() {
    const recommendationsContainer = document.getElementById("recommendations");
    recommendationsContainer.innerHTML = "";

    for (let i = 0; i < 5; i++) {  // Fetch 5 random recipes
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
        <h3>${meal.strMeal}</h3>
        <a href="https://www.themealdb.com/meal/${meal.idMeal}" target="_blank">View Recipe</a>
    `;

    container.appendChild(recipeCard);
}

// Load recommendations when the page loads
window.onload = fetchRecommendedRecipes;

document.getElementById("logout-btn").addEventListener("click", () => {
    window.location.href = "../login/index.html";
});

// Chatbot script
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
                'Authorization': 'Bearer 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',
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
        console.log(data); // Log the response data

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

// Function to toggle chatbot visibility
function toggleChatbot() {
    const chatbotContainer = document.getElementById('chatbot-container');
    chatbotContainer.classList.toggle('hidden');
    chatbotContainer.classList.toggle('visible');
}