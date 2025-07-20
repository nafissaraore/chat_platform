// backend/server.js
console.log("----------------------------------------------------");
console.log("SERVEUR BACKEND DÉMARRÉ - FICHIER server.js EN COURS D'EXÉCUTION");
console.log("----------------------------------------------------");

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const db = require('./config/db');
const createTables = require('./database/initDb');

const authRoutes = require('./routes/authRoutes');
// const profileRoutes = require('./routes/profileRoutes'); // <-- C'était la ligne en double, je l'ai commentée
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const privateMessageRoutes = require('./routes/privateMessageRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const profileRoutes = require('./routes/profileRoutes'); // <-- Gardez celle-ci seulement


const authMiddleware = require('./middleware/authMiddleware');
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');
const PrivateMessage = require('./models/PrivateMessage');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
createTables();

app.use('/api/auth', authRoutes);
// MODIFICATION CLÉ ICI : Changé de '/api/profiles' à '/api/profile'
app.use('/api/profile', profileRoutes); // <-- C'est la ligne modifiée
app.use('/api/rooms', authMiddleware, roomRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/private-messages', authMiddleware, privateMessageRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/conversations', authMiddleware, conversationRoutes);

app.set('socketio', io);

// --- Gestion des utilisateurs en ligne ---
const onlineUsersMap = new Map();

const emitOnlineUsers = async () => {
    const uniqueUserIds = new Set();
    onlineUsersMap.forEach(user => uniqueUserIds.add(user.userId));

    const usersList = [];
    for (const userId of uniqueUserIds) {
        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) continue;

        try {
            const userDetails = await User.findById(parsedUserId);
            if (userDetails) {
                usersList.push({ id: userDetails.id, username: userDetails.username });
            }
        } catch (error) {
            console.error(`[emitOnlineUsers] Erreur utilisateur ${parsedUserId}:`, error);
        }
    }

    io.emit('onlineUsers', usersList);
    console.log('Utilisateurs en ligne émis:', usersList.map(u => u.username));
};
// --- Fin gestion des utilisateurs en ligne ---

io.on('connection', (socket) => {
    console.log(`Utilisateur connecté via Socket.IO : ${socket.id}`);

    socket.on('userOnline', async (userId) => {
        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) return;

        try {
            const userDetails = await User.findById(parsedUserId);
            if (userDetails) {
                onlineUsersMap.set(socket.id, { userId: userDetails.id, username: userDetails.username });
                emitOnlineUsers();
            }
        } catch (error) {
            console.error('Erreur userOnline:', error);
        }
    });

    socket.on('userOffline', (userId) => {
        onlineUsersMap.delete(socket.id);
        emitOnlineUsers();
        console.log(`Utilisateur ${userId} est maintenant hors ligne.`);
    });

    socket.on('joinRoom', async (roomName) => {
        try {
            const room = await Room.findByName(roomName);
            if (!room) return socket.emit('roomError', 'Salle non trouvée.');

            socket.join(roomName);
            console.log(`Utilisateur ${socket.id} a rejoint la salle Socket.IO : ${roomName}`);
            socket.to(roomName).emit('message', {
                user: 'System',
                content: `Un nouvel utilisateur a rejoint la salle ${roomName}.`,
                message_type: 'text'
            });
        } catch (error) {
            console.error('Erreur joinRoom:', error);
            socket.emit('roomError', 'Erreur serveur lors de l\'adhésion à la salle.');
        }
    });

    // ✅ Correction appliquée ici
    socket.on('chatMessage', async (data) => {
        const { roomId, userId, username, content, messageType, roomName } = data;

        if (!roomId || !userId || !username || !content || !roomName) {
            console.warn('Données de message de salle incomplètes:', data);
            return;
        }

        try {
            // ✅ Correction : on passe aussi username à create()
            const messageId = await Message.create(roomId, userId, username, content, messageType || 'text');

            const savedMessage = {
                id: messageId,
                room_id: roomId,
                user_id: userId,
                username,
                content,
                message_type: messageType || 'text',
                created_at: new Date().toISOString(),
                sender_id: userId
            };

            io.to(roomName).emit('message', savedMessage);
        } catch (error) {
            console.error('Erreur enregistrement message:', error);
            socket.emit('messageError', 'Échec de l\'envoi du message de salle.');
        }
    });

    socket.on('joinPrivateRoom', (privateRoomName) => {
        socket.join(privateRoomName);
        console.log(`Utilisateur ${socket.id} a rejoint la salle privée : ${privateRoomName}`);
    });

    socket.on('privateMessage', async (data) => {
        const { senderId, receiverId, content, senderUsername, messageType } = data;

        if (!senderId || !receiverId || !content || !senderUsername) return;

        try {
            const message = await PrivateMessage.create({
                sender_id: senderId,
                receiver_id: receiverId,
                content,
                message_type: messageType || 'text'
            });

            const savedMessage = {
                id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.content,
                message_type: message.message_type,
                created_at: message.created_at,
                sender_username: senderUsername
            };

            const privateRoomName = [senderId, receiverId].sort((a, b) => a - b).join('-');
            io.to(privateRoomName).emit('privateMessage', savedMessage);
        } catch (error) {
            console.error('Erreur envoi message privé:', error);
            socket.emit('privateMessageError', 'Échec de l\'envoi du message privé.');
        }
    });

    socket.on('leaveRoom', (roomName) => {
        socket.leave(roomName);
        console.log(`Utilisateur ${socket.id} a quitté la salle : ${roomName}`);
    });

    socket.on('leavePrivateRoom', (privateRoomName) => {
        socket.leave(privateRoomName);
        console.log(`Utilisateur ${socket.id} a quitté la salle privée : ${privateRoomName}`);
    });

    socket.on('disconnect', () => {
        console.log(`Utilisateur déconnecté : ${socket.id}`);
        onlineUsersMap.delete(socket.id);
        emitOnlineUsers();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 