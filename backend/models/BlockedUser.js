// backend/models/BlockedUser.js
const db = require('../config/db');

class BlockedUser {
    static async block(blockerId, blockedId) {
        try {
            const [result] = await db.execute(
                'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
                [blockerId, blockedId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            // Gérer le cas où l'utilisateur est déjà bloqué (contrainte de clé primaire)
            if (error.code === 'ER_DUP_ENTRY') {
                return false; // Ou lancer une erreur spécifique
            }
            throw error;
        }
    }

    static async unblock(blockerId, blockedId) {
        const [result] = await db.execute(
            'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );
        return result.affectedRows > 0;
    }

    static async isBlocked(blockerId, blockedId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
            [blockerId, blockedId]
        );
        return rows[0].count > 0;
    }

    static async findBlockedUsers(blockerId) {
        const [rows] = await db.execute(
            `SELECT bu.blocked_id, u.username
             FROM blocked_users bu
             JOIN users u ON bu.blocked_id = u.id
             WHERE bu.blocker_id = ?`,
            [blockerId]
        );
        return rows;
    }
}

module.exports = BlockedUser;