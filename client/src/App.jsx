import React, { useState, useEffect } from 'react';
import { useSocket } from './socket/socket';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';
import NotificationCenter from './components/NotificationCenter';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const {
    isConnected,
    connect,
    disconnect,
    requestNotificationPermission
  } = useSocket();

  useEffect(() => {
    // Request notification permission on app load
    requestNotificationPermission();
  }, []);

  const handleLogin = (name) => {
    setUsername(name);
    setIsLoggedIn(true);
    connect(name);
  };

  const handleLogout = () => {
    disconnect();
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Real-Time Chat</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          {isLoggedIn && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {!isLoggedIn ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <ChatRoom username={username} />
            <NotificationCenter />
          </>
        )}
      </main>
    </div>
  );
}

export default App;