const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'badboydating-secret-key', // In production, use a secure environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(express.static(path.join(__dirname, 'public')));

// Database Setup
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT UNIQUE,
            phone TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating table ' + err.message);
            } else {
                console.log('Users table created or already exists.');
            }
        });
    }
});

// API Routes

// Register
app.post('/api/register', async (req, res) => {
    const { username, password, email, phoneNumber } = req.body;

    if (!username || !password || !email || !phoneNumber) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)`;

        db.run(sql, [username, hashedPassword, email, phoneNumber], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'Username or email already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully.', userId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const sql = `SELECT * FROM users WHERE username = ?`;
    db.get(sql, [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error.' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.status(200).json({ message: 'Login successful!', user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ error: 'Invalid username or password.' });
        }
    });
});

// Get Current User
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({ user: { id: req.session.userId, username: req.session.username } });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out.' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
