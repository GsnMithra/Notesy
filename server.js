const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log("New noʊtsi connected: " + socket.id);
    
    socket.on('join-room', (info) => {
        const room = info.room;
        socket.join(room);
        io.to(room).emit('room-joined', `User joined room: ${room}`)
    });

    socket.on('draw', (data) => {
        io.to(data.room).emit('draw', data);
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
    });
});

server.listen(8000, () => {
    console.log('running on port: 8000');
})