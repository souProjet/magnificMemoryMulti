import { hash } from "./hash.js";
let username = document.getElementById("username-input");
let email = document.getElementById("email");
let password = document.getElementById("password");
let submitButton = document.querySelector(".submit-button");
let strengthSections = document.querySelectorAll('.strength-section');
let emailErrorMessage = document.querySelector(".email-error-message");
let usernameErrorMessage = document.querySelector(".username-error-message");

function getPasswordStrength(password) {
    if (!password) return -1;
    if (password.length < 6) return 0; // Faible
    if (password.length >= 9 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) return 2; // Fort
    if (password.length >= 6 && (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password))) return 1; // Moyen
    return -1;
}

function updateStrengthDisplay(strength) {
    strengthSections.forEach((section, index) => {
        section.setAttribute('data-active', index <= strength ? 'true' : 'false');
    });
}

password.addEventListener('input', function () {
    const strength = getPasswordStrength(this.value);
    updateStrengthDisplay(strength);
});

function validator(type, value, confirmValue) {
    let usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid = false;
    let message = "";

    switch (type) {
        case "username":
            isValid = usernameRegex.test(value);
            message = isValid ? "" : "Nom d'utilisateur invalide";
            return { isValid, message };
        case "email":
            isValid = emailRegex.test(value);
            message = isValid ? "" : "Email invalide";
            return { isValid, message };
        case "password":
            isValid = value.length >= 6 && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value) && /[A-Za-z]/.test(value);
            message = isValid ? "" : "Le mot de passe doit contenir au moins 6 caractères, un chiffre, un symbole et des lettres";
            return { isValid, message };
        case "confirmPassword":
            isValid = value === confirmValue;
            message = isValid ? "" : "Les mots de passe ne correspondent pas";
            return { isValid, message };
        default:
            return { isValid: false, message: "Erreur" };
    }
}

function emailOrUsernameExists(email, username) {
    let users = JSON.parse(localStorage.getItem("users") ?? '[]');
    if (users.some(user => user.email.toLowerCase() === email.toLowerCase())) {
        return 1;
    }
    if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        return 2;
    }
    return -1;
}

submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    let usernameResult = validator("username", username.value);
    let emailResult = validator("email", email.value);
    let passwordResult = validator("password", password.value);

    let hasError = false;

    if (!usernameResult.isValid) {
        usernameErrorMessage.textContent = usernameResult.message;
        username.parentElement.classList.add("error");
        hasError = true;
    } else {
        username.parentElement.classList.remove("error");
    }

    if (!emailResult.isValid) {
        emailErrorMessage.textContent = emailResult.message;
        email.parentElement.classList.add("error");
        hasError = true;
    } else {
        email.parentElement.classList.remove("error");
    }
    if (!passwordResult.isValid) {
        password.parentElement.classList.add("error");
        hasError = true;
    } else {
        password.parentElement.classList.remove("error");
    }  

    let emailOrUsernameExistsResult = emailOrUsernameExists(email.value, username.value);

    if (emailOrUsernameExistsResult !== -1) {
        if (emailOrUsernameExistsResult === 1) {
            email.parentElement.classList.add("error");
            emailErrorMessage.textContent = "Cet email est déjà utilisé";
        } else {
            username.parentElement.classList.add("error");
            usernameErrorMessage.textContent = "Ce nom d'utilisateur est déjà pris";
        }
        hasError = true;
    }

    if (hasError) {
        applyWizzEffect();
        return;
    }

    function applyWizzEffect() {
        const body = document.body;
        body.classList.add('wizz');
        setTimeout(() => {
            body.classList.remove('wizz');
        }, 500);
    }

    if (usernameResult.isValid && emailResult.isValid && passwordResult.isValid) {
        document.querySelector(".success-message").classList.add("show");
        let currentLocalStorage = JSON.parse(localStorage.getItem("users") ?? '[]');
        try {
            let hashedPassword = await hash(password.value);
            let token = getToken(16);
            let newUser =
            {
                username: username.value,
                email: email.value,
                password: hashedPassword,
                token: token
            }
            currentLocalStorage.push(newUser);
            localStorage.setItem("users", JSON.stringify(currentLocalStorage));
            username.value = "";
            email.value = "";
            password.value = "";

            updateStrengthDisplay(-1);

            setTimeout(() => {
                document.querySelector(".success-message").classList.remove("show");
                window.location.href = "/login.html";
            }, 3000);
        } catch (error) {
            console.error(error);
        }
    } else {
        document.querySelector(".success-message").classList.remove("show");
    }
});

function getToken(length) {
    return Math.random().toString(36).substring(2, length + 2);
}
