import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../socket/socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import RoomSelector from './RoomSelector';

const ChatRoom = ({ username }) => {
  const {
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    unreadCount,
    joinRoom,
    sendMessage,
    sendPrivateMessage,
    setTyping
  } = useSocket();

  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef();

  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(message);
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      setTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(false);
    }, 1000);
  };

  const handleTypingStop = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      setIsTyping(false);
      setTyping(false);
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        setTyping(false);
      }
    };
  }, []);

  return (
    <div className="chat-room">
      <div className="chat-sidebar">
        <RoomSelector
          rooms={rooms}
          currentRoom={currentRoom}
          onRoomChange={joinRoom}
          unreadCount={unreadCount}
        />
        <UserList
          users={users}
          currentUser={username}
          onPrivateMessage={sendPrivateMessage}
        />
      </div>
      
      <div className="chat-main">
        <div className="chat-header">
          <h2>#{currentRoom}</h2>
          <span className="room-users">
            {users.length} user{users.length !== 1 ? 's' : ''} online
          </span>
        </div>
        
        <MessageList
          messages={messages}
          currentUser={username}
          typingUsers={typingUsers}
        />
        
        <MessageInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          disabled={!username}
        />
      </div>
    </div>
  );
};

export default ChatRoom;