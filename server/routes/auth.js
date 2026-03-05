const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/authMiddleware');

// POST /api/auth/register — create a new user
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if username already exists
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ error: 'Username already taken.' });
        }

        const user = new User({
            username,
            password,
            role: role || 'Nurse',
        });
        await user.save();

        console.log(`👤 User registered: ${username} (${user.role})`);
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/auth/login — authenticate and return JWT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log(`🔑 User logged in: ${username} (${user.role})`);
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me — return current user from JWT
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
