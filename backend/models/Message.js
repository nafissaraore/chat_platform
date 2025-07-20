const db = require('../config/db');

const Message = {
  /**
   * Récupère les messages d'une salle donnée avec pagination.
   * @param {number} roomId
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  findByRoomId: async (roomId, limit = 50, offset = 0) => {
    const parsedRoomId = parseInt(roomId, 10);
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (!Number.isInteger(parsedRoomId) || !Number.isInteger(parsedLimit) || !Number.isInteger(parsedOffset)) {
      throw new Error('Paramètres invalides pour findByRoomId');
    }

    try {
      const query = `
        SELECT 
          m.id, 
          m.room_id, 
          m.user_id, 
          m.content, 
          m.message_type, 
          m.created_at,
          u.username
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
        ORDER BY m.created_at ASC
        LIMIT ${parsedLimit} OFFSET ${parsedOffset}
      `;
      const [rows] = await db.execute(query, [parsedRoomId]);
      return rows;
    } catch (error) {
      console.error('[Message.findByRoomId] Erreur SQL :', error);
      throw error;
    }
  },

  /**
   * Crée un nouveau message dans une salle.
   * @param {number} roomId
   * @param {number} userId
   * @param {string} username
   * @param {string} content
   * @param {string} messageType
   * @returns {Promise<number>} - ID du message créé
   */
  create: async (roomId, userId, username, content, messageType = 'text') => {
    try {
      const query = `
        INSERT INTO messages (room_id, user_id, content, message_type, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `;
      const [result] = await db.execute(query, [roomId, userId, content, messageType]);
      return result.insertId;
    } catch (error) {
      console.error('[Message.create] Erreur SQL :', error);
      throw error;
    }
  }
};

module.exports = Message;
