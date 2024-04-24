//client.js
const socket = io('/game'); // Assumes the socket.io library is included in your HTML

const MAX_AMMO = 3;
const BULLET_SPEED = 10;

socket.on("connect", () => {
  console.log("Connected to server");
});
socket.on("message", (message) => {
  console.log(`Received message: ${message}`);
  // Handle message from server
});
socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
// Get a reference to the canvas element
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Load player and box images
const blueCharImg = new Image();
blueCharImg.src = 'blueChar.png';

const redCharImg = new Image();
redCharImg.src = 'redChar.png';

const greenCharImg = new Image();
greenCharImg.src = 'greenChar.png';

const yellowCharImg = new Image();
yellowCharImg.src = 'yellowChar.png';

const boxImg = new Image();
boxImg.src = 'box.png';

const bulletImg = new Image();
bulletImg.src = "bullet.png";

const boxes = [
  { x: 200, y: 150 },
  { x: 200, y: 214 },
  { x: 264, y: 150 },
  { x: 200, y: 400 },
  { x: 200, y: 464 },
  { x: 264, y: 464 },
  { x: 660, y: 392 },
  { x: 596, y: 392 },
  { x: 532, y: 392 },
  { x: 660, y: 328 },
  { x: 596, y: 328 },
  { x: 532, y: 328 },
  { x: 660, y: 264 },
  { x: 596, y: 264 },
  { x: 532, y: 264 },
  { x: 980, y: 150 },
  { x: 980, y: 214 },
  { x: 916, y: 150 },
  { x: 980, y: 400 },
  { x: 980, y: 464 },
  { x: 916, y: 464 },
];
socket.emit('boxes', boxes);

let players = [];
let playerImages = [];
socket.on("players", (serverPlayers)=>{
  for(let player of serverPlayers){
    if (player.color === "blue") {
      playerImages[player.id] = blueCharImg;
    } else if (player.color === "red") {
      playerImages[player.id] = redCharImg;
    } else if (player.color === "green") {
      playerImages[player.id] = greenCharImg;
    } else if (player.color === "yellow") {
      playerImages[player.id] = yellowCharImg;
    }
    players = serverPlayers;
  }
  
});

const inputs = {
  right: false,
  left: false,
  up: false,
  down: false,
  topRight: false,
  topLeft: false,
  bottomRight: false,
  bottomLeft: false,
};

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case "w":
      if (inputs.right) {
        inputs.topRight = true;
      } else if (inputs.left) {
        inputs.topLeft = true;
      } else {
        inputs["up"] = true;
      }
      break;
    case "s":
      if (inputs.right) {
        inputs.bottomRight = true;
      } else if (inputs.left) {
        inputs.bottomLeft = true;
      } else {
        inputs["down"] = true;
      }
      break;
    case "a":
      if (inputs.up) {
        inputs.topLeft = true;
      } else if (inputs.down) {
        inputs.bottomLeft = true;
      } else {
        inputs["left"] = true;
      }
      break;
    case "d":
      if (inputs.up) {
        inputs.topRight = true;
      } else if (inputs.down) {
        inputs.bottomRight = true;
      } else {
        inputs["right"] = true;
      }
      break;
    default:
      return;
  }
  socket.emit('input', inputs);
});        

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
      inputs['up'] = false;
      inputs.topRight = false;
      inputs.topLeft = false;
      break;
    case "s":
      inputs['down'] = false;
      inputs.bottomRight = false;
      inputs.bottomLeft = false;
      break;
    case "a":
      inputs['left'] = false;
      inputs.topLeft = false;
      inputs.bottomLeft = false;
      break;
    case "d":
      inputs['right'] = false;
      inputs.topRight = false;
      inputs.bottomRight = false;
      break;
    default:
      return;
  }
  socket.emit("input", inputs);
});

let bullets = [];
window.addEventListener("keydown", (event) => {
  event.preventDefault();
  const player = players.find((player) => player.id === socket.id);
  if (event.key === " " && bullets.length < MAX_AMMO) {
    const bullet = {
      id: socket.id,
      x: player.x + playerImages[player.id].width / 2 - 4,
      y: player.y + playerImages[player.id].height / 2 - 4,
      dir: player.dir,
      active: true,
    };
    bullets.push(bullet);
    socket.emit("shoot", bullet); 
  } else if(event.key == 'r') {
      if (bullets.length == 1) {
        setTimeout(() => {
          bullets = [];
        }, 1000);
      } else if (bullets.length == 2) {
        setTimeout(() => {
          bullets = [];
        }, 2000);
      } else if (bullets.length == 3) {
        setTimeout(() => {
          bullets = [];
        }, 3000);
      }
    }
});
let readyBullets = [];
socket.on("bullet", (bullets)=> {
  readyBullets = bullets;
});

let activeness = true;
function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for(const readyBullet of readyBullets){
    
    socket.on("bullet_activeness", (activeness) => {
      readyBullet.active = activeness;
    });

    if (readyBullet.active) {
      ctx.drawImage(bulletImg, readyBullet.x, readyBullet.y);
    } else {
      ctx.clearRect(
        readyBullet.x,
        readyBullet.y,
        bulletImg.width,
        bulletImg.height
      );
    }
  }
  boxes.forEach((box) => {
    ctx.drawImage(boxImg, box.x, box.y);
  });

  for (const player of players) {
    // Save the current state of the canvas
    ctx.save();
    // // Translate the canvas origin to the center of the player image
    ctx.translate(
      player.x + playerImages[player.id].width / 2,
      player.y + playerImages[player.id].height / 2
    );

    // Rotate the canvas based on the player's direction
    switch (player.dir) {
      case "right":
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
        break;
      case "down":
        ctx.rotate(Math.PI); // Rotate 180 degrees
        break;
      case "left":
        ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counterclockwise
        break;
      case "topRight":
        ctx.rotate(Math.PI / 4);
        break;
      case "bottomRight":
        ctx.rotate(Math.PI * 3 / 4);
        break;
      case "topLeft":
        ctx.rotate(-Math.PI / 4);
        break;
      case "bottomLeft":
        ctx.rotate(-Math.PI * 3 / 4);
        break;
    }
    // Draw the player image with rotation applied
    ctx.drawImage(playerImages[player.id],-playerImages[player.id].width / 2,-playerImages[player.id].height / 2);    
  }
  ctx.restore();

  window.requestAnimationFrame(renderGame);
}

window.requestAnimationFrame(renderGame);

