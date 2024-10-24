const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Routes pour le frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'register.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'profile.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'game.html'));
});

// Connexion à la base de données SQLite
const db = new sqlite3.Database('./memory_game.db', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite');
        initializeDatabase();
    }
});

// Initialisation de la base de données
function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT UNIQUE,
        token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        memory_type TEXT,
        grid_size TEXT,
        score INTEGER,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
}

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté');

    socket.on('register', async (userData) => {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const token = generateToken(16);
            db.run('INSERT INTO users (username, password, email, token) VALUES (?, ?, ?, ?)', 
                [userData.username, hashedPassword, userData.email, token], 
                (err) => {
                    if (err) {
                        console.error('Erreur d\'enregistrement:', err.message);
                        socket.emit('registerResponse', { success: false, message: 'Erreur d\'enregistrement' });
                    } else {
                        socket.emit('registerResponse', { success: true, message: 'Enregistrement réussi' });
                    }
                }
            );
        } catch (error) {
            console.error('Erreur de hachage:', error);
            socket.emit('registerResponse', { success: false, message: 'Erreur d\'enregistrement' });
        }
    });

    socket.on('login', (loginData) => {
        if (loginData.anonymous) {
            const anonymousUsername = `Anonyme_${generateToken(6)}`;
            socket.emit('loginResponse', { success: true, message: 'Connexion anonyme réussie', userId: null, token: null, username: anonymousUsername });
        } else {
            db.get('SELECT * FROM users WHERE username = ?', [loginData.username], async (err, row) => {
                if (err) {
                    console.error('Erreur de connexion:', err.message);
                    socket.emit('loginResponse', { success: false, message: 'Erreur de connexion' });
                } else if (row) {
                    const match = await bcrypt.compare(loginData.password, row.password);
                    if (match) {
                        socket.emit('loginResponse', { success: true, message: 'Connexion réussie', userId: row.id, token: row.token, username: row.username });
                    } else {
                        socket.emit('loginResponse', { success: false, message: 'Mot de passe incorrect' });
                    }
                } else {
                    socket.emit('loginResponse', { success: false, message: 'Utilisateur non trouvé' });
                }
            });
        }
    });

    socket.on('joinRoom', (username) => {
        let roomToJoin;
        for (const [roomId, room] of rooms) {
            if (room.players.length < 2) {
                roomToJoin = roomId;
                break;
            }
        }

        if (!roomToJoin) {
            roomToJoin = generateRoomId();
            rooms.set(roomToJoin, { players: [], gameState: null });
        }

        const room = rooms.get(roomToJoin);
        room.players.push({ id: socket.id, username, score: 0 });
        socket.join(roomToJoin);
        
        io.to(roomToJoin).emit('playerJoined', room.players);
        socket.emit('roomJoined', roomToJoin);

        if (room.players.length === 2) {
            startGame(roomToJoin);
        }
    });

    socket.on('flipCard', ({ roomId, cardIndex }) => {
        const room = rooms.get(roomId);
        if (room && room.gameState) {
            // Logique pour retourner une carte et vérifier les paires
            // Mettre à jour le gameState et envoyer les mises à jour aux joueurs
            io.to(roomId).emit('gameStateUpdated', room.gameState);
        }
    });

    socket.on('saveScore', ({ userId, memoryType, gridSize, score }) => {
        if (userId) {
            db.run('INSERT INTO scores (user_id, memory_type, grid_size, score) VALUES (?, ?, ?, ?)',
                [userId, memoryType, gridSize, score],
                (err) => {
                    if (err) {
                        console.error('Erreur d\'enregistrement du score:', err.message);
                    } else {
                        console.log('Score enregistré avec succès');
                    }
                }
            );
        }
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté');
        for (const [roomId, room] of rooms) {
            const playerIndex = room.players.findIndex(player => player.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('playerLeft', room.players);
                }
                break;
            }
        }
    });
});

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8);
}

function generateToken(length) {
    return Math.random().toString(36).substring(2, length + 2);
}

function startGame(roomId) {
    const room = rooms.get(roomId);
    room.gameState = {
        // Initialiser l'état du jeu (cartes, tour du joueur, etc.)
    };
    io.to(roomId).emit('gameStarted', room.gameState);
}

server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});