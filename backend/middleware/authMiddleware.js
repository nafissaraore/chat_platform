const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
    }

    try {
        const actualToken = token.split(' ')[1];
        if (!actualToken) {
            return res.status(401).json({ message: 'Format de token invalide' });
        }

        const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);
        const userId = parseInt(decoded.id, 10);

        if (isNaN(userId)) {
            return res.status(401).json({ message: 'ID utilisateur non valide' });
        }

        req.user = await User.findById(userId);
        if (!req.user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        next();
    } catch (err) {
        console.error('Erreur d\'authentification:', err.message);
        res.status(401).json({ message: 'Token non valide' });
    }
};

module.exports = authMiddleware;
