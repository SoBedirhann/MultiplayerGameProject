const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const port = 3000;


// Define a route to handle requests to the root URL
app.get("/", (req, res) => {
    res.sendfile('index.html');
});
app.use(cors({
  origin: "http://localhost:3000",
}));
// Serve static files from the 'public' directory
app.use(express.static("public"));

// Serve the Socket.IO client library
app.use(
  "/socket.io",
  express.static(__dirname + "/node_modules/socket.io/client-dist")
);

var server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server);
const gameNamespace = io.of("game");
app.set("io", io);
app.set("game", gameNamespace);

gameNamespace.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("message", (message) => {
    console.log(`Received message: ${message}`);
    // Handle message from client
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Handle client disconnection
  });
});

let Players = {};
let bullet = {};
gameNamespace.on("connection", (socket) => {
  let startingPositions = [
    { x: 100, y: 100 },
    { x: 200, y: 200 },
    { x: 300, y: 300 },
    { x: 400, y: 400 },
  ];
  let randomIndex = Math.floor(Math.random() * startingPositions.length);
  let startingPosition = startingPositions[randomIndex];

  Players[socket.id] = {
    health: 5,
    ammo: 3,
    x: startingPosition.x,
    y: startingPosition.y,
  };
  socket.emit("initialPlayerState", Players[socket.id]);

  socket.on("disconnect", () => {
    delete Players[socket.id];
  });

  socket.on("move", (data) => {
    // Update player position
    Players[socket.id].x = data.x;
    Players[socket.id].y = data.y;

    // Broadcast updated player position to all clients except the sender
    socket.broadcast.emit("playerMoved", {
      playerId: socket.id,
      x: data.x,
      y: data.y,
    });
  });

  // Handle player shooting
  socket.on("shoot", (data) => {
    // Create a new bullet object with shooter's position and direction
    let bullet = {
      x: Players[socket.id].x,
      y: Players[socket.id].y,
      direction: data.direction, // Assuming 'data.direction' contains the shooting direction (e.g., 'up', 'down', 'left', 'right')
    };

    // Broadcast the new bullet object to all connected clients
    io.emit("bulletCreated", bullet);
  });

  // Handle bullet-player collisions
  function checkCollisions() {
    for (let bulletId in bullet) {
      let bullet = bullet[bulletId];
      for (let playerId in Players) {
        let player = Players[playerId];
        // Check if the bullet collides with the player
        if (bullet.x === player.x && bullet.y === player.y) {
          // Deduct health points from the player
          player.health -= 1;
          // Remove the bullet from the game
          delete bullet[bulletId];
          // Emit an event to update player health on all clients
          io.emit("playerHealthUpdated", {
            playerId: playerId,
            health: player.health,
          });
        }
      }
    }
  }

  // Periodically check for collisions
  setInterval(checkCollisions, 100); // Adjust the interval as needed

  // Handle player deaths and game over
  function checkGameOver() {
    let alivePlayers = Object.keys(Players).filter(
      (playerId) => Players[playerId].health > 0
    );
    // Check if there is only one player left standing
    if (alivePlayers.length === 1) {
      // Declare the remaining player as the winner
      let winnerId = alivePlayers[0];
      // Broadcast the game-over event to all connected clients
      io.emit("gameOver", { winnerId: winnerId });
    }
  }

  // Periodically check for game over
  setInterval(checkGameOver, 1000); // Adjust the interval as needed
});
server.listen(port);