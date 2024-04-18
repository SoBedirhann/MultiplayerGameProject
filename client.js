const socket = io(); // Assumes the socket.io library is included in your HTML
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
// Handle player movement input (e.g., arrow keys)
document.addEventListener('keydown', (event) => {
    // Define movement speed
    const movementSpeed = 5;

    // Calculate new player coordinates based on movement input
    let newX = players.x;
    let newY = players.y;
    switch (event.key) {
        case 'W':
            newY += movementSpeed;
            break;
        case 'S':
            newY -= movementSpeed;
            break;
        case 'A':
            newX -= movementSpeed;
            break;
        case 'D':
            newX += movementSpeed;
            break;
        default:
            return;
    }

    // Send new player coordinates to the server
    socket.emit('move', { x: newX, y: newY });
});
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

// Player and box positions (dummy positions for demonstration)
const players = [
    { x: 100, y: 100, img: blueCharImg },
    { x: 200, y: 200, img: redCharImg },
    { x: 300, y: 300, img: greenCharImg },
    { x: 400, y: 400, img: yellowCharImg }
];

const boxes = [
    { x: 150, y: 150 },
    { x: 250, y: 250 },
    { x: 350, y: 350 }
];

// Function to render the game
function renderGame() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  players.forEach(player => {
    ctx.drawImage(player.img, player.x, player.y);
  });

  // Draw boxes
  boxes.forEach(box => {
    ctx.drawImage(boxImg, box.x, box.y);
  });

  // Request animation frame to continuously render the game
  requestAnimationFrame(renderGame);
}

// Start rendering the game
renderGame();
