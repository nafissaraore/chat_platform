// backend/controllers/userController.js
const User = require('../models/User');

// Fonction pour obtenir tous les utilisateurs
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
};

// Nouvelle fonction pour obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur par ID:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
    }
};
