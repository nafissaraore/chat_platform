const express = require('express');
const router = express.Router();
const privateMessageController = require('../controllers/privateMessageController');
const authenticateToken = require('../middleware/authenticateToken'); // Assurez-vous que ce middleware existe

// ✅ Route pour récupérer les conversations récentes (avec authentification)
router.get('/conversations/:userId', authenticateToken, privateMessageController.getRecentConversations);

// ✅ Route pour les messages privés entre deux utilisateurs (avec authentification)
router.get('/:receiverId', authenticateToken, privateMessageController.getPrivateMessages);

module.exports = router;