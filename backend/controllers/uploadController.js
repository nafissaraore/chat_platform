// backend/controllers/uploadController.js

const path = require('path');
const PrivateMessage = require('../models/PrivateMessage'); // Assurez-vous que le chemin est correct pour PrivateMessage
const multer = require('multer'); // Si vous utilisez multer ici

// Configuration de Multer (si elle n'est pas déjà dans un fichier de configuration séparé)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Assurez-vous que ce dossier existe à la racine de votre backend
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom de fichier unique
    },
});

const upload = multer({ storage: storage });

exports.uploadFile = async (req, res) => {
    try {
        // req.file contient les informations sur le fichier uploadé par Multer
        // req.body contient les autres champs du formulaire (senderId, receiverId, etc.)

        console.log("DEBUG (uploadController): req.file", req.file);
        console.log("DEBUG (uploadController): req.body", req.body);
        console.log("DEBUG (uploadController): req.user (si authMiddleware est utilisé)", req.user); // Utile si l'expéditeur vient de l'auth

        const { senderId, receiverId, senderUsername, messageType } = req.body;
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // Construire l'URL

        // Vérifiez que les IDs sont présents
        if (!senderId || !receiverId) {
            console.error("Erreur: senderId ou receiverId manquant dans req.body");
            return res.status(400).json({ message: "Sender ID et Receiver ID sont requis." });
        }

        // Vérifiez le userId du req.user si vous utilisez l'authentification pour valider l'expéditeur
        // if (req.user && parseInt(senderId) !== req.user.id) {
        //     console.error("Erreur: L'ID de l'expéditeur ne correspond pas à l'utilisateur authentifié.");
        //     return res.status(403).json({ message: "Non autorisé: l'expéditeur ne correspond pas." });
        // }

        // Créez le message privé avec l'URL du fichier comme contenu
        const newMessage = await PrivateMessage.create({
            sender_id: senderId,       // Assurez-vous que ces noms correspondent aux attentes du modèle
            receiver_id: receiverId,
            content: fileUrl,          // Le contenu est l'URL du fichier
            message_type: messageType || 'image', // Ou 'file' si vous gérez d'autres types
        });

        // Envoyer le message via Socket.IO si nécessaire (exemple, à adapter à votre implémentation)
        // const io = req.app.get('socketio'); // Récupérer l'instance Socket.IO si elle est stockée dans app.locals ou app.get
        // if (io) {
        //     const room = [parseInt(senderId), parseInt(receiverId)].sort().join('-');
        //     io.to(room).emit('privateMessage', {
        //         ...newMessage,
        //         sender_username: senderUsername, // Ajouter le nom d'utilisateur pour le frontend
        //     });
        // }

        res.status(201).json({ message: 'Fichier uploadé et message enregistré avec succès', fileUrl: fileUrl, newMessage });

    } catch (error) {
        console.error("Erreur lors de l'upload du fichier ou de l'enregistrement du message:", error);
        res.status(500).json({ message: "Erreur serveur lors de l'upload du fichier ou de l'enregistrement du message", error: error.message });
    }
};