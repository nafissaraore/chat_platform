const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

// Route protégée pour récupérer les messages d'une salle
router.get('/room/:roomId', authMiddleware, messageController.getRoomMessages);

module.exports = router;
