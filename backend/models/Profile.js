// backend/models/Profile.js
const db = require('../config/db');

class Profile {
    static async create(userId) {
        const [result] = await db.execute(
            'INSERT INTO profiles (user_id) VALUES (?)',
            [userId]
        );
        return result.insertId; // Note: insertId sera 0 si PRIMARY KEY est user_id
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute('SELECT * FROM profiles WHERE user_id = ?', [userId]);
        return rows[0];
    }

    static async update(userId, { age, gender, interests, intention, photo_url, location }) {
        const [result] = await db.execute(
            `UPDATE profiles SET
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                interests = COALESCE(?, interests),
                intention = COALESCE(?, intention),
                photo_url = COALESCE(?, photo_url),
                location = COALESCE(?, location),
                last_active = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [age, gender, interests, intention, photo_url, location, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Profile;