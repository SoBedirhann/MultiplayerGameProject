const socket = io('/game'); // Assumes the socket.io library is included in your HTML
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

//let Images = [ blueCharImg, redCharImg, greenCharImg, yellowCharImg];
// let playersTypes = [
//   { x: 50, y: 300, img: blueCharImg },
//   { x: 600, y: 50, img: redCharImg },
//   { x: 1130, y: 300, img: greenCharImg },
//   { x: 600, y: 600, img: yellowCharImg },
// ];

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
  }
  players = serverPlayers;
});

const inputs = {
  right: false,
  left: false,
  up: false, 
  down: false,
};

window.addEventListener('keydown', (event) => {
  console.log(event.key);
  switch (event.key) {
    case "w":
      inputs['up'] = true;
      break;
    case "s":
      inputs['down'] = true;
      break;
    case "a":
      inputs['left'] = true;
      break;
    case "d":
      inputs['right'] = true;
      break;
    default:
      return;
  }
  socket.emit('input', inputs);
});        

window.addEventListener("keyup", (event) => {
  console.log(event.key);
  switch (event.key) {
    case "w":
      inputs['up'] = false;
      break;
    case "s":
      inputs['down'] = false;
      break;
    case "a":
      inputs['left'] = false;
      break;
    case "d":
      inputs['right'] = false;
      break;
    default:
      return;
  }
  socket.emit("input", inputs);
});

// complete bullshit

// // Listen for player movement updates
// socket.on("playerMoved", (data) => {
//   // Update the position of the player in the players array
//   players.find((player) => player.id === data.id).x = data.x;
//   players.find((player) => player.id === data.id).y = data.y;

//   // Render the updated game
//   renderGame();
// });



/*                                              // SONRA DONULECEK BURAYA
// Handle shooting input (e.g., pressing the spacebar)
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        // Emit a 'shoot' event to the server
        socket.emit('shoot', { direction: players.direction }); // Assuming 'player.direction' contains the direction the player is facing
    }
});
// Handle player health update
socket.on('playerHealthUpdated', (data) => {
    // Update the player's health on the client-side
    if (data.playerId === players.id) {
        players.health = data.health;
        // Update the UI to reflect the new health status
        updateHealthUI(players.health);
    }
});

// Function to update the health UI
function updateHealthUI(health) {
    // Update the UI to display the player's health status (e.g., heart icons)
    // This depends on your specific UI implementation
}
// Handle game over
socket.on('gameOver', (data) => {
    // Display the game-over message to players
    if (data.winnerId === players.id) {
        alert('You won the game!'); // Show a message if the current player is the winner
    } else {
        alert('Game over, You lost.'); // Show a message if the current player is not the winner
    }
});
*/                                            // SONRA DONULECEK BURAYA

function renderGame() {
  // Clear the canvas
  //ctx.clearRect(0, 0, canvas.width, canvas.height);

  console.log("fordan once");
  
  for (const player of players) {

    console.log("fora girdi");
    // Save the current state of the canvas
    // ctx.save();
    // Translate the canvas origin to the center of the player image
    // ctx.translate(
    //   player.x + player.img.width / 2,
    //   player.y + player.img.height / 2
    // );
    
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
      // No rotation needed for 'up' direction
    }
    ctx.drawImage(playerImages[player.id], player.x, player.y);
    // Draw the player image with rotation applied
    //ctx.drawImage(player.img, -player.img.width / 2, -player.img.height / 2);
  }
  // Draw boxes
  boxes.forEach(box => {
    ctx.drawImage(boxImg, box.x, box.y);
  });
  // Request animation frame to continuously render the game
  window.requestAnimationFrame(renderGame);
}

window.requestAnimationFrame(renderGame);