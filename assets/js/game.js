let memory_type = localStorage.getItem('memoryType') ? localStorage.getItem('memoryType').split(';')[0] : "animaux";
let memory_type_name = localStorage.getItem('memoryType') ? localStorage.getItem('memoryType').split(';')[1] : "Animaux";
let memory_size = localStorage.getItem('memorySize') || "3x4";
let img_extension = localStorage.getItem('imgExtension') || "webp";

let img_path = '../assets/img/ressources/' + memory_type + '/';
let grid_size = parseInt(memory_size.split('x')[0]) * parseInt(memory_size.split('x')[1]);

let block_click = false;
let returned_cards = [];
let game_finished = false;
const user_message = document.getElementById('user-message');
const reset_btn = document.getElementById('reset-btn');
let nbRounds = 0;
const username = document.getElementById('username');
const memoryChoice = document.getElementById('memoryChoice');
const memorySize = document.getElementById('memorySize');


const successMessageList = [
    "Bien joué !",
    "C'est une paire !",
    "Trouvé !",
    "C'est une paire !",
    "Bien joué !"
]

const errorMessageList = [
    "Non, ce n'est pas une paire",
    "Dommage !",
    "Ce n'est pas une paire",
    "Aïe ! Retente ta chance !"
]

document.addEventListener('DOMContentLoaded', () => {

    const user = retrieveUser();
    if (user !== -1) {
        username.textContent = "Bonjour " + user.username + " !";
        username.classList.remove('hidden');
    }

    memoryChoice.value = memory_type;
    let config = getAllConfigFromNbItem(grid_size);
    fillMemorySizeOptions(config);
    memorySize.value = memory_size;

    generateGrid();

    // afficher le tableau des meilleurs scores
    displayBestScores();
});

// Gestionnaire d'événements pour le changement de type de mémoire
memoryChoice.addEventListener('change', () => {
    memory_type = memoryChoice.value;
    memory_type_name = memoryChoice.options[memoryChoice.selectedIndex].textContent;
    img_extension = memoryChoice.options[memoryChoice.selectedIndex].getAttribute('data-img-extension');
    img_path = '../assets/img/ressources/' + memory_type + '/';
    
    let maxItems = parseInt(memoryChoice.options[memoryChoice.selectedIndex].getAttribute('data-nb-item'));
    let config = getAllConfigFromNbItem(maxItems);
    let lastMemorySize = memorySize.value;
    fillMemorySizeOptions(config);
    
    memorySize.value = config.includes(lastMemorySize) ? lastMemorySize : config[0];
    
    memory_size = memorySize.value;
    grid_size = parseInt(memory_size.split('x')[0]) * parseInt(memory_size.split('x')[1]);

    initializeGame();
});

// Gestionnaire d'événements pour le changement de taille de mémoire
memorySize.addEventListener('change', () => {
    memory_size = memorySize.value;
    grid_size = parseInt(memory_size.split('x')[0]) * parseInt(memory_size.split('x')[1]);
    initializeGame()
});


// Fonction pour initialiser le jeu
function initializeGame() {
    resetGame();
    generateGrid();
}

function resetGame() {
    returned_cards = [];
    nbRounds = 0;
    game_finished = false;
    user_message.textContent = 'Bienvenue sur MagnificMemory ! Commencez à retourner les cartes pour trouver les paires.';
}


function generateGrid() {
    const [rows, cols] = memory_size.split('x').map(Number);
    const gameGrid = document.getElementById('gamegrid');
    const gridWidth = Math.min(500, window.innerWidth * 0.7);
    const cardSize = Math.floor(gridWidth / cols) - 8;

    gameGrid.style.cssText = `
        grid-template-columns: repeat(${cols}, 1fr);
        grid-template-rows: repeat(${rows}, 1fr);
        width: ${gridWidth}px;
        height: ${(cardSize + 8) * rows}px;
    `;
    gameGrid.innerHTML = '';

    const img_tab = genRandomGrid(grid_size);
    const cards = Array.from({length: grid_size}, () => createCard(cardSize));
    cards.forEach((card, i) => {
        card.querySelector('.front').style.backgroundImage = `url(${img_path}${img_tab[i]}.${img_extension})`;
        gameGrid.appendChild(card);
    });

    addCardEventListeners(cards);
}

function createCard(size) {
    const card = document.createElement('div');
    card.classList.add('memory-card');
    card.style.width = card.style.height = `${size}px`;
    card.innerHTML = '<div class="front"></div><div class="back"></div>';
    return card;
}

function addCardEventListeners(cards) {
    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (block_click || game_finished || card.classList.contains('matched')) return;
            card.classList.toggle('flipped');
            returned_cards.push(card);
            if (returned_cards.length % 2 === 0) {
                block_click = true;
                nbRounds++;
                checkIfPair(returned_cards.slice(-2));
            }
        });
    });
}

function fillMemorySizeOptions(config) {
    memorySize.innerHTML = config.map(size => `<option value="${size}">${size}</option>`).join('');
}


// Fonction pour obtenir toutes les configurations possibles
function getAllConfigFromNbItem(nbItem) {
    let config = [];
    for (let n = 3; n * n <= nbItem * 2; n++) {
        if (n * n <= nbItem * 2 && (n * n) % 2 === 0) {
            config.push(`${n}x${n}`);
        }
        if (n * (n + 1) <= nbItem * 2 && (n * (n + 1)) % 2 === 0) {
            config.push(`${n}x${n + 1}`);
            config.push(`${n + 1}x${n}`);
        }
    }
    return config;
}

function checkIfPair(cards) {
    if (cards[0].querySelector('.front').style.backgroundImage === cards[1].querySelector('.front').style.backgroundImage) {
        //l'utilisateur a trouvé une paire
        matchFound(cards);
    } else {
        //l'utilisateur a trouvé une mauvaise paire
        matchNotFound(cards);
    }
}

function matchFound(cards) {
    block_click = false;
    user_message.textContent = successMessageList[Math.floor(Math.random() * successMessageList.length)];

    cards[0].classList.add('matched');
    cards[1].classList.add('matched');

    if (returned_cards.length === grid_size) {
        game_finished = true;
        user_message.textContent = `Bravo ! Tu as trouvé toutes les paires en ${nbRounds} tours !`;
        saveScore();
    }

    setTimeout(() => {
        if (returned_cards.length !== grid_size) {
            user_message.textContent = '';
        }
    }, 1000);
}

function matchNotFound(cards) {
    user_message.textContent = errorMessageList[Math.floor(Math.random() * errorMessageList.length)];
    setTimeout(() => {
        cards[0].classList.toggle('flipped');
        cards[1].classList.toggle('flipped');
        returned_cards.splice(0, 2);
        block_click = false;
        user_message.textContent = '';
    }, 1000);
}

function genRandomGrid(grid_size) {
    let img_tab = [];
    for (let i = 1; i <= grid_size / 2; i++) {
        img_tab.push(i);
        img_tab.push(i);
    }
    img_tab = fisherYatesAlgo(img_tab);
    return img_tab;
}

function fisherYatesAlgo(tab) {
    for (let i = tab.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tab[i], tab[j]] = [tab[j], tab[i]];
    }
    return tab;
}



document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        initializeGame();
    }
});

const logoutButton = document.querySelector(".logout-button");

logoutButton.addEventListener("click", () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
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

function saveScore() {
    const user = retrieveUser();
    const pseudo = user !== -1 ? user.username : "Anonyme";
    const score = nbRounds;
    const gridSize = memory_size;
    const gridType = memory_type_name;
    const date = new Date().toISOString();

    const scoreData = {
        pseudo,
        score,
        gridSize,
        gridType,
        date
    };

    let scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push(scoreData);
    localStorage.setItem('scores', JSON.stringify(scores));

    displayBestScores();
}


function displayBestScores() {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];

    // Calculer le ratio pour chaque score
    scores.forEach(score => {
        const [rows, cols] = score.gridSize.split('x').map(Number);
        const gridSize = rows * cols;
        score.ratio = gridSize / score.score;
    });

    // Trier les scores du plus grand ratio au plus petit (meilleur au pire)
    scores.sort((a, b) => b.ratio - a.ratio);

    // Prendre les 5 meilleurs scores
    const topScores = scores.slice(0, 5);

    const scoreList = document.querySelector('#best-scores');
    scoreList.innerHTML = ''; // Vider la liste existante

    topScores.forEach(score => {
        const li = document.createElement('li');
        li.className = 'border-b pb-2';
        li.innerHTML = `
            <p class="font-semibold">${score.pseudo}</p>
            <p class="text-sm">Score: ${score.score} | Grille: ${score.gridSize}</p>
            <p class="text-sm">Type: ${score.gridType} | <date>${formatDate(score.date)}</date></p>
        `;
        scoreList.appendChild(li);
    });

    // Si moins de 5 scores, ajouter des éléments vides
    for (let i = topScores.length; i < 5; i++) {
        const li = document.createElement('li');
        li.className = 'border-b pb-2';
        li.innerHTML = '<p class="font-semibold">-</p><p class="text-sm">-</p><p class="text-sm">-</p><p class="text-sm">-</p>';
        scoreList.appendChild(li);
    }
}

function formatDate(date) {
    //retourne : le 1er janvier 2024 à 12h00
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' });
}
