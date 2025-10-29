import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

// Socket.io connection URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Create socket instance
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Custom hook for using socket.io
export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastMessage, setLastMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState(['general']);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Connect to socket server
  const connect = (username) => {
    socket.connect();
    if (username) {
      socket.emit('user_join', { username, room: currentRoom });
    }
  };

  // Disconnect from socket server
  const disconnect = () => {
    socket.disconnect();
  };

  // Send a message
  const sendMessage = (message) => {
    socket.emit('send_message', { 
      message, 
      room: currentRoom 
    });
  };

  // Send a private message
  const sendPrivateMessage = (to, message) => {
    socket.emit('private_message', { to, message });
  };

  // Join a room
  const joinRoom = (room) => {
    socket.emit('join_room', room);
    setCurrentRoom(room);
    setUnreadCount(0);
  };

  // Set typing status
  const setTyping = (isTyping) => {
    socket.emit('typing', { isTyping, room: currentRoom });
  };

  // Add reaction to message
  const addReaction = (messageId, reaction) => {
    socket.emit('message_reaction', { messageId, reaction });
  };

  // Socket event listeners
  useEffect(() => {
    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    };

    // Message events
    const onReceiveMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      
      // Increase unread count if not in current room
      if (message.room !== currentRoom) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const onPrivateMessage = (message) => {
      setLastMessage(message);
      setMessages((prev) => [...prev, message]);
      
      // Add notification for private message
      if (message.sender !== users.find(u => u.id === socket.id)?.username) {
        addNotification(`Private message from ${message.sender}`);
      }
    };

    // User events
    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${data.username} joined the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
      addNotification(`${data.username} joined the chat`);
    };

    const onUserLeft = (data) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          system: true,
          message: `${data.username} left the chat`,
          timestamp: new Date().toISOString(),
        },
      ]);
      addNotification(`${data.username} left the chat`);
    };

    // Typing events
    const onTypingUsers = (users) => {
      setTypingUsers(users);
    };

    // Room events
    const onRoomList = (roomList) => {
      setRooms(roomList);
    };

    const onRoomJoined = (room) => {
      setCurrentRoom(room);
      setMessages([]);
      setUnreadCount(0);
    };

    // Reaction events
    const onMessageReaction = (reactionData) => {
      setMessages(prev => prev.map(msg => 
        msg.id === reactionData.messageId 
          ? { ...msg, reactions: { ...msg.reactions, [reactionData.reaction]: (msg.reactions?.[reactionData.reaction] || 0) + 1 } }
          : msg
      ));
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('room_list', onRoomList);
    socket.on('room_joined', onRoomJoined);
    socket.on('message_reaction', onMessageReaction);

    // Clean up event listeners
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('room_list', onRoomList);
      socket.off('room_joined', onRoomJoined);
      socket.off('message_reaction', onMessageReaction);
    };
  }, [currentRoom, users]);

  // Add notification
  const addNotification = (message) => {
    const notification = {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [...prev, notification]);
    
    // Play sound notification
    playNotificationSound();
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('Chat App', { body: message });
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {}); // Ignore errors if audio can't play
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Mark notifications as read
  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  return {
    socket,
    isConnected,
    lastMessage,
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    unreadCount,
    notifications,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    joinRoom,
    setTyping,
    addReaction,
    requestNotificationPermission,
    markNotificationsAsRead,
  };
};

export default socket;