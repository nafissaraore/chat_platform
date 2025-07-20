const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../config/db');

const router = express.Router();

// 🔐 Inscription
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await User.create({ username, email, password: hashedPassword });

        const token = jwt.sign(
            { id: userId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: { id: userId, username, email }
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// 🔓 Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Connexion réussie', token, user: userWithoutPassword });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// 👤 Récupérer l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// 📁 🔧 Récupérer les médias privés échangés (images, vidéos, fichiers)
router.get('/api/private-messages/media/:userId/:contactId', async (req, res) => {
    try {
        const { userId, contactId } = req.params;

        const query = `
            SELECT content, message_type, created_at 
            FROM private_messages 
            WHERE (
                (sender_id = ? AND receiver_id = ?) OR 
                (sender_id = ? AND receiver_id = ?)
            )
            AND (
                message_type IN ('image', 'video', 'file') 
                OR content LIKE 'http%' -- pour les liens de fichiers stockés
            )
            ORDER BY created_at DESC
            LIMIT 50
        `;

        const [results] = await db.execute(query, [userId, contactId, contactId, userId]);
        res.json(results);
    } catch (error) {
        console.error('Erreur lors de la récupération des médias privés:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// 👤 🔧 Récupérer le profil utilisateur complet
router.get('/api/users/:userId/profile', async (req, res) => {
    try {
        const { userId } = req.params;

        const query = `
            SELECT u.id, u.username, u.email, u.created_at,
                   p.age, p.gender, p.interests, p.intention, 
                   p.photo_url, p.location, p.last_active
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?
        `;

        const [results] = await db.execute(query, [userId]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(results[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
