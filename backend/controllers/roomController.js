const Room = require('../models/Room'); 
const bcrypt = require('bcryptjs');

// ✅ Créer une nouvelle salle
exports.createRoom = async (req, res) => {
    const { name, description, isPrivate, password } = req.body;
    const creatorId = req.user.id;

    try {
        const existingRoom = await Room.findByName(name);
        if (existingRoom) {
            return res.status(400).json({ message: 'Une salle avec ce nom existe déjà.' });
        }

        let hashedPassword = null;
        if (isPrivate && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const roomId = await Room.create(name, description, creatorId, isPrivate, hashedPassword);
        const newRoom = await Room.findById(roomId);

        const { password: _, ...roomWithoutPassword } = newRoom;
        res.status(201).json({ message: 'Salle créée avec succès', room: roomWithoutPassword });

    } catch (error) {
        console.error('Erreur lors de la création de la salle:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de la salle.' });
    }
};

// ✅ Récupérer toutes les salles visibles pour l'utilisateur
exports.getRooms = async (req, res) => {
    const userId = req.user.id;

    try {
        const rooms = await Room.findAll(userId);
        if (!rooms || rooms.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(rooms);
    } catch (error) {
        console.error('Erreur lors de la récupération des salles:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des salles.' });
    }
};

// ✅ Rejoindre une salle (vérifie mot de passe si privée)
exports.joinRoom = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    const password = typeof req.body === 'object' && req.body !== null ? req.body.password : null;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: 'Salle non trouvée.' });
        }

        if (room.is_private) {
            if (!room.password) {
                return res.status(500).json({ message: 'Mot de passe manquant pour la salle privée.' });
            }

            if (!password) {
                return res.status(400).json({ message: 'Veuillez fournir un mot de passe.' });
            }

            const isPasswordCorrect = await bcrypt.compare(password, room.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: 'Mot de passe incorrect pour cette salle privée.' });
            }
        }

        const added = await Room.addMember(roomId, userId);
        const { password: _, ...roomWithoutPassword } = room;

        if (added) {
            res.status(200).json({ message: 'Salle rejointe avec succès', room: roomWithoutPassword });
        } else {
            res.status(200).json({ message: 'Vous êtes déjà membre de cette salle', room: roomWithoutPassword });
        }

    } catch (error) {
        console.error("Erreur complète :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'adhésion à la salle." });
    }
};

// ✅ Obtenir les membres d'une salle
exports.getRoomMembers = async (req, res) => {
    const { roomId } = req.params;

    try {
        const members = await Room.getMembers(roomId);
        res.status(200).json(members);
    } catch (error) {
        console.error("Erreur lors de la récupération des membres:", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des membres." });
    }
};

// ✅ Obtenir une salle spécifique par ID
exports.getRoomById = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
        if (!roomId || isNaN(parseInt(roomId, 10))) {
            return res.status(400).json({ message: 'ID de salle invalide.' });
        }

        const room = await Room.findById(roomId);

        if (!room) {
            return res.status(404).json({ message: 'Salle non trouvée.' });
        }

        const { password, ...roomWithoutPassword } = room;
        res.status(200).json(roomWithoutPassword);

    } catch (error) {
        console.error('Erreur lors de la récupération de la salle par ID:', error);
        res.status(500).json({ message: 'Erreur interne du serveur lors de la récupération de la salle.' });
    }
};

// ✅ Vérifier l'appartenance
exports.checkMembership = async (req, res) => {
    const userId = req.user.id;
    const { roomId } = req.params;

    try {
        const isMember = await Room.isMember(roomId, userId);
        res.status(200).json({ isMember });
    } catch (error) {
        console.error("Erreur lors de la vérification d'appartenance à la salle:", error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// ✅ Mettre à jour une salle
exports.updateRoom = async (req, res) => {
    const { roomId } = req.params;
    const { name, description, isPrivate, password } = req.body;
    const userId = req.user.id;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Salle non trouvée." });
        }

        if (room.creator_id !== userId) {
            return res.status(403).json({ message: "Accès refusé, vous n'êtes pas le créateur." });
        }

        let hashedPassword = room.password;
        if (isPrivate && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        await Room.update(roomId, name, description, isPrivate, hashedPassword);

        res.status(200).json({ message: "Salle mise à jour avec succès." });
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la salle:", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la salle." });
    }
};

// ✅ Supprimer une salle
exports.deleteRoom = async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Salle non trouvée." });
        }

        if (room.creator_id !== userId) {
            return res.status(403).json({ message: "Seul le créateur peut supprimer cette salle." });
        }

        await Room.delete(roomId);
        res.status(200).json({ message: "Salle supprimée avec succès." });

    } catch (error) {
        console.error("Erreur lors de la suppression de la salle:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
};
// ✅ Quitter une salle (sauf pour le créateur)
exports.leaveRoom = async (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const userId = req.user.id;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable." });
        }

        if (room.creator_id === userId) {
            return res.status(403).json({ message: "Vous êtes le créateur de cette salle. Supprimez-la au lieu de la quitter." });
        }

        const removed = await Room.removeMember(roomId, userId);
        if (!removed) {
            return res.status(400).json({ message: "Vous n'êtes pas membre de cette salle." });
        }

        res.status(200).json({ message: "Vous avez quitté la salle." });
    } catch (error) {
        console.error("Erreur lors du retrait de la salle :", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};
