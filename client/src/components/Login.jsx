import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Join the Chat</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="username-input"
            maxLength={20}
            required
          />
          <button type="submit" className="login-button">
            Join Chat
          </button>
        </form>
        <div className="login-features">
          <h3>Features:</h3>
          <ul>
            <li>Real-time messaging</li>
            <li>Multiple chat rooms</li>
            <li>Private messaging</li>
            <li>Typing indicators</li>
            <li>Message reactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;