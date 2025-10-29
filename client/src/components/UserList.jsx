import React, { useState } from 'react';

const UserList = ({ users, currentUser, onPrivateMessage }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateMessage, setPrivateMessage] = useState('');

  const handlePrivateMessage = (user) => {
    if (privateMessage.trim() && user.id !== selectedUser?.id) {
      onPrivateMessage(user.id, privateMessage);
      setPrivateMessage('');
      setSelectedUser(null);
    }
  };

  return (
    <div className="user-list">
      <h3>Online Users ({users.length})</h3>
      <div className="users">
        {users.map((user) => (
          <div
            key={user.id}
            className={`user-item ${user.username === currentUser ? 'current-user' : ''}`}
          >
            <div className="user-info">
              <span className="user-status online"></span>
              <span className="username">{user.username}</span>
              {user.username === currentUser && <span> (You)</span>}
            </div>
            
            {user.username !== currentUser && (
              <button
                className="private-message-btn"
                onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
              >
                💬
              </button>
            )}
            
            {selectedUser?.id === user.id && (
              <div className="private-message-input">
                <input
                  type="text"
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                  placeholder={`Message ${user.username}...`}
                  onKeyPress={(e) => e.key === 'Enter' && handlePrivateMessage(user)}
                />
                <button onClick={() => handlePrivateMessage(user)}>Send</button>
                <button onClick={() => setSelectedUser(null)}>Cancel</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;