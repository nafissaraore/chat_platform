// backend/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',  // ❌ Vous aviez '3306' ici !
    port: process.env.DB_PORT || 3306,        // ✅ Ajout du port
    user: process.env.DB_USER || 'pgroupeb_traorenafissa',
    password: process.env.DB_PASSWORD || 'Miss@traore',
    database: process.env.DB_NAME || 'pgroupeb_chat_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ✅ Ajout pour les connexions externes (cPanel)
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connexion à la base de données MySQL réussie !');
        connection.release();
    } catch (error) {
        console.error('Erreur de connexion à la base de données MySQL :', error.message);
        // ❌ Retirez process.exit(1) pour Vercel
        // process.exit(1);
    }
}

// ✅ Appelez seulement en développement
if (process.env.NODE_ENV !== 'production') {
    testConnection();
}

module.exports = pool;