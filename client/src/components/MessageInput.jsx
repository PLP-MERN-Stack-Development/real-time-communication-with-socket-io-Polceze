import React, { useState } from 'react';

const MessageInput = ({ onSendMessage, onTypingStart, onTypingStop, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      onTypingStop();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (e.target.value.trim()) {
      onTypingStart();
    } else {
      onTypingStop();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-form">
      <div className="message-input-wrapper">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Connecting..." : "Type a message..."}
          disabled={disabled}
          className="message-input"
          rows={1}
        />
        <button 
          type="submit" 
          disabled={!message.trim() || disabled}
          className="send-button"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;