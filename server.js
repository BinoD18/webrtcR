// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const { exec } = require('child_process');

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

const inputStream = 'https://webrtcr.onrender.com/';
const command = `ffmpeg -i ${inputStream} -codec: copy -start_number 0 -hls_time 10 -hls_list_size 0 -f hls output.m3u8`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing FFmpeg: ${error.message}`);
    return;
  }
  console.log(`FFmpeg output: ${stdout}`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
