const server = require("http").createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('This is the Socket IO server for https://moodchecker.app');
});
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 5000;

let clients = [];

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);
  clients.push(socket.id);

  // Join a room
  const { roomId } = socket.handshake.query;
  socket.join(roomId);

  // To all clients in room
  socket.on("mood", (data) => {
    io.in(roomId).emit("new_mood", {
      clients: clients,
      content: data,
    });
  });

  socket.on("chat_message", (data) => {
    io.in(roomId).emit("chat_message", data);
  });

  // To all clients in room except the sender
  socket.on("handPos", (data) => {
    io.to(roomId).emit("new_handPos", {
      clients: clients,
      content: data,
    });
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} diconnected`);
    clients = clients.filter((item) => item !== socket.id);
    socket.leave(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
