var net = require('net');
var http = require('http');
var WebSocketServer = require('ws').Server;

//
// Global variables
//
var tcpClients = [];
var websocketClients = [];

//
// Websockets
//
var wss = new WebSocketServer({port: 8080});
wss.on('connection', function (socket) {
    socket.name = "ws:" + Math.random();
    socket.write = socket.send;
    websocketClients.push(socket);
    // Client sends a message
    socket.on('message', function (msg) {
        handleData(socket, msg);
    });
    // Client leaves
    socket.on('close', function (msg) {
        var index = websocketClients.indexOf(socket);
        if (index === -1) return;
        websocketClients.splice(index, 1);
        console.log('removed at', index);
    });
});


//
// TCP Server
//
net.createServer(function (socket) {
    socket.name = socket.remoteAddress + ":" + socket.remotePort;
    tcpClients.push(socket);
    // Client sends a message
    socket.on('data', function (data) {
        handleData(socket, data.toString('utf8'));
    });
    // Client leaves
    socket.on('close', function () {
        var index = tcpClients.indexOf(socket);
        if (index === -1) return;
        tcpClients.splice(index, 1);
        console.log('removed at', index);
    });
}).listen(5000);


//
// Generic chat stuff
//
function handleData(socket, data) {
    var msg;
    try {
        msg = JSON.parse(data);
    } catch (e) {
        socket.write(JSON.stringify({type: "error", error: "unable to parse input", msg: e.message}));
        return;
    }
    if (msg.name) {
        socket.name = msg.name;
    }
    if (msg.message) {
        broadcast(socket.name, msg.message, msg.data || {}, socket);
        return;
    }
}

function broadcast(from, msg, extra) {
    var message = {
        type: "message",
        from: from,
        msg: msg || null,
        data: extra || null
    };
    tcpClients.forEach(function (client) {
        client.write(JSON.stringify(message));
    });
    websocketClients.forEach(function (client) {
        client.send(JSON.stringify(message));
    });
}
