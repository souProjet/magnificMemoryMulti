import { compareHash } from "./hash.js";

let email = document.getElementById("email");
let password = document.getElementById("password");
let submitButton = document.querySelector(".submit-button");
let userNotFound = document.querySelector(".user-not-found");

function getUserByEmail(email) {
    let users = JSON.parse(localStorage.getItem("users") ?? '[]');
    return users.find(user => user.email === email);
}

submitButton.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!email.value || !password.value) {
        userNotFound.textContent = "Veuillez remplir tous les champs";
        userNotFound.classList.add("show");
        return;
    }

    let user = getUserByEmail(email.value);
    if (!user) {
        userNotFound.textContent = "Email ou mot de passe incorrect";
        userNotFound.classList.add("show");
        return;
    }

    try {
        if (await compareHash(password.value, user.password)) {
            const expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 1);
            document.cookie = `token=${user.token}; path=/; expires=${expirationDate.toUTCString()}`;
            window.location.href = "/profile.html";
        } else {
            userNotFound.textContent = "Email ou mot de passe incorrect";
            userNotFound.classList.add("show");
        }
    } catch (error) {
        console.error(error);
        userNotFound.textContent = "Une erreur est survenue, veuillez réessayer";
        userNotFound.classList.add("show");
    }
});

email.addEventListener("input", () => {
    userNotFound.textContent = "";
    userNotFound.classList.remove("show");
});

password.addEventListener("input", () => {
    userNotFound.textContent = "";
    userNotFound.classList.remove("show");
});
