// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Veuillez entrer tous les champs requis.' });
    }

    try {
        let user = await User.findByEmail(email);
        if (user) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await User.create(username, email, hashedPassword);

        res.status(201).json({ message: 'Inscription réussie !', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez entrer l\'email et le mot de passe.' });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides.' });
        }

        // Durée de vie du token augmentée à 7 jours
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Retourne le rôle de l'utilisateur
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

module.exports = { register, login };
