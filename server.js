const express = require('express');
const session = require('express-session');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const socketIo = require('socket.io');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'badboydating-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
});
app.use(sessionMiddleware);

// Share session with socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Database connection & Initialization
const dbName = process.env.DB_NAME || './users.db';
const db = new sqlite3.Database(dbName, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            phone TEXT
        )`);

        // Matches table
        db.run(`CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user1_id, user2_id)
        )`);

        // Messages table
        db.run(`CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id)
        )`);

        console.log('Database tables verified/created.');
    });
}

// Helper function to ensure user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Authentication Routes

// Register
app.post('/register', async (req, res) => {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (username, password_hash, email, phone) VALUES (?, ?, ?, ?)`;
        db.run(sql, [username, hashedPassword, email, phone], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Check Session / Get Current User
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username } });
    } else {
        res.json({ loggedIn: false });
    }
});

// Matches & Chat Routes

// Get potential matches (all users except self and already matched)
app.get('/api/users', isAuthenticated, (req, res) => {
    const currentUserId = req.session.userId;

    const sql = `
        SELECT id, username, email FROM users
        WHERE id != ?
        AND id NOT IN (
            SELECT user2_id FROM matches WHERE user1_id = ?
            UNION
            SELECT user1_id FROM matches WHERE user2_id = ?
        )
    `;
    db.all(sql, [currentUserId, currentUserId, currentUserId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Create a match
app.post('/api/match', isAuthenticated, (req, res) => {
    const currentUserId = req.session.userId;
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID required' });
    }

    // Check if match already exists
    const checkSql = `SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`;
    db.get(checkSql, [currentUserId, targetUserId, targetUserId, currentUserId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Match already exists' });
        }

        // Create match
        const insertSql = `INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)`;
        db.run(insertSql, [currentUserId, targetUserId], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Match created', matchId: this.lastID });
        });
    });
});

// Get matches for current user
app.get('/api/matches', isAuthenticated, (req, res) => {
    const currentUserId = req.session.userId;
    const sql = `
        SELECT
            m.id as match_id,
            CASE
                WHEN m.user1_id = ? THEN u2.id
                ELSE u1.id
            END as user_id,
            CASE
                WHEN m.user1_id = ? THEN u2.username
                ELSE u1.username
            END as username
        FROM matches m
        JOIN users u1 ON m.user1_id = u1.id
        JOIN users u2 ON m.user2_id = u2.id
        WHERE m.user1_id = ? OR m.user2_id = ?
    `;

    db.all(sql, [currentUserId, currentUserId, currentUserId, currentUserId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get messages for a match (with a specific user)
app.get('/api/messages/:otherUserId', isAuthenticated, (req, res) => {
    const currentUserId = req.session.userId;
    const otherUserId = req.params.otherUserId;

    const sql = `
        SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
    `;
    db.all(sql, [currentUserId, otherUserId, otherUserId, currentUserId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});


// Socket.io Logic
io.on('connection', (socket) => {
    const session = socket.request.session;
    if (session && session.userId) {
        console.log(`User connected: ${session.username} (${session.userId})`);
        socket.join(`user_${session.userId}`); // Join a personal room
    } else {
        console.log('Unauthenticated user connected via socket');
    }

    socket.on('join_chat', (data) => {
        // data.otherUserId
        const userId = session.userId;
        const otherUserId = data.otherUserId;
        if (!userId || !otherUserId) return;

        const room = [userId, otherUserId].sort().join('_');
        socket.join(room);
        console.log(`User ${userId} joined room ${room}`);
    });

    socket.on('send_message', (data) => {
        const userId = session.userId;
        const { receiverId, content } = data;

        if (!userId || !receiverId || !content) return;

        // Save to database
        const sql = `INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`;
        db.run(sql, [userId, receiverId, content], function(err) {
            if (err) {
                console.error('Error saving message:', err.message);
                return;
            }

            const messageData = {
                id: this.lastID,
                sender_id: userId,
                receiver_id: receiverId,
                content: content,
                timestamp: new Date().toISOString()
            };

            // Emit to the room
            const room = [userId, receiverId].sort().join('_');
            io.to(room).emit('receive_message', messageData);
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});


// Basic route to check server status
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server, io, db };
