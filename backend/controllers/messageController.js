const Message = require('../models/Message');

console.log("[messageController.js] Fichier de contrôleur chargé.");

const getRoomMessages = async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;

  console.log(`[messageController.js] getRoomMessages pour roomId=${roomId}, limit=${limit}, offset=${offset}`);

  if (isNaN(roomId) || isNaN(limit) || isNaN(offset)) {
    return res.status(400).json({ message: 'Paramètres invalides' });
  }

  try {
    const messages = await Message.findByRoomId(roomId, limit, offset);
    res.json(messages);
  } catch (error) {
    console.error('[messageController.js] Erreur dans getRoomMessages:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des messages.' });
  }
};

module.exports = { getRoomMessages };
