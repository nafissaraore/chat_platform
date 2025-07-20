// backend/models/Room.js
const pool = require('../config/db'); // Votre configuration de pool de connexion à la BDD

class Room {
    // ... (vos méthodes existantes : create, findById, findByName, findAll, addMember, getMembers, checkPassword) ...

    // ✅ NOUVEAU : Méthode pour mettre à jour une salle
    static async update(id, { name, description, isPrivate, password }) {
        let query = 'UPDATE rooms SET updated_at = CURRENT_TIMESTAMP';
        const params = [];

        if (name !== undefined) {
            query += ', name = ?';
            params.push(name);
        }
        if (description !== undefined) {
            query += ', description = ?';
            params.push(description);
        }
        // Assurez-vous que votre colonne est 'is_private' dans la BDD
        if (isPrivate !== undefined) {
            query += ', is_private = ?';
            params.push(isPrivate);
        }
        if (password !== undefined) { // Le mot de passe sera déjà haché ou null
            query += ', password = ?';
            params.push(password);
        }

        query += ' WHERE id = ?';
        params.push(id);

        try {
            const [result] = await pool.execute(query, params);
            return result.affectedRows > 0; // Retourne true si au moins une ligne a été affectée
        } catch (error) {
            console.error('Erreur SQL lors de la mise à jour de la salle:', error);
            throw error;
        }
    }
}

module.exports = Room;
