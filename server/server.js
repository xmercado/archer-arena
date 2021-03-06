// Server-related functions will go here
var dotenv = require('dotenv').config();
var express = require('express');
var http = require('http');
var path = require('path');
var socket = require('socket.io');
var redis = require('redis');
var bodyParser = require('body-parser');

var app = express();
var server = http.Server(app);
var io = socket(server);
var client = redis.createClient(process.env.REDIS_URL, {no_ready_check: true});
module.exports = {client: client, io: io};

var room = require('./room');

app.set('port', 4200);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const routes = require('./router')(app);

app.use('/', express.static(path.join(__dirname, '../client')));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, '../client/main.html'));
});

client.on("error", function (err) {
    console.log("Redis Error: " + err);
});

server.listen(process.env.PORT || 4200, function() {
    console.log('Starting server on port 4200');
});

io.on('connection', function(socket) {
    console.log("socket connected: " + socket.id);
    socket.on('connect', function() {
        console.log(socket.id);
    });

    socket.on('disconnecting', function() {
        console.log(socket.id + ' is disconnecting');
        for(key in socket.rooms) {
            if(key != socket.id) {
                room.leaveRoom(socket, key);
            }
        }
    });

    socket.on('createRoom', function(data) {
        console.log(socket.id + ' is creating a room');
        room.createRoom(socket, data.roomInfo, data.playerData);
    });

    socket.on('joinRoom', function(data) {
        room.joinRoom(socket, data.roomId, data.playerData);
    });

    socket.on('joinOrCreateRandomRoom', function(data) {
        room.joinOrCreateRandomRoom(socket, data);
    });

    socket.on('broadcastForceUpdateData', function(roomId) {
        room.broadcastForceUpdateData(socket, roomId);
    });

    socket.on('updatePlayerData', function(data) {
        room.updatePlayerData(socket, data.roomId, data.player);
    });

    socket.on('updateArrowData', function(data) { 
        room.updateArrowData(socket, data.roomId, data.arrows)
    })

    socket.on('sendHitData', function(data) {
        room.sendHitData(socket, data.arrow, data.shooter, data.roomId);
    });

    socket.on('fetchRoomData', function(roomId) {
        room.fetchRoomData(socket, roomId);
    })

    socket.on('fetchAllRooms', function(pageNum) {
        room.fetchAllRooms(socket, pageNum);
    })

    socket.on('deleteRoom', (roomId) => {
        room.deleteRoom(socket, roomId);
    })
});
