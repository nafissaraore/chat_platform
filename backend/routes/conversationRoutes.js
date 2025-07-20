const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const PrivateMessage = require('../models/PrivateMessage');

router.get('/recent', authMiddleware, async (req, res) => {
    const currentUserId = req.user.id;

    try {
        const recentMessages = await PrivateMessage.getRecentConversations(currentUserId);

        const formatted = await Promise.all(recentMessages.map(async msg => {
            const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            const user = await User.findById(otherUserId);

            return {
                id: user.id,
                username: user.username,
                profileImage: user.profile_image,
                lastMessage: msg.content,
                lastMessageTime: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Erreur récupération conversations récentes:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

module.exports = router;
