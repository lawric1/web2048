import { Game } from "../lib/game.js";
import { updateInput, isActionPressed, isActionReleased } from "../lib/input.js";
import { AudioStream } from "../lib/audio.js";

Game.createWindow(320, 180, 2);
Game.addLayer("main", 1, false);
Game.addLayer("particle", 2);
Game.addLayer("text", 3);

let layers = Game.layers;

let urls = {
    start: "./src/assets/sprites/startscreen.png",
    gameover: "./src/assets/sprites/gameover.png",
    p: "./src/assets/sprites/particle1.png",
};

// Import image files to be used as textures in game;
await Game.preloadAll(urls)

let textures = Game.textures;

// let sfx = new AudioStream("./src/assets/sound/ballhit.wav");


function init() {
}
function update() {
}

// Draw
function drawStart() {
};
function drawGameOver() {
};
function draw() {
}


// Gameloop
let prevTime = performance.now();
function gameLoop() {
    let currentTime = performance.now();
    let deltaTime = (currentTime - prevTime) / 1000;
    prevTime = currentTime;

    updateInput();
    Game.setGameState("run");

    if (Game.state === "start") { drawStart(); }
    else if (Game.state === "gameover") { drawGameOver(); }
    else if (Game.state === "run") { 
        update(deltaTime);
        draw();
    }

    // Handle States
    if (isActionReleased("start") && Game.state === "start") {
        Game.setGameState("run");
        init();
    }
    else if (isActionReleased("restart") && Game.state === "gameover") { 
        Game.setGameState("start"); 
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
