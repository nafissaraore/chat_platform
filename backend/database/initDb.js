const db = require('../config/db');

const createTables = async () => {
    try {
        // Création de la table 'users'
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'users' vérifiée/créée.");

        // Création de la table 'rooms'
        await db.execute(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                description TEXT,
                creator_id INT,
                is_private BOOLEAN DEFAULT FALSE, -- Ajout de la colonne is_private
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log("Table 'rooms' vérifiée/créée.");

        // Ajout de la colonne is_private si elle n'existe pas déjà (pour les bases de données existantes)
        // Ceci est une ALTER TABLE conditionnelle pour éviter les erreurs si la colonne existe déjà
        await db.execute(`
            ALTER TABLE rooms
            ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
        `).then(() => {
            console.log("Colonne 'is_private' ajoutée à la table 'rooms' (si elle n'existait pas).");
        }).catch((error) => {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log("Colonne 'is_private' existe déjà dans la table 'rooms'.");
            } else {
                console.error("Erreur lors de l'ajout de la colonne 'is_private' à la table 'rooms':", error);
            }
        });


        // Création de la table 'room_members' (pour les salles privées ou la gestion des membres)
        await db.execute(`
            CREATE TABLE IF NOT EXISTS room_members (
                room_id INT,
                user_id INT,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (room_id, user_id),
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table 'room_members' vérifiée/créée.");

        // Création de la table 'messages'
        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table 'messages' vérifiée/créée.");

        // Création de la table 'private_messages'
        await db.execute(`
            CREATE TABLE IF NOT EXISTS private_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table 'private_messages' vérifiée/créée.");

        // Création de la table 'profiles'
        await db.execute(`
            CREATE TABLE IF NOT EXISTS profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                bio TEXT,
                photo_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Table 'profiles' vérifiée/créée.");

    } catch (error) {
        console.error("Erreur lors de la création des tables:", error);
    }
};

module.exports = createTables;
