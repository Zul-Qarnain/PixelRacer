# PixelRacer 🚗💨

A simple, top-down 2D-style car dodging game built with Three.js and HTML/JavaScript. Avoid oncoming traffic, collect coins, and see how high you can score as the game gets progressively faster!

<!-- Add a GIF or screenshot of the gameplay here! -->
![Gameplay video](game.mp4)
*(Replace placeholder.png with a link to your actual screenshot/GIF)*

## Features

*   **Top-Down 2D Perspective:** Uses Three.js with an Orthographic camera for a classic arcade feel.
*   **Player Control:** Smooth forward, backward, and left/right strafing movement using keyboard inputs.
*   **Oncoming Traffic:** Randomly spawning opponent cars moving towards the player.
*   **Collision Detection:** Basic bounding box collision between the player and opponents. Game over on collision.
*   **Scoring System:**
    *   Gain points for each opponent car successfully passed.
    *   Collect randomly appearing gold coins for bonus points (+5).
*   **Increasing Difficulty:**
    *   Player's potential speed increases slightly every 10 points.
    *   Traffic density increases (opponents spawn more frequently) every 50 points.
*   **Collectible Coins:** Gold coins appear randomly every 5 points scored (with a certain chance).
*   **Scrolling Environment:** Infinitely scrolling track with dashed road lines.
*   **Basic UI:** Displays current score and Game Over message.
*   **Restart Functionality:** A restart button appears on Game Over to play again.

## How to Play

*   **Objective:** Drive as far as possible by avoiding collisions with oncoming cars. Collect gold coins to boost your score.
*   **Controls:**
    *   Use the **Arrow Keys** or **WASD** keys to control your car:
        *   **Up / W**: Move Forward
        *   **Down / S**: Move Backward
        *   **Left / A**: Move Left (Strafe)
        *   **Right / D**: Move Right (Strafe)

## Running Locally

Because this project uses JavaScript Modules (`import`), you cannot run it by simply opening the `index.html` file directly in your browser. You need to serve the files using a local web server. Here are a few common ways:

1.  **Using VS Code Live Server:**
    *   Install the "Live Server" extension in Visual Studio Code.
    *   Right-click on the `index.html` file in the VS Code explorer.
    *   Select "Open with Live Server".

2.  **Using Python:**
    *   Open a terminal or command prompt in the project's root directory (where `index.html` is located).
    *   If you have Python 3 installed, run: `python -m http.server`
    *   If you have Python 2 installed, run: `python -m SimpleHTTPServer`
    *   Open your browser and navigate to `http://localhost:8000` (or the port indicated by the command).

3.  **Using Node.js:**
    *   Make sure you have Node.js and npm installed.
    *   Install the `http-server` package globally (if you haven't already): `npm install http-server -g`
    *   Open a terminal or command prompt in the project's root directory.
    *   Run the command: `http-server`
    *   Open your browser and navigate to the local address provided (usually `http://localhost:8080`).

## Technology Stack

*   HTML5
*   CSS3 (for UI styling)
*   JavaScript (ES6 Modules)
*   Three.js (r160 or similar)

## Future Improvements

*   Sound Effects (engine, crash, coin collect)
*   Improved Graphics/Assets (Car models, better textures, environment details)
*   More Complex Track Layouts or Scenery
*   Power-ups (e.g., temporary shield, score multiplier)
*   Mobile Controls / Touch Support
*   Leaderboard / High Score Saving

## License

This project is licensed under the MIT License. (You can add a `LICENSE` file with the MIT license text if you wish).
