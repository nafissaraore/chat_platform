// backend/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // db est maintenant votre pool de connexions (promise-based)
const authMiddleware = require('../middleware/authMiddleware');

// Route pour récupérer le profil d'un utilisateur
// GET /api/profile/:userId
router.get('/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId;

    // Sécurité: L'utilisateur ne peut voir que son propre profil (ou si c'est un admin)
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès non autorisé." });
    }

    try {
        const query = `
            SELECT
                u.id, u.username, u.email,
                p.age, p.gender, p.interests, p.intention, p.photo_url, p.location, p.last_active
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?;
        `;
        // MODIFICATION ICI : db.promise().query() devient db.query()
        const [rows] = await db.query(query, [userId]); 

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Profil utilisateur non trouvé.' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du profil.' });
    }
});

// Route pour mettre à jour le profil d'un utilisateur
// PUT /api/profile/:userId
router.put('/:userId', authMiddleware, async (req, res) => {
    const userId = req.params.userId;

    // Sécurité: L'utilisateur ne peut modifier que son propre profil
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Accès non autorisé." });
    }

    const {
        username,
        email,
        age,
        gender,
        interests,
        intention,
        photo_url,
        location,
    } = req.body;

    try {
        // MODIFICATION ICI : db.promise().beginTransaction() devient db.getConnection()
        // et les requêtes utilisent la connexion obtenue
        const connection = await db.getConnection(); // Obtenir une connexion du pool
        await connection.beginTransaction(); // Démarrer une transaction sur cette connexion

        try {
            // 1. Mettre à jour la table `users`
            const updateUserQuery = `
                UPDATE users
                SET username = ?, email = ?
                WHERE id = ?;
            `;
            // MODIFICATION ICI : db.promise().query() devient connection.query()
            await connection.query(updateUserQuery, [username, email, userId]);

            // 2. Mettre à jour ou insérer dans la table `profiles`
            // Vérifiez si le profil existe déjà
            // MODIFICATION ICI : db.promise().query() devient connection.query()
            const [profileExists] = await connection.query(
                `SELECT user_id FROM profiles WHERE user_id = ?;`,
                [userId]
            );

            if (profileExists.length > 0) {
                // Mise à jour si le profil existe
                const updateProfileQuery = `
                    UPDATE profiles
                    SET age = ?, gender = ?, interests = ?, intention = ?, photo_url = ?, location = ?, last_active = NOW()
                    WHERE user_id = ?;
                `;
                // MODIFICATION ICI : db.promise().query() devient connection.query()
                await connection.query(updateProfileQuery, [
                    age, gender, interests, intention, photo_url, location, userId
                ]);
            } else {
                // Insertion si le profil n'existe pas (première fois qu'un profil est rempli)
                const insertProfileQuery = `
                    INSERT INTO profiles (user_id, age, gender, interests, intention, photo_url, location)
                    VALUES (?, ?, ?, ?, ?, ?, ?);
                `;
                // MODIFICATION ICI : db.promise().query() devient connection.query()
                await connection.query(insertProfileQuery, [
                    userId, age, gender, interests, intention, photo_url, location
                ]);
            }

            await connection.commit(); // Confirmez la transaction
        } catch (transactionError) {
            await connection.rollback(); // Annulez la transaction en cas d'erreur
            throw transactionError; // Propagez l'erreur pour la capturer plus bas
        } finally {
            connection.release(); // IMPORTANT : Relâcher la connexion au pool après la transaction
        }


        // Récupérer le profil mis à jour pour le renvoyer au frontend
        // MODIFICATION ICI : db.promise().query() devient db.query()
        const [updatedProfileResult] = await db.query(`
            SELECT
                u.id, u.username, u.email,
                p.age, p.gender, p.interests, p.intention, p.photo_url, p.location, p.last_active
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.id = ?;
        `, [userId]);

        res.json({
            message: 'Profil mis à jour avec succès.',
            profile: updatedProfileResult[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil :', error);
        res.status(500).json({ message: 'Échec de la mise à jour du profil.', error: error.message });
    }
});

module.exports = router;