const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});


io.on('connection', (socket) => {
    console.log("New client connected: " + socket.id);
    
    socket.on('join-room', (room) => {
        socket.join(room);
        console.log("Joined room: " + room);
        io.to(room).emit('roomJoined', `User joined room: ${room}`)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
    })
});

server.listen(8000, () => {
    console.log('listening on *:8000');
})