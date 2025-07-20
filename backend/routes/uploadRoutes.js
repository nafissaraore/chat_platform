// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier profiles s'il n'existe pas
const profilesDir = path.join(__dirname, '../public/uploads/profiles');
if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

// Configuration de multer pour les uploads généraux
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Configuration de multer spécifique pour les photos de profil
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads/profiles'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `profile-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Instances multer
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image (JPEG, PNG, GIF) sont acceptés'), false);
    }
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers image (JPEG, PNG, GIF) sont acceptés'), false);
    }
  }
});

// Route POST pour uploader un fichier général
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier reçu.' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ fileUrl });
});

// Route pour uploader une photo de profil
router.post('/profile', profileUpload.single('profileImage'), (req, res) => {
  console.log('Route /profile appelée');
  console.log('Fichier reçu:', req.file);
  
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun fichier uploadé' 
      });
    }

    // Construire l'URL du fichier (corrigé pour correspondre à la structure réelle)
    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    console.log('Photo uploadée avec succès:', fileUrl);

    res.json({
      success: true,
      message: 'Photo uploadée avec succès',
      fileUrl: fileUrl,
      fileName: req.file.filename
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'upload' 
    });
  }
});

// Gestion des erreurs multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximale: 5MB'
      });
    }
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
});

module.exports = router;