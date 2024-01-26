const server = require("http").createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('This is the Socket IO server for https://moodchecker.app and duhhh devices.');
});

const PORT = process.env.PORT || 5000; //for production
//const PORT = process.env.PORT || 9000; //for local dev

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

//
// Moodchecker
// io.of("/moodchecker")
//

// This is an object that stores 
// all client IDs as array per room,
// e.g. {"123456": ["user1", "user2", "user3"]}
let clients = {};

io.of("/moodchecker").on("connection", (socket) => {
  console.log(`/moodchecker: Client ${socket.id} connected`);

  // Join a room
  const { roomId } = socket.handshake.query;
  socket.join(roomId);
  if(clients.hasOwnProperty(roomId)===false) clients[roomId] = [];
  clients[roomId].push(socket.id);
  console.log(`/moodchecker: ${clients[roomId].length} clients in room ${roomId}`);

  // You can also fetch all client IDs per room
  // with this function, but since it's a Promise
  // it slows down the app, therefore not in use
  const getClientsInRoom = async (id) => {
    clientsInRoom = await io.of("/moodchecker").in(id).fetchSockets();
    return await clientsInRoom;
  }

  // getClientsInRoom(roomId).then((res)=>{
  //   console.log(`${res.length} clients in room ${roomId}`);
  // });

  // To all clients in room
  socket.on("mood", (data) => {
    io.of("/moodchecker").in(roomId).emit("new_mood", {
      clients: clients[roomId],
      content: data,
    });
  });

  socket.on("chat_message", (data) => {
    io.of("/moodchecker").in(roomId).emit("chat_message", data);
  });

  // To all clients in room except the sender
  socket.on("handPos", (data) => {
    io.of("/moodchecker").to(roomId).emit("new_handPos", {
      clients: clients[roomId],
      content: data,
    });
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log(`/moodchecker: Client ${socket.id} diconnected`);
    clients[roomId] = clients[roomId].filter((item) => item !== socket.id);
    socket.leave(roomId);
  });
});


//
// duhhh Device
// io.of("/duhhh-device")
//

// This is an object that stores 
// all values as objects per room,
// e.g. {"000001": {"button1":0, "button2":1, "knob1":10}}
let values = [];

io.of("/duhhh-device").on("connection", (socket) => {
  console.log(`/duhhh-device: Client ${socket.id} connected`);

  // Join a room
  const { roomId } = socket.handshake.auth.room;
  socket.join(roomId);
  if(values.hasOwnProperty(roomId)===false) values[roomId] = {};

  // To all clients in room
  socket.on("set_state", (data) => {
    if(data.hasOwnProperty('button1')) values[roomId]['button1'] = data.button1;
    else if(data.hasOwnProperty('button2')) values[roomId]['button2'] = data.button2;
    else if(data.hasOwnProperty('knob1')) values[roomId]['knob1'] = data.knob1;
    io.of("/duhhh-device").in(roomId).emit("response", {
      content: values[roomId],
    });
  });

  // Leave the room if the user closes the socket
  socket.on("disconnect", () => {
    console.log(`/duhhh-device: Client ${socket.id} diconnected`);
    socket.leave(roomId);
  });
});