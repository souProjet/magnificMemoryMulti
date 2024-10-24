const logoutButton = document.querySelector(".logout-button");
const username = document.getElementById('username');
let usernameInput = document.getElementById('name');
let emailInput = document.getElementById('email');
let memoryChoice = document.getElementById('memoryChoice');
let memorySize = document.getElementById('memorySize');

logoutButton.addEventListener("click", () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
});

document.addEventListener('DOMContentLoaded', () => {

    const user = retrieveUser();
    if (user !== -1){
        username.textContent = "Bonjour " + user.username + " !";
        username.classList.remove('hidden');
        usernameInput.value = user.username;
        emailInput.value = user.email;
        memoryChoice.value = localStorage.getItem('memoryType').split(';')[0] || "animaux";
        memorySize.value = localStorage.getItem('memorySize') || "3x4";
        memoryChoice.dispatchEvent(new Event('change'));

        displayLastGames(user.username);
    } else {
        window.location.href = "/login.html";
    }
});


function retrieveUser() {
    const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    if (!token) {
        return -1;
    }

    //search user by token in localStorage
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(user => user.token === token);

    if (!user) {
        return -1;
    }

    return user;
}

function fillMemorySizeOptions(config) {
    for (let i = 0; i < config.length; i++) {
        memorySize.innerHTML += `<option value="${config[i]}">${config[i]}</option>`;
    }
}

function getAllConfigFromNbItem(nbItem) {
    let config = [];
    // On veut faire seulement des grilles de N x N, (N + 1) x N, N x (N + 1)
    // nbItem correspond au nombre total de cartes différentes, on peut donc faire des grilles de max nbItem * 2 cartes
    // Les tailles minimum sont 3x4, 4x3 et 4x4
    // Dans config on veut des paires qui correspondent au x et y de la grille
    // Donc x * y <= nbItem * 2 et x * y doit être pair
    for (let n = 3; n * n <= nbItem * 2; n++) {
        // On ajoute les grilles de taille n x n si le nombre total de cases est pair
        if (n * n <= nbItem * 2 && (n * n) % 2 === 0) {
            config.push(`${n}x${n}`);
        }

        // On ajoute les grilles de taille n x (n + 1) et (n + 1) x n si le nombre total de cases est pair
        if (n * (n + 1) <= nbItem * 2 && (n * (n + 1)) % 2 === 0) {
            config.push(`${n}x${n+1}`);
            config.push(`${n+1}x${n}`);
        }
    }
    let lastConfig = localStorage.getItem('memorySize');
    let newActiveSize = config.includes(lastConfig) ? lastConfig : config[0];

    localStorage.setItem('memorySize', newActiveSize);
    return config;
}

memoryChoice.addEventListener('change', () => {
    memorySize.innerHTML = "";
    let nbItem = parseInt(memoryChoice.options[memoryChoice.selectedIndex].getAttribute('data-nb-item'));
    let imgExtension = memoryChoice.options[memoryChoice.selectedIndex].getAttribute('data-img-extension');
    //Add the choice in the localStorage
    localStorage.setItem('memoryType', memoryChoice.value + ';' + memoryChoice.options[memoryChoice.selectedIndex].textContent);
    localStorage.setItem('imgExtension', imgExtension);
    let config = getAllConfigFromNbItem(nbItem);
    fillMemorySizeOptions(config);

    memorySize.value = localStorage.getItem('memorySize');
});

memorySize.addEventListener('change', () => {
    localStorage.setItem('memorySize', memorySize.value);
});

// Fonction pour récupérer et afficher les 5 dernières parties
function displayLastGames(username) {
    // Récupérer les données des dernières parties depuis le localStorage ou une API
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    const myLastGames = scores.filter(score => score.pseudo === username);
    const lastGamesTable = document.getElementById('lastGamesTable');
    lastGamesTable.innerHTML = '';

    myLastGames.slice(0, 5).forEach(score => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="border border-gray-300 px-4 py-2">${score.gridType}</td>
            <td class="border border-gray-300 px-4 py-2">${score.gridSize}</td>
            <td class="border border-gray-300 px-4 py-2">${score.score}</td>
            <td class="border border-gray-300 px-4 py-2">${formatDate(score.date)}</td>
        `;
        lastGamesTable.appendChild(row);
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' });
}

