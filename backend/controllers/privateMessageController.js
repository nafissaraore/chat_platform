// backend/controllers/privateMessageController.js

const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');
const db = require('../config/db');

/**
 * @desc    Récupérer les messages privés entre l'utilisateur connecté et un autre utilisateur.
 * @route   GET /api/private-messages/:receiverId
 * @access  Privé
 */
exports.getPrivateMessages = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.error('getPrivateMessages: Utilisateur non authentifié:', req.user);
        return res.status(401).json({ message: 'Utilisateur non authentifié. Veuillez vous reconnecter.' });
    }

    const senderId = parseInt(req.user.id, 10); 
    const receiverId = parseInt(req.params.receiverId, 10);

    let limit = parseInt(req.query.limit, 10);
    let offset = parseInt(req.query.offset, 10);

    if (isNaN(limit) || limit <= 0) limit = 50;
    if (isNaN(offset) || offset < 0) offset = 0;

    if (isNaN(senderId) || senderId <= 0) {
        console.error('getPrivateMessages: ID expéditeur invalide:', senderId);
        return res.status(401).json({ message: 'ID expéditeur invalide.' });
    }

    if (isNaN(receiverId) || receiverId <= 0) {
        return res.status(400).json({ message: 'ID du destinataire invalide.' });
    }

    try {
        const receiverExists = await User.findById(receiverId);
        if (!receiverExists) {
            return res.status(404).json({ message: 'Destinataire non trouvé.' });
        }

        const messages = await PrivateMessage.findConversation(senderId, receiverId, limit, offset);

        res.status(200).json(messages);
    } catch (error) {
        console.error('Erreur lors de la récupération des messages privés (dans le contrôleur):', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des messages privés.' });
    }
};

/**
 * @desc    Récupérer les dernières conversations privées de l'utilisateur authentifié
 * @route   GET /api/private-messages/conversations/:userId
 * @access  Privé
 */
exports.getRecentConversations = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié. Veuillez vous reconnecter.' });
        }

        const userId = parseInt(req.params.userId, 10);
        const authUserId = parseInt(req.user.id, 10);

        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ message: "ID utilisateur invalide." });
        }

        if (userId !== authUserId) {
            return res.status(403).json({ message: "Accès interdit aux conversations d'un autre utilisateur." });
        }

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Modification importante : récupération du dernier message de chaque conversation avec nom de l'autre utilisateur
        const [conversations] = await db.query(`
            SELECT 
                IF(pm.sender_id = ?, pm.receiver_id, pm.sender_id) AS contact_id,
                u.username AS contact_username,
                pm.content,
                pm.message_type,
                pm.created_at
            FROM private_messages pm
            JOIN (
                SELECT 
                    LEAST(sender_id, receiver_id) AS user1,
                    GREATEST(sender_id, receiver_id) AS user2,
                    MAX(id) AS last_message_id
                FROM private_messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY user1, user2
            ) last_msg ON pm.id = last_msg.last_message_id
            JOIN users u ON u.id = IF(pm.sender_id = ?, pm.receiver_id, pm.sender_id)
            ORDER BY pm.created_at DESC
        `, [userId, userId, userId, userId]);

        res.status(200).json(conversations || []);
    } catch (error) {
        console.error('Erreur lors de la récupération des conversations récentes :', error);
        res.status(500).json({ 
            message: 'Erreur serveur lors de la récupération des conversations.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
