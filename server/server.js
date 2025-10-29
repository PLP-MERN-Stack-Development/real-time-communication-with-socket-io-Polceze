// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and messages
const users = {};
const messages = {
  general: [],
  random: [],
  tech: []
};
const typingUsers = {};
const rooms = ['general', 'random', 'tech'];

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send available rooms to the client
  socket.emit('room_list', rooms);

  // Handle user joining
  socket.on('user_join', (data) => {
    const { username, room = 'general' } = data;
    
    users[socket.id] = { 
      username, 
      id: socket.id, 
      room,
      isOnline: true,
      lastSeen: new Date().toISOString()
    };
    
    // Join the room
    socket.join(room);
    
    // Notify others in the room
    socket.to(room).emit('user_joined', { username, id: socket.id });
    
    // Send user list and room messages
    io.to(room).emit('user_list', getUsersInRoom(room));
    socket.emit('room_joined', room);
    socket.emit('receive_messages', messages[room] || []);
    
    console.log(`${username} joined room: ${room}`);
  });

  // Handle room joining
  socket.on('join_room', (room) => {
    if (users[socket.id]) {
      const previousRoom = users[socket.id].room;
      
      // Leave previous room
      socket.leave(previousRoom);
      
      // Join new room
      socket.join(room);
      users[socket.id].room = room;
      
      // Notify rooms
      socket.to(previousRoom).emit('user_left', users[socket.id]);
      socket.to(room).emit('user_joined', users[socket.id]);
      
      // Update user lists
      io.to(previousRoom).emit('user_list', getUsersInRoom(previousRoom));
      io.to(room).emit('user_list', getUsersInRoom(room));
      
      // Send room messages
      socket.emit('room_joined', room);
      socket.emit('receive_messages', messages[room] || []);
    }
  });

  // Handle chat messages
  socket.on('send_message', (messageData) => {
    const user = users[socket.id];
    if (!user) return;

    const { message, room = user.room } = messageData;
    
    const messageObj = {
      id: Date.now() + Math.random(),
      message,
      sender: user.username,
      senderId: socket.id,
      room,
      timestamp: new Date().toISOString(),
      reactions: {}
    };
    
    // Store message
    if (!messages[room]) messages[room] = [];
    messages[room].push(messageObj);
    
    // Limit stored messages to prevent memory issues
    if (messages[room].length > 100) {
      messages[room].shift();
    }
    
    // Send to room
    io.to(room).emit('receive_message', messageObj);
    
    // Send delivery receipt
    socket.emit('message_delivered', messageObj.id);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const user = users[socket.id];
    if (!user) return;

    const { isTyping, room = user.room } = data;
    
    if (isTyping) {
      typingUsers[socket.id] = {
        username: user.username,
        room
      };
    } else {
      delete typingUsers[socket.id];
    }
    
    // Send typing users for the specific room
    const roomTypingUsers = Object.values(typingUsers)
      .filter(u => u.room === room)
      .map(u => u.username);
    
    io.to(room).emit('typing_users', roomTypingUsers);
  });

  // Handle private messages
  socket.on('private_message', ({ to, message }) => {
    const fromUser = users[socket.id];
    const toUser = Object.values(users).find(u => u.id === to);
    
    if (!fromUser || !toUser) return;

    const messageData = {
      id: Date.now(),
      sender: fromUser.username,
      senderId: socket.id,
      receiver: toUser.username,
      receiverId: to,
      message,
      timestamp: new Date().toISOString(),
      isPrivate: true,
    };
    
    // Send to both users
    socket.to(to).emit('private_message', messageData);
    socket.emit('private_message', messageData);
  });

  // Handle message reactions
  socket.on('message_reaction', ({ messageId, reaction }) => {
    // Find message in any room and update reaction
    for (const room of Object.keys(messages)) {
      const messageIndex = messages[room].findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        const message = messages[room][messageIndex];
        message.reactions = message.reactions || {};
        message.reactions[reaction] = (message.reactions[reaction] || 0) + 1;
        
        // Broadcast reaction to all clients in the room
        io.to(room).emit('message_reaction', { messageId, reaction });
        break;
      }
    }
  });

  // Handle read receipts
  socket.on('message_read', (messageId) => {
    // Implement read receipt logic here
    console.log(`Message ${messageId} read by ${users[socket.id]?.username}`);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const user = users[socket.id];
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date().toISOString();
      
      // Notify room
      socket.to(user.room).emit('user_left', user);
      io.to(user.room).emit('user_list', getUsersInRoom(user.room));
      
      console.log(`${user.username} left the chat: ${reason}`);
      
      // Clean up after delay
      setTimeout(() => {
        if (!users[socket.id]?.isOnline) {
          delete users[socket.id];
          delete typingUsers[socket.id];
        }
      }, 5000);
    }
  });

  // Handle reconnection
  socket.on('reconnect', () => {
    const user = users[socket.id];
    if (user) {
      user.isOnline = true;
      socket.to(user.room).emit('user_joined', user);
      io.to(user.room).emit('user_list', getUsersInRoom(user.room));
    }
  });
});

// Helper function to get users in a room
function getUsersInRoom(room) {
  return Object.values(users).filter(user => user.room === room);
}

// API routes
app.get('/api/messages/:room', (req, res) => {
  const { room } = req.params;
  res.json(messages[room] || []);
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

// Serve notification sound
app.get('/notification.mp3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'notification.mp3'));
});

// Root route
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running');
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };