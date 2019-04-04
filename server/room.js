var server = require('./server');
var uuid = require('uuid');
var redis = require('redis');

module.exports = {
  createRoom: function (socket, roominfo) {
    const roomId = uuid();
    socket.join(roomId);

    // Initializes an id to given room for client usage
    server.io.sockets.adapter.rooms[roomId].id = roomId;

    // Initializes the player who created the room [Placeholder as of now]
    server.io.sockets.adapter.rooms[roomId].sockets[socket.id] = {
      x: 0,
      y: 0,
      velocity: { x: 0, y: 0 },
      score: 0
    };

    // TODO: Add options to room, placeholder for now
    server.io.sockets.adapter.rooms[roomId].arrows = {};

    // TODO: Add options to room, placeholder for now
    // roominfo is passed in from interface.js => contains 
    // all the room information to be displayed in the room list
    server.io.sockets.adapter.rooms[roomId].options = roominfo;
    // Holds the roomId for each room created to be accessed for the delete room function
    server.io.sockets.adapter.rooms[roomId].options.KEY = roomId;
    socket.emit("obtainFetchedRooms", [roominfo]);

    // TODO: Add password to room, placeholder for now
    server.io.sockets.adapter.rooms[roomId].password = {};

    const room = server.io.sockets.adapter.rooms[roomId];
    server.client.set(roomId, JSON.stringify(room), redis.print);
    socket.emit('joinedRoom', room);
  },

  joinRoom: function (socket, roomId) {
    socket.join(roomId);

    // Initializes the player who is joining the room [Placeholder as of now]
    server.io.sockets.adapter.rooms[roomId].sockets[socket.id] = {
      x: 0,
      y: 0,
      velocity: { x: 0, y: 0 },
      score: 0
    };

    const room = server.io.sockets.adapter.rooms[roomId];
    server.client.set(roomId, JSON.stringify(room), redis.print);
    socket.emit('joinedRoom', room);
    socket.to(roomId).emit('someoneJoined', room);
  },

  // Updates a single player's data inside of a room
  updatePlayerData: function (socket, roomId, player) {
    const room = server.io.sockets.adapter.rooms[roomId];
    if (room) {
      room.sockets[socket.id] = player;
      server.client.set(roomId, JSON.stringify(room));
    }
  },

  updateArrowData: function (socket, roomId, arrows) {
    const room = server.io.sockets.adapter.rooms[roomId];
    for (let key in arrows) {
      room.arrows[key] = arrows[key].data;
    }
    server.client.set(roomId, JSON.stringify(room));
  },

  // Fetches a room's data for any player requesting it.
  fetchRoomData: function (socket, roomId) {
    server.client.get(roomId, function (error, data) {
      if (error)
        console.log(error);

      socket.emit('obtainFetchedRoomData', JSON.parse(data));
    });
  },

  fetchAllRooms: function (socket, pageNum) {
    server.client.keys('*', function (error, data) {
      roomIndexStart = (pageNum - 1) * 10;
      roomIndexEnd = (pageNum * 10);

      if (roomIndexEnd > data.length) {
        roomIndexEnd = data.length;
      }

      if (roomIndexStart > data.length) {
        roomIndexStart = 0;
      }

      let roomIds = data.slice(roomIndexStart, roomIndexEnd);

      server.client.mget(roomIds, function (error, data) {
        console.log("mget", data);
        let rooms = [];
        // this stops an error from occuring when mget is undefined
        if (data) {
          data.forEach(roomData => {
            parsedRoomData = JSON.parse(roomData);
            rooms.push(parsedRoomData.options);
          });
        }
        socket.emit('obtainFetchedRooms', rooms);
      });
    });
  },

  deleteRoom: function (socket, davKey) {
    server.client.exists(thisKey, function (err, reply) {
      if (reply === 1) {
        server.client.del(thisKey, function (err, reply) {
        console.log("DELETED:", reply);
        });
      } else {
        console.log('doesn\'t exist');
      }
    });
  }
}
