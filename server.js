// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', socket => {
    console.log('New user connected');

    socket.on('join', room => {
        socket.join(room);
        socket.to(room).emit('user-connected');
    });

    socket.on('disconnect', () => {
        io.emit('user-disconnected');
    });

    socket.on('offer', payload => {
        io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', payload => {
        io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', payload => {
        io.to(payload.target).emit('ice-candidate', payload);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
