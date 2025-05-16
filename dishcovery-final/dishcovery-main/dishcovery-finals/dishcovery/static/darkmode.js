const themeSwitch = document.getElementById("theme-switch");

// Get the current username (set dynamically after login)
const currentUser = localStorage.getItem("currentUser");

// Get the dark mode preference for the current user
let darkmode = currentUser ? localStorage.getItem(`${currentUser}-darkmode`) : null;

if (!darkmode) {
    localStorage.setItem(`${currentUser}-darkmode`, "null");
    darkmode = "null";
}

const enableDarkmode = () => {
    document.body.classList.add("darkmode");
    if (currentUser) {
        localStorage.setItem(`${currentUser}-darkmode`, "active");
    }
};

const disableDarkmode = () => {
    document.body.classList.remove("darkmode");
    if (currentUser) {
        localStorage.setItem(`${currentUser}-darkmode`, "null");
    }
};

// Apply the saved mode on page load
if (darkmode === "active") {
    enableDarkmode();
} else {
    disableDarkmode();
}

// Toggle dark mode on button click
if (themeSwitch) {
    themeSwitch.addEventListener("click", () => {
        darkmode = localStorage.getItem(`${currentUser}-darkmode`);
        if (darkmode !== "active") {
            enableDarkmode();
        } else {
            disableDarkmode();
        }
    });
}

