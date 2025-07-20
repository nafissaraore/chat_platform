// backend/controllers/profileController.js
const Profile = require('../models/Profile');
const User = require('../models/User'); // Pour récupérer le username si besoin

// @desc    Get user profile
// @route   GET /api/profile/me
// @access  Private
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // L'ID de l'utilisateur vient du middleware protect
        let profile = await Profile.findByUserId(userId);
        const user = await User.findById(userId); // Récupérer aussi les infos de base de l'utilisateur

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Si le profil n'existe pas encore, le créer (peut arriver si utilisateur s'est inscrit avant cette logique)
        if (!profile) {
            await Profile.create(userId);
            profile = await Profile.findByUserId(userId); // Re-fetch
        }

        res.json({
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            profile: profile
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
    }
};

// @desc    Update user profile
// @route   PUT /api/profile/me
// @access  Private
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { age, gender, interests, intention, photo_url, location } = req.body;

    try {
        // Assurez-vous que le profil existe, sinon le créer
        let profile = await Profile.findByUserId(userId);
        if (!profile) {
            await Profile.create(userId);
        }

        const updated = await Profile.update(userId, { age, gender, interests, intention, photo_url, location });

        if (updated) {
            const updatedProfile = await Profile.findByUserId(userId); // Récupérer le profil mis à jour
            res.json({ message: 'Profil mis à jour avec succès.', profile: updatedProfile });
        } else {
            res.status(400).json({ message: 'Échec de la mise à jour du profil ou aucune modification.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du profil.' });
    }
};

module.exports = { getProfile, updateProfile };