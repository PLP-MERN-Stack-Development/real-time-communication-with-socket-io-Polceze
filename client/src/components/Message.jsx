import React, { useState } from 'react';
import { useSocket } from '../socket/socket';

const Message = ({ message, isOwn }) => {
  const { addReaction } = useSocket();
  const [showReactions, setShowReactions] = useState(false);

  const handleReaction = (reaction) => {
    addReaction(message.id, reaction);
    setShowReactions(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  if (message.system) {
    return (
      <div className="message system-message">
        <span className="message-content">{message.message}</span>
        <span className="message-time">
          {formatTime(message.timestamp)}
        </span>
      </div>
    );
  }

  return (
    <div className={`message ${isOwn ? 'own-message' : 'other-message'}`}>
      {!isOwn && (
        <div className="message-sender">{message.sender}</div>
      )}
      
      <div className="message-content-wrapper">
        <div className="message-content">
          {message.message}
        </div>
        
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="message-reactions">
            {Object.entries(message.reactions).map(([reaction, count]) => (
              <span key={reaction} className="reaction">
                {reaction} {count}
              </span>
            ))}
          </div>
        )}
        
        <div className="message-actions">
          <button
            className="reaction-button"
            onClick={() => setShowReactions(!showReactions)}
          >
            🙂
          </button>
          
          {showReactions && (
            <div className="reaction-picker">
              {reactions.map((reaction) => (
                <button
                  key={reaction}
                  className="reaction-option"
                  onClick={() => handleReaction(reaction)}
                >
                  {reaction}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="message-time">
        {formatTime(message.timestamp)}
        {message.isPrivate && ' 🔒'}
      </div>
    </div>
  );
};

export default Message;