const db = require('../config/db');

class PrivateMessage {
    static async create({ sender_id, receiver_id, content, message_type }) {
        // Forcer la conversion en nombres
        const parsedSenderId = Number(sender_id);
        const parsedReceiverId = Number(receiver_id);

        // Log pour debug
        console.log('PrivateMessage.create - sender_id:', sender_id, 'receiver_id:', receiver_id);
        console.log('PrivateMessage.create - parsedSenderId:', parsedSenderId, 'parsedReceiverId:', parsedReceiverId);

        // Vérification stricte des IDs
        if (!Number.isInteger(parsedSenderId) || !Number.isInteger(parsedReceiverId)) {
            throw new Error(`Sender ID or Receiver ID is not a valid integer. Got sender_id=${sender_id}, receiver_id=${receiver_id}`);
        }

        // Validation contenu/message_type (optionnel)
        if (typeof content !== 'string' || content.trim() === '') {
            throw new Error('Content must be a non-empty string.');
        }

        if (typeof message_type !== 'string' || message_type.trim() === '') {
            throw new Error('Message type must be a non-empty string.');
        }

        const query = 'INSERT INTO private_messages (sender_id, receiver_id, content, message_type) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [parsedSenderId, parsedReceiverId, content.trim(), message_type.trim()]);
        return {
            id: result.insertId,
            sender_id: parsedSenderId,
            receiver_id: parsedReceiverId,
            content: content.trim(),
            message_type: message_type.trim(),
            created_at: new Date()
        };
    }

    static async findConversation(userId1, userId2, limit = 50, offset = 0) {
        const parsedUserId1 = parseInt(userId1);
        const parsedUserId2 = parseInt(userId2);
        const parsedLimit = Number.isInteger(+limit) ? +limit : 50;
        const parsedOffset = Number.isInteger(+offset) ? +offset : 0;

        if (isNaN(parsedUserId1) || isNaN(parsedUserId2)) {
            throw new Error('User IDs must be valid numbers for conversation lookup.');
        }

        console.log('DEBUG (PrivateMessage.findConversation): Paramètres user1, user2:', parsedUserId1, parsedUserId2);
        console.log('DEBUG (PrivateMessage.findConversation): Paramètres limit, offset:', parsedLimit, parsedOffset);
        console.log('DEBUG (PrivateMessage.findConversation): Types - user1:', typeof parsedUserId1, 'user2:', typeof parsedUserId2, 'limit:', typeof parsedLimit, 'offset:', typeof parsedOffset);

        const query = `
            SELECT * FROM private_messages
            WHERE (sender_id = ? AND receiver_id = ?)
               OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
            LIMIT ${parsedLimit} OFFSET ${parsedOffset}
        `;

        const params = [parsedUserId1, parsedUserId2, parsedUserId2, parsedUserId1];
        console.log('DEBUG (PrivateMessage.findConversation): Paramètres finaux envoyés à db.execute:', params);

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getRecentConversations(userId) {
        const parsedUserId = parseInt(userId);

        if (isNaN(parsedUserId)) {
            throw new Error('User ID is not a valid number for recent conversations.');
        }

        const query = `
            SELECT
                pm.*,
                u_sender.username AS sender_username,
                u_receiver.username AS receiver_username
            FROM
                private_messages pm
            JOIN (
                SELECT
                    GREATEST(sender_id, receiver_id) AS user_pair_id_max,
                    LEAST(sender_id, receiver_id) AS user_pair_id_min,
                    MAX(created_at) AS last_message_time
                FROM
                    private_messages
                WHERE
                    sender_id = ? OR receiver_id = ?
                GROUP BY
                    user_pair_id_max, user_pair_id_min
            ) AS latest_messages
            ON (
                (pm.sender_id = latest_messages.user_pair_id_max AND pm.receiver_id = latest_messages.user_pair_id_min)
                OR
                (pm.sender_id = latest_messages.user_pair_id_min AND pm.receiver_id = latest_messages.user_pair_id_max)
            ) AND pm.created_at = latest_messages.last_message_time
            JOIN users u_sender ON pm.sender_id = u_sender.id
            JOIN users u_receiver ON pm.receiver_id = u_receiver.id
            WHERE
                pm.sender_id = ? OR pm.receiver_id = ?
            ORDER BY
                pm.created_at DESC;
        `;

        const [rows] = await db.execute(query, [parsedUserId, parsedUserId, parsedUserId, parsedUserId]);

        const conversationsMap = new Map();
        rows.forEach(message => {
            const participantId = message.sender_id === parsedUserId ? message.receiver_id : message.sender_id;
            const participantUsername = message.sender_id === parsedUserId ? message.receiver_username : message.sender_username;

            const conversationKey = [parsedUserId, participantId].sort().join('-');

            if (!conversationsMap.has(conversationKey) || new Date(message.created_at) > new Date(conversationsMap.get(conversationKey).created_at)) {
                conversationsMap.set(conversationKey, {
                    id: participantId,
                    username: participantUsername,
                    lastMessage: message.content,
                    lastMessageType: message.message_type,
                    lastMessageTime: message.created_at,
                    senderId: message.sender_id
                });
            }
        });

        return Array.from(conversationsMap.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    }
}

module.exports = PrivateMessage;
