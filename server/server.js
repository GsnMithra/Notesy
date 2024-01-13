const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    allowEIO3: true,
    transports: ['websocket'],
    allowUpgrades: false,
    perMessageDeflate: false,
    httpCompression: false,
    handlePreflightRequest: (req, res) => {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Credentials': 'true',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        });
        res.end();
    },
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

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`running on port: ${PORT}`);
})