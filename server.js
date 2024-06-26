const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const port = 3000;
const PLAYER_SPEED = 5;
const TICK_RATE = 30;
const PLAYER_SIZE = 64;
const BOX_SIZE = 64;
const BULLET_SIZE = 8;
const BULLET_DAMAGE = 1;
const BULLET_SPEED = 10;
const BULLET_DIASPEED = (BULLET_SPEED * Math.sqrt(2)) / 2;
const PLAYER_DIASPEED = PLAYER_SPEED * Math.sqrt(2) / 2;

app.get("/", (req, res) => {
    res.sendFile('index.html', { root: '.' });
});
app.use(cors({
  origin: "http://localhost:3000",
}));

app.use(express.static("public"));

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

let Players = [];
let box = [];
let bulletMap = [];
let inputsMap = [];

let collision = false;

function isColliding(rect1, rect2, rect1size, rect2size) {
  return (
    rect1.x < rect2.x + rect2size &&
    rect1.x + rect1size > rect2.x &&
    rect1.y < rect2.y + rect2size &&
    rect1.y + rect1size > rect2.y
  );
}

function tick() {
  for (const player of Players) {
    const input = inputsMap[player.id];
    if (input.topRight) {
      player.dir = "topRight";
      player.x += PLAYER_DIASPEED;
      player.y -= PLAYER_DIASPEED;
    } else if (input.topLeft) {
      player.dir = "topLeft";
      player.x -= PLAYER_DIASPEED;
      player.y -= PLAYER_DIASPEED;
    } else if (input.bottomRight) {
      player.dir = "bottomRight";
      player.x += PLAYER_DIASPEED;
      player.y += PLAYER_DIASPEED;
    } else if (input.bottomLeft) {
      player.dir = "bottomLeft";
      player.x -= PLAYER_DIASPEED;
      player.y += PLAYER_DIASPEED;
    } else { 
      if (input.up) {
        player.dir = "up";
        player.y -= PLAYER_SPEED;
      } else if (input.down) {
        player.dir = "down";
        player.y += PLAYER_SPEED;
      } else if (input.left) {
        player.dir = "left";
        player.x -= PLAYER_SPEED;
      } else if (input.right) {
        player.dir = "right";
        player.x += PLAYER_SPEED;
      }
    }

    for(const eachBox of box){
      if (isColliding(player, eachBox, PLAYER_SIZE , BOX_SIZE)) {
        collision = true;
        break;
      }
    }
    if (collision) {
      if (input.topRight) {
        player.x -= PLAYER_DIASPEED;
        player.y += PLAYER_DIASPEED;
      }
      if (input.bottomRight) {
        player.x -= PLAYER_DIASPEED;
        player.y -= PLAYER_DIASPEED;
      }
      if (input.topLeft) {
        player.x += PLAYER_DIASPEED;
        player.y += PLAYER_DIASPEED;
      }
      if (input.bottomLeft) {
        player.x += PLAYER_DIASPEED;
        player.y -= PLAYER_DIASPEED;
      }
      if (input.up) {
        player.y += PLAYER_SPEED; 
        break;
      }
      if (input.down) {
        player.y -= PLAYER_SPEED; 
        break;
      }
      if (input.left) {
        player.x += PLAYER_SPEED; 
        break;
      }
      if (input.right) {
        player.x -= PLAYER_SPEED; 
        break;
      }
    }
    collision = false;
    if (player.x <= 0) {
      player.x = 0;
    } else if (player.x >= 1214) {
      player.x = 1214;
    }
    if (player.y <= 0) {
      player.y = 0;
    } else if (player.y >= 656) {
      player.y = 656;
    }
    gameNamespace.emit("players", Players);
  }
}

let readyBullets = [];
let j = 0;
function updateBullets() {
  for (let i = bulletMap.length - 1; i >= 0; --i) {
    let bullet = bulletMap[i];
    if (bullet.active) {
      switch (bullet.dir) {
        case "up":
          bullet.y -= BULLET_SPEED;
          break;
        case "down":
          bullet.y += BULLET_SPEED;
          break;
        case "left":
          bullet.x -= BULLET_SPEED;
          break;
        case "right":
          bullet.x += BULLET_SPEED;
          break;
        case "topRight":
          bullet.x += BULLET_DIASPEED;
          bullet.y -= BULLET_DIASPEED;
          break;
        case "topLeft":
          bullet.x -= BULLET_DIASPEED;
          bullet.y -= BULLET_DIASPEED;
          break;
        case "bottomRight":
          bullet.x += BULLET_DIASPEED;
          bullet.y += BULLET_DIASPEED;
          break;
        case "bottomLeft":
          bullet.x -= BULLET_DIASPEED;
          bullet.y += BULLET_DIASPEED;
          break;
      }
    }
    readyBullets[j] = bullet;
    ++j;
  }
  gameNamespace.emit("bullet", readyBullets);
}

function bulletInteraction() {
  for (let bullet of bulletMap) {
    for (let player of Players) {
      if (isColliding(player, bullet, PLAYER_SIZE, BULLET_SIZE) && bullet.id != player.id) {
        player.health -= BULLET_DAMAGE;
        bullet.active = false;
        gameNamespace.emit("playerHealthUpdated", {
          playerId: player.id,
          health: player.health,
        });
        checkGameOver();
        break;
      } else if (bullet.x <= 0 || bullet.x >= 1256 || bullet.y <= 0 || bullet.y >= 708) {
        bullet.active = false;
        break;
      }
    }
    for (let eachbox of box) {
      if (isColliding(bullet, eachbox, BULLET_SIZE, BOX_SIZE)) {
        bullet.active = false;
        break;
      }
    }
    gameNamespace.emit("bullet_activeness", bullet.active);
  }
}

function removeInactiveBullets() {
  bulletMap = bulletMap.filter((bullet) => bullet.active);
}
let startingPositions = [];
function handleStartingPositions(){
  startingPositions = [
  { x: 50, y: 300, dir: "right", color: "blue" },
  { x: 600, y: 50, dir: "down", color: "red" },
  { x: 1130, y: 300, dir: "left", color: "yellow" },
  { x: 600, y: 600, dir: "up", color: "green" },
];
}
handleStartingPositions();
function checkGameOver() {
  let alivePlayers = Players.filter((player) => player.health > 0);
  if (alivePlayers.length === 1) {
    gameNamespace.emit("gameOver", alivePlayers[0].id);
    startingPositions = [];
    handleStartingPositions();
  }
}

async function main(){
  gameNamespace.on("connect", (socket) => {
    console.log("Client connected", socket.id);
    socket.on("message", (message) => {
      console.log(`Received message: ${message}`);
      // Handle message from client
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      // Handle client disconnection
    });

    let randomIndex = Math.floor(Math.random() * startingPositions.length);
    let startingPosition = startingPositions.splice(randomIndex, 1)[0];

    inputsMap[socket.id] = {
      up: false,
      down: false,
      left: false,
      right: false,
    };
    Players.push({
      id: socket.id,
      health: 5,
      ammo: 3,
      x: startingPosition.x,
      y: startingPosition.y,
      dir: startingPosition.dir,
      color: startingPosition.color,
    });

    socket.on("input", (inputs) => {
      inputsMap[socket.id] = inputs;
    });

    socket.on("boxes", (boxes) => {
      box = boxes;
    });
    socket.on("shoot", (bullet) => {
      bulletMap.push(bullet);
      io.emit("bullet", bullet);
    });
  });
  server.listen(port);
  setInterval(() => {
    tick();
    removeInactiveBullets();
    updateBullets();
    bulletInteraction();
  }, 1000 / TICK_RATE);
};
main();

