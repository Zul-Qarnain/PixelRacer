import * as THREE from 'three';

// --- Basic Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x55aa55); // Green grass

const aspectRatio = window.innerWidth / window.innerHeight;
const cameraHeight = 60;
const cameraWidth = cameraHeight * aspectRatio;

const camera = new THREE.OrthographicCamera(
    cameraWidth / -2, cameraWidth / 2,
    cameraHeight / 2, cameraHeight / -2,
    1, 1000
);
camera.position.set(0, 0, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Textures ---
const textureLoader = new THREE.TextureLoader();
let playerCarTexture;
let opponentCarTexture;
// Optional: Coin texture
// const coinTexture = textureLoader.load('coin.png');

try {
    playerCarTexture = textureLoader.load('player_car.png');
    opponentCarTexture = textureLoader.load('opponent_car.png');
    console.log("Textures loading initiated.");
    playerCarTexture.onerror = function (err) { console.error("Failed to load player_car.png", err); };
    opponentCarTexture.onerror = function (err) { console.error("Failed to load opponent_car.png", err); };
} catch (error) {
    console.error("Error initiating texture loading:", error);
}

// --- Game Elements ---

// Track & Road Lines (combined for simplicity)
const trackWidth = 25;
const trackLength = cameraHeight * 4;
const trackGeometry = new THREE.PlaneGeometry(trackWidth, trackLength);
const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
const track = new THREE.Mesh(trackGeometry, trackMaterial);
track.position.z = -0.1;
scene.add(track);

const roadLineGroup = new THREE.Group();
const lineDashLength = 4;
const lineDashGap = 3;
const lineDashWidth = 0.3;
const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const lineGeometry = new THREE.PlaneGeometry(lineDashWidth, lineDashLength);
const totalSegmentLength = lineDashLength + lineDashGap;
const linesVerticalRange = trackLength;
for (let y = -linesVerticalRange / 2 + lineDashLength / 2; y < linesVerticalRange / 2; y += totalSegmentLength) {
    const dash = new THREE.Mesh(lineGeometry.clone(), lineMaterial);
    dash.position.y = y;
    dash.position.z = track.position.z + 0.01;
    roadLineGroup.add(dash);
}
roadLineGroup.position.y = 0;
scene.add(roadLineGroup);


// Player Car
const carWidth = 3;
const carHeight = 5;
const playerCarGeometry = new THREE.PlaneGeometry(carWidth, carHeight);
const playerCarMaterial = new THREE.MeshBasicMaterial({
    map: playerCarTexture, transparent: true, side: THREE.DoubleSide
});
const playerCar = new THREE.Mesh(playerCarGeometry, playerCarMaterial);
const playerInitialPos = { x: 0, y: -cameraHeight / 4, z: 0 }; // Store initial position
playerCar.position.set(playerInitialPos.x, playerInitialPos.y, playerInitialPos.z);
scene.add(playerCar);
const playerCarBox = new THREE.Box3();

// Opponent Cars
const opponentCars = [];
let opponentSpeed = 0.45; // Base speed
let opponentSpawnTimer = 0;
const initialOpponentSpawnIntervalBase = 1.4; // Initial value
let opponentSpawnIntervalBase = initialOpponentSpawnIntervalBase; // Current value
const opponentCarWidth = 3;
const opponentCarHeight = 5;
const opponentGeometry = new THREE.PlaneGeometry(opponentCarWidth, opponentCarHeight); // Shared Geometry

// Gold Coins
const coins = [];
const coinRadius = 1;
const coinGeometry = new THREE.CircleGeometry(coinRadius, 16); // Simple circle
const coinMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide }); // Gold color
// Optional: Use texture instead
// const coinMaterial = new THREE.MeshBasicMaterial({ map: coinTexture, transparent: true, side: THREE.DoubleSide });
const coinSpeed = 0.35; // Slower than opponents
const coinSpawnChance = 0.4; // 40% chance at milestone
const coinScoreBonus = 5; // Points for collecting a coin


// --- Game State & UI ---
let score = 0;
let isGameOver = false;
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const instructionsElement = document.getElementById('instructions');
const restartButton = document.getElementById('restart-button');


// --- Difficulty Tracking ---
const initialPlayerMoveSpeed = 0.5; // Initial value
let playerMoveSpeed = initialPlayerMoveSpeed; // Current value
let lastSpeedIncreaseScore = 0;
let lastTrafficIncreaseScore = 0;


// --- Controls ---
const keysPressed = {};
let velocityY = 0;
let velocityX = 0;
const friction = 0.92;

document.addEventListener('keydown', (event) => { keysPressed[event.key.toLowerCase()] = true; });
document.addEventListener('keyup', (event) => { keysPressed[event.key.toLowerCase()] = false; });

// --- Functions ---

function spawnOpponent() {
    const opponentMaterial = new THREE.MeshBasicMaterial({
        map: opponentCarTexture, transparent: true, side: THREE.DoubleSide
    });
    const opponentCar = new THREE.Mesh(opponentGeometry, opponentMaterial); // Reuse geometry

    const halfTrack = trackWidth / 2;
    const margin = opponentCarWidth / 2 + 0.5;
    opponentCar.position.x = Math.random() * (trackWidth - margin * 2) - (halfTrack - margin);
    opponentCar.position.y = camera.position.y + cameraHeight / 2 + opponentCarHeight;
    opponentCar.position.z = 0;
    opponentCar.userData = { type: 'opponent', passed: false, boundingBox: new THREE.Box3() }; // Add type

    scene.add(opponentCar);
    opponentCars.push(opponentCar);
}

function spawnCoin() {
    const coin = new THREE.Mesh(coinGeometry.clone(), coinMaterial); // Clone geometry

    const halfTrack = trackWidth / 2;
    const margin = coinRadius + 0.5; // Margin for coin radius
    coin.position.x = Math.random() * (trackWidth - margin * 2) - (halfTrack - margin);
    coin.position.y = camera.position.y + cameraHeight / 2 + coinRadius * 2; // Start above view
    coin.position.z = 0; // Same level as car
    coin.userData = { type: 'coin', boundingBox: new THREE.Box3() }; // Add type

    scene.add(coin);
    coins.push(coin);
}


function updateOpponents(deltaTime) {
    const deltaMultiplier = deltaTime * 60;
    for (let i = opponentCars.length - 1; i >= 0; i--) {
        const opponent = opponentCars[i];
        opponent.position.y -= opponentSpeed * deltaMultiplier;
        opponent.userData.boundingBox.setFromObject(opponent);

        // --- Scoring, Difficulty, Coin Spawn ---
        if (!opponent.userData.passed && opponent.position.y < playerCar.position.y) {
            score++; // Score for passing a car
            scoreElement.innerText = `Score: ${score}`;
            opponent.userData.passed = true;

            // Difficulty: Speed Increase
            if (score % 10 === 0 && score > lastSpeedIncreaseScore) {
                playerMoveSpeed += 0.03;
                lastSpeedIncreaseScore = score;
                console.log(`Player speed potential increased! New base factor: ${playerMoveSpeed.toFixed(2)}`);
            }

            // Difficulty: Traffic Increase
            if (score % 50 === 0 && score > lastTrafficIncreaseScore) {
                opponentSpawnIntervalBase = Math.max(0.4, opponentSpawnIntervalBase - 0.15);
                lastTrafficIncreaseScore = score;
                console.log(`Traffic increased! New base spawn interval: ${opponentSpawnIntervalBase.toFixed(2)}s`);
            }

             // Chance to Spawn Coin (every 5 points passed)
             if (score > 0 && score % 5 === 0 && Math.random() < coinSpawnChance) {
                 spawnCoin();
                 console.log("Coin Spawned!");
             }
        }

        // Remove if off-screen + Cleanup
        if (opponent.position.y < camera.position.y - cameraHeight / 2 - opponentCarHeight * 2) {
            removeGameObject(opponent, opponentCars, i);
        }
    }
}

function updateCoins(deltaTime) {
    const deltaMultiplier = deltaTime * 60;
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.position.y -= coinSpeed * deltaMultiplier;
        coin.userData.boundingBox.setFromObject(coin);

        // Remove if off-screen + Cleanup
        if (coin.position.y < camera.position.y - cameraHeight / 2 - coinRadius * 4) { // Extra buffer
             removeGameObject(coin, coins, i);
        }
    }
}

function checkCollisions() {
    playerCarBox.setFromObject(playerCar); // Update player box once

    // Check against opponents
    for (const opponent of opponentCars) {
        if (playerCarBox.intersectsBox(opponent.userData.boundingBox)) {
            return opponent; // Collision detected with this opponent
        }
    }

    // Check against coins (iterate backwards for safe removal during check)
     for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (playerCarBox.intersectsBox(coin.userData.boundingBox)) {
            score += coinScoreBonus; // Add bonus points
            scoreElement.innerText = `Score: ${score}`;
            console.log(`Coin collected! +${coinScoreBonus} points.`);
            // Remove collected coin immediately
            removeGameObject(coin, coins, i);
            // Optional: Play sound effect
        }
    }

    return null; // No collision with opponents
}

// Helper function to remove objects and clean up
function removeGameObject(object, array, index) {
    scene.remove(object);
    // Dispose geometry ONLY if it's not shared (like opponentGeometry)
    if (object.userData.type === 'coin' && object.geometry) {
        object.geometry.dispose(); // Dispose coin's unique geometry
    }
    // Always dispose material instance
    if (object.material) {
        // Don't dispose shared textures if material uses them
        object.material.dispose();
    }
    array.splice(index, 1); // Remove from the array
}


function gameOver() {
    isGameOver = true;
    gameOverElement.style.display = 'block';
    instructionsElement.style.display = 'none'; // Hide instructions
    restartButton.style.display = 'block';   // Show restart button
    velocityX = 0;
    velocityY = 0;
    console.log("Game Over! Final Score:", score);
    // Optional: Stop clock? clock.stop();
}

function restartGame() {
    console.log("Restarting game...");
    // Reset State
    isGameOver = false;
    score = 0;
    velocityX = 0;
    velocityY = 0;

    // Reset Difficulty
    playerMoveSpeed = initialPlayerMoveSpeed;
    opponentSpawnIntervalBase = initialOpponentSpawnIntervalBase;
    lastSpeedIncreaseScore = 0;
    lastTrafficIncreaseScore = 0;
    opponentSpawnTimer = 0; // Reset spawn timer

    // Reset Player Position
    playerCar.position.set(playerInitialPos.x, playerInitialPos.y, playerInitialPos.z);

    // Reset Camera (might adjust slightly based on player pos, but good to reset base)
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    // Clear Existing Game Objects
    for (let i = opponentCars.length - 1; i >= 0; i--) {
        removeGameObject(opponentCars[i], opponentCars, i);
    }
    for (let i = coins.length - 1; i >= 0; i--) {
        removeGameObject(coins[i], coins, i);
    }
    // Ensure arrays are empty
    opponentCars.length = 0;
    coins.length = 0;


    // Reset UI
    scoreElement.innerText = `Score: ${score}`;
    gameOverElement.style.display = 'none';
    restartButton.style.display = 'none';
    instructionsElement.style.display = 'block';

    // Restart Animation Loop
    // Optional: Restart clock if stopped: clock.start();
    if (!clock.running) clock.start(); // Ensure clock is running
    animate();
}

// Add event listener for the restart button
restartButton.addEventListener('click', restartGame);


// --- Game Loop ---
function animate() {
    // Stop requesting new frames if game is over
    // The check is now at the beginning, crucial for restart logic
    if (isGameOver) {
         // Render one final frame maybe, but don't request another
         renderer.render(scene, camera);
         return; // Exit the loop
    }

    requestAnimationFrame(animate); // Request next frame early

    const deltaTime = clock.getDelta();
    const clampedDelta = Math.min(deltaTime, 0.1);
    const deltaMultiplier = clampedDelta * 60;

    // --- Handle Input ---
    let targetVelocityY = 0;
    let targetVelocityX = 0;
    // Movement logic (forward, backward, left, right) - unchanged
    if (keysPressed['arrowup'] || keysPressed['w']) targetVelocityY = playerMoveSpeed;
    else if (keysPressed['arrowdown'] || keysPressed['s']) targetVelocityY = -playerMoveSpeed * 0.6;
    if (keysPressed['arrowleft'] || keysPressed['a']) targetVelocityX = -playerMoveSpeed;
    else if (keysPressed['arrowright'] || keysPressed['d']) targetVelocityX = playerMoveSpeed;

    // --- Apply Velocity & Friction ---
    const lerpFactor = 0.15;
    velocityY += (targetVelocityY - velocityY) * lerpFactor * deltaMultiplier;
    velocityX += (targetVelocityX - velocityX) * lerpFactor * deltaMultiplier;
    velocityY *= Math.pow(friction, deltaMultiplier);
    velocityX *= Math.pow(friction, deltaMultiplier);
    if (Math.abs(velocityY) < 0.01) velocityY = 0;
    if (Math.abs(velocityX) < 0.01) velocityX = 0;

    // --- Update Position ---
    playerCar.position.x += velocityX * deltaMultiplier;
    playerCar.position.y += velocityY * deltaMultiplier;

    // --- Boundary Check ---
    const halfTrackWidth = trackWidth / 2 - carWidth / 2;
    playerCar.position.x = Math.max(-halfTrackWidth, Math.min(halfTrackWidth, playerCar.position.x));

    // --- Camera Follow ---
    const cameraTargetY = playerCar.position.y + cameraHeight * 0.15;
    camera.position.y += (cameraTargetY - camera.position.y) * 0.08 * deltaMultiplier;
    const cameraTargetX = playerCar.position.x * 0.1;
    camera.position.x += (cameraTargetX - camera.position.x) * 0.1 * deltaMultiplier;
    camera.lookAt(camera.position.x, camera.position.y, 0);

    // --- Update Track & Road Lines Position ---
    track.position.y = camera.position.y;
    roadLineGroup.position.y = camera.position.y;

    // --- Opponent Spawning ---
    opponentSpawnTimer += clampedDelta;
    let currentOpponentSpawnInterval = opponentSpawnIntervalBase + Math.random() * 0.4;
    if (opponentSpawnTimer > currentOpponentSpawnInterval) {
        spawnOpponent();
        opponentSpawnTimer = 0;
    }

    // --- Update Game Objects ---
    updateOpponents(clampedDelta);
    updateCoins(clampedDelta); // Update coins movement

    // --- Check Collisions ---
    const collisionObject = checkCollisions(); // Checks both opponents and collects coins
    if (collisionObject && collisionObject.userData.type === 'opponent') {
        gameOver();
        // IMPORTANT: Exit animate loop *immediately* after calling gameOver
        // to prevent further updates in the same frame after game over state is set.
        return;
    }

    // --- Render ---
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    // Allow resize even if game over UI is showing
    const newAspectRatio = window.innerWidth / window.innerHeight;
    const newCameraWidth = cameraHeight * newAspectRatio;
    camera.left = newCameraWidth / -2; camera.right = newCameraWidth / 2;
    camera.top = cameraHeight / 2; camera.bottom = cameraHeight / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// --- Start the Game ---
scoreElement.innerText = `Score: ${score}`;
instructionsElement.style.display = 'block';
gameOverElement.style.display = 'none';
restartButton.style.display = 'none'; // Ensure button is hidden on initial load

if (playerCarTexture && opponentCarTexture) {
     console.log("Textures seem available, starting animation loop.");
     animate(); // Start the first game loop
} else {
    console.error("Textures not loaded correctly, cannot start game loop.");
    instructionsElement.innerText = "Error loading assets. Please check console.";
}
