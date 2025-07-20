// backend/models/User.js
const db = require('../config/db'); // Assurez-vous que c'est bien votre pool promise-based
const bcrypt = require('bcryptjs'); // Assurez-vous d'avoir bcryptjs installé

class User {
    static async create(username, email, password, role = 'user') {
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, password, role]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    // Version robuste de findById (déjà correcte)
    static async findById(id) {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
            console.error(`[User.findById] ID non valide fourni: ${id}`);
            return null;
        }
        try {
            // SÉLECTIONNEZ UNIQUEMENT LES CHAMPS NÉCESSAIRES, PAS LE MOT DE PASSE
            const [rows] = await db.execute('SELECT id, username, email, role FROM users WHERE id = ?', [parsedId]);
            return rows[0];
        } catch (error) {
            console.error(`[User.findById] Erreur lors de la recherche de l'utilisateur par ID ${parsedId}:`, error);
            return null;
        }
    }

    static async findAll() {
        const [rows] = await db.execute('SELECT id, username, email, role, created_at FROM users ORDER BY username ASC');
        return rows;
    }

    static async updateRole(userId, role) {
        const [result] = await db.execute(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, userId]
        );
        return result.affectedRows > 0;
    }

    static async searchUsers(searchTerm) {
        const [rows] = await db.execute(
            `SELECT u.id, u.username, u.email, u.role, p.photo_url, p.intention
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE u.username LIKE ? OR u.email LIKE ?`,
            [`%${searchTerm}%`, `%${searchTerm}%`]
        );
        return rows;
    }
}

module.exports = User;