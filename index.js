const server = require("http").createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('This is the Socket IO server for https://moodchecker.app');
});

//const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT || 9000; //for local dev

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// This is an object that stores 
// all client IDs as array per room,
// e.g. {"123456": ["user1", "user2", "user3"]}
let clients = {};

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  // Join a room
  const { roomId } = socket.handshake.query;
  socket.join(roomId);
  if(clients.hasOwnProperty(roomId)===false) clients[roomId] = [];
  clients[roomId].push(socket.id);
  console.log(`${clients[roomId].length} clients in room ${roomId}`);

  // You can also fetch all client IDs per room
  // with this function, but since it's a Promise
  // it slows down the app, therefore not in use
  const getClientsInRoom = async (id) => {
    clientsInRoom = await io.in(id).fetchSockets();
    return await clientsInRoom;
  }

  // getClientsInRoom(roomId).then((res)=>{
  //   console.log(`${res.length} clients in room ${roomId}`);
  // });

  // To all clients in room
  socket.on("mood", (data) => {
    io.in(roomId).emit("new_mood", {
      clients: clients[roomId],
      content: data,
    });
  });

  socket.on("chat_message", (data) => {
    io.in(roomId).emit("chat_message", data);
  });

  // To all clients in room except the sender
  socket.on("handPos", (data) => {
    io.to(roomId).emit("new_handPos", {
      clients: clients[roomId],
      content: data,
    });
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} diconnected`);
    clients[roomId] = clients[roomId].filter((item) => item !== socket.id);
    socket.leave(roomId);
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
