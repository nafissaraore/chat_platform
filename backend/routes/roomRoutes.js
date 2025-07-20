const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Correction ici

// --- Routes Room ---

// Route pour obtenir toutes les salles
router.get('/', authMiddleware, roomController.getRooms);

// Route pour créer une nouvelle salle
router.post('/', authMiddleware, roomController.createRoom);

// Route pour obtenir une salle spécifique par son ID
router.get('/:roomId', authMiddleware, roomController.getRoomById);

// Route pour modifier une salle (nécessite d'être le créateur)
router.put('/:roomId', authMiddleware, roomController.updateRoom);

// Route pour rejoindre une salle spécifique par son ID
router.post('/:roomId/join', authMiddleware, roomController.joinRoom);
// Route pour quitter une salle
router.post('/:roomId/leave', authMiddleware, roomController.leaveRoom);


// Route pour obtenir les membres d'une salle spécifique
router.get('/:roomId/members', authMiddleware, roomController.getRoomMembers);

// ✅ Route pour vérifier l'appartenance d'un utilisateur à une salle
router.get('/:roomId/membership', authMiddleware, roomController.checkMembership);

// ✅ Route pour quitter une salle
router.post('/:roomId/leave', authMiddleware, roomController.leaveRoom);

router.delete('/:roomId', authMiddleware, roomController.deleteRoom);

module.exports = router;
