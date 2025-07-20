// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuration du stockage de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Le dossier où les fichiers seront sauvegardés
        // Assurez-vous que ce chemin est correct par rapport à la racine du backend
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        // Nom du fichier : nom original + timestamp + extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Filtrer les types de fichiers (optionnel mais recommandé)
const fileFilter = (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        // Pour une meilleure gestion des erreurs, vous pouvez renvoyer une erreur explicite
        cb(new Error('Seules les images sont autorisées !'), false);
    }
};

// Initialisation de Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limite de taille de fichier à 5MB (5 mégaoctets)
    }
});

module.exports = upload;
