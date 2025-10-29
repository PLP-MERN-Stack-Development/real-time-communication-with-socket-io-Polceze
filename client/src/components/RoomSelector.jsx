import React from 'react';

const RoomSelector = ({ rooms, currentRoom, onRoomChange, unreadCount }) => {
  return (
    <div className="room-selector">
      <h3>Chat Rooms</h3>
      <div className="rooms">
        {rooms.map((room) => (
          <button
            key={room}
            className={`room-button ${room === currentRoom ? 'active' : ''}`}
            onClick={() => onRoomChange(room)}
          >
            <span>#{room}</span>
            {room !== currentRoom && unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomSelector;