// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Pour protéger la route

// Route pour obtenir tous les utilisateurs (protégée par authentification)
router.get('/', authMiddleware, userController.getUsers);

// Nouvelle route pour obtenir un utilisateur par ID (protégée)
router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;
