document.getElementById("login-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Dummy credentials (Replace with backend authentication)
    const validUser = "admin";
    const validPass = "password123";

    if (username === validUser && password === validPass) {
        alert("Login successful!");
        window.location.href = "../mainmenu/index.html"; // Redirect to main menu
    } else {
        document.getElementById("error-message").textContent = "Invalid username or password!";
    }
});
