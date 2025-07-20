// backend/models/Room.js
const db = require('../config/db'); // Assurez-vous que db.js est configuré pour votre base de données SQL (MySQL/PostgreSQL)
const bcrypt = require('bcryptjs'); // Pour hacher les mots de passe des salles privées

class Room {
    // Récupère toutes les salles (publiques et celles où l'utilisateur est membre)
    static async findAll(userId) {
        // userId est nécessaire pour filtrer les salles privées dont l'utilisateur est membre
        const [rows] = await db.execute(
            `SELECT DISTINCT r.*, u.username as creator_username
             FROM rooms r
             LEFT JOIN room_members rm ON r.id = rm.room_id
             LEFT JOIN users u ON r.creator_id = u.id
             WHERE r.is_private = FALSE OR rm.user_id = ?
             ORDER BY r.name ASC`,
            [userId]
        );
        return rows;
    }

    // Récupère une salle par ID
    static async findById(id) {
        const [rows] = await db.execute(
            `SELECT r.*, u.username as creator_username
             FROM rooms r
             LEFT JOIN users u ON r.creator_id = u.id
             WHERE r.id = ?`,
            [id]
        );
        return rows[0];
    }

    // Récupère une salle par nom
    static async findByName(name) {
        const [rows] = await db.execute('SELECT * FROM rooms WHERE name = ?', [name]);
        return rows[0];
    }

    // Crée une nouvelle salle
    static async create(name, description, creatorId, isPrivate = false, password = null) {
        let hashedPassword = null;
        if (isPrivate && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const [result] = await db.execute(
            'INSERT INTO rooms (name, description, creator_id, is_private, password) VALUES (?, ?, ?, ?, ?)',
            [name, description, creatorId, isPrivate, hashedPassword]
        );
        const roomId = result.insertId;

        // Ajouter le créateur comme membre de la salle
        await this.addMember(roomId, creatorId);

        return roomId;
    }

    // Met à jour une salle
    static async update(id, { name, description, isPrivate, password }) {
        let updateFields = [];
        let params = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            params.push(description);
        }
        if (isPrivate !== undefined) {
            updateFields.push('is_private = ?');
            params.push(isPrivate);
        }
        if (password !== undefined && password !== null) { // Seulement si un nouveau mot de passe est fourni
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            params.push(hashedPassword);
        } else if (isPrivate === false) { // Si la salle devient publique, effacer le mot de passe
            updateFields.push('password = NULL');
        }

        if (updateFields.length === 0) {
            return false; // Rien à mettre à jour
        }

        params.push(id); // Ajouter l'ID pour la clause WHERE

        const [result] = await db.execute(
            `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`,
            params
        );
        return result.affectedRows > 0;
    }

    // Supprime une salle et ses membres associés
    static async delete(id) {
        // D'abord, supprimer les entrées dans la table room_members
        await db.execute('DELETE FROM room_members WHERE room_id = ?', [id]);
        // Ensuite, supprimer la salle elle-même
        const [result] = await db.execute('DELETE FROM rooms WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    // --- Fonctions de gestion des membres de la salle ---

    // Ajoute un membre à une salle
    static async addMember(roomId, userId) {
        const [existingMember] = await db.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );
        if (existingMember.length > 0) {
            return false; // Déjà membre
        }
        const [result] = await db.execute(
            'INSERT INTO room_members (room_id, user_id) VALUES (?, ?)',
            [roomId, userId]
        );
        return result.affectedRows > 0;
    }

    // Supprime un membre d'une salle
    static async removeMember(roomId, userId) {
        const [result] = await db.execute(
            'DELETE FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );
        return result.affectedRows > 0;
    }

    // Vérifie si un utilisateur est membre d'une salle (existante)
    static async isMember(roomId, userId) {
        const [rows] = await db.execute(
            'SELECT * FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );
        return rows.length > 0;
    }

    // ✅ Nouvelle méthode : vérifie membership plus efficace via COUNT(*)
    static async checkMembership(roomId, userId) {
        const [rows] = await db.execute(
            'SELECT COUNT(*) AS count FROM room_members WHERE room_id = ? AND user_id = ?',
            [roomId, userId]
        );
        return rows[0].count > 0;
    }

    // Récupère les membres d'une salle
    static async getMembers(roomId) {
        const [rows] = await db.execute(
            `SELECT u.id, u.username, u.email
             FROM users u
             JOIN room_members rm ON u.id = rm.user_id
             WHERE rm.room_id = ?`,
            [roomId]
        );
        return rows;
    }

    // Vérifie le mot de passe d'une salle privée
    static async checkPassword(roomId, password) {
        const room = await this.findById(roomId);
        if (!room || !room.is_private || !room.password) {
            return false; // Salle non trouvée, non privée ou pas de mot de passe
        }
        return await bcrypt.compare(password, room.password);
    }
    
}

module.exports = Room;
