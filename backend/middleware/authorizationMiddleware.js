// backend/middleware/authorizationMiddleware.js
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // req.user est défini par le middleware `protect`
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Accès refusé : Rôle utilisateur non défini.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès refusé : Vous n\'avez pas la permission d\'effectuer cette action.' });
        }
        next();
    };
};

module.exports = { authorizeRoles };