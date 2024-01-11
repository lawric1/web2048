import { Game } from "../lib/game.js";
import { updateInput, isActionJustPressed } from "../lib/input.js";
import { AudioStream } from "../lib/audio.js";
import { lerp, randomInt } from "../lib/math.js";
import { RectangleCollisionShape2D, checkCollision } from "../lib/physics.js";

Game.createWindow(320, 180, 3);
Game.addLayer("main", 1, false);
Game.addLayer("particle", 2);
Game.addLayer("text", 3);

let layers = Game.layers;

let urls = {
    start1: "./src/assets/sprites/start1.png",
    start2: "./src/assets/sprites/start2.png",
    over1: "./src/assets/sprites/over1.png",
    over2: "./src/assets/sprites/over2.png",
    win: "./src/assets/sprites/win.png",
    bg1: "./src/assets/sprites/bg1.png",
    tiles: "./src/assets/sprites/tiles.png",
    tiles2: "./src/assets/sprites/tiles2.png",
};

// Import image files to be used as textures in game;
await Game.preloadAll(urls)

let textures = Game.textures;

let sfxMove = new AudioStream("./src/assets/sounds/move1.wav");
let sfxMerge = new AudioStream("./src/assets/sounds/merge1.wav");
let sfxUi = new AudioStream("./src/assets/sounds/blip1.wav");


class Tile {
    constructor(id, startRow, startCol, animName) {
        this.id = id;
        this.row = startRow;
        this.col = startCol;

        this.x = boardXPositions[startCol];
        this.y = boardYPositions[startRow];
        this.startX = this.x;
        this.startY = this.y;
        this.targetX = boardXPositions[startCol];
        this.targetY = boardYPositions[startRow];
        this.scale = 1;

        this.texture = textures.tiles;
        this.animName = animName;
        this.animPlaying = true;
        this.animProgress = 0;
        this.animSpeed = 8;
    }

    update(deltaTime) {
        if (!this.animPlaying) { return; }

        this.animProgress += deltaTime * this.animSpeed;

        if (this.animName === "spawn") {
            this.y = lerp(this.startY - 20, this.targetY, this.animProgress, "easeOutCubic");
        
            if (this.animProgress >= 1) {
                this.startY = this.y;

                this.animPlaying = false;
                this.animProgress = 0;
                this.animName = "move";
            }
        }
        else if (this.animName === "move") {
            this.x = lerp(this.startX, this.targetX, this.animProgress, "easeOutCubic");
            this.y = lerp(this.startY, this.targetY, this.animProgress, "easeOutCubic");
        
            if (this.animProgress >= 1) {
                sfxMove.play(1);

                this.startX = this.x;
                this.startY = this.y;

                this.animPlaying = false;
                this.animProgress = 0;
            }
        }
        else if (this.animName === "merge") {
            
            this.texture = textures.tiles2;
            
            // Calculate the center of the tile;
            const tex = getTextureCoord(this.id);
            const centerX = this.x + (tex.w * this.scale) / 2;
            const centerY = this.y + (tex.h * this.scale) / 2;
            
            // Update scale and position based on the center;
            this.scale = lerp(0.1, 1, this.animProgress, "easeOutCubic");
            this.x = centerX - (tex.w * this.scale) / 2;
            this.y = centerY - (tex.h * this.scale) / 2;
            
            if (this.animProgress >= 1) {
                sfxMerge.play(1);
                this.texture = textures.tiles;

                this.animPlaying = false;
                this.animProgress = 0;
                this.animName = "move";
            }
        }

    }

    move(dir) {
        let nextRow = this.row;
        let nextCol = this.col;
        
        while (true) {
            switch (dir) {
                case "up": nextRow -= 1; break;
                case "down": nextRow += 1; break;
                case "left": nextCol -= 1; break;
                case "right": nextCol += 1; break;
            }

            // Out of board;
            if (nextRow === -1 || nextRow === 4 || nextCol === -1 || nextCol === 4) {
                break;
            }

            let nextTile = board[nextRow][nextCol];

            if (nextTile === 0) {
                this.targetX = boardXPositions[nextCol];
                this.targetY = boardYPositions[nextRow];
                board[this.row][this.col] = 0;
                board[nextRow][nextCol] = this.id;
                this.row = nextRow;
                this.col = nextCol;
                this.animPlaying = true;
                tileMoved = true;

            } else if (nextTile === this.id) {
                this.targetX = boardXPositions[nextCol];
                this.targetY = boardYPositions[nextRow];
                board[this.row][this.col] = 0;
                board[nextRow][nextCol] = this.id + 1;
                this.row = nextRow;
                this.col = nextCol;
                this.animPlaying = true;
                tileMoved = true;

                newTiles.push(new Tile(this.id + 1, nextRow, nextCol, "merge"));
                break;
            } else {
                break;
            }
        }
    }

    draw(ctx) {
        let tex = getTextureCoord(this.id);
        ctx.drawImage(this.texture, tex.x, tex.y, tex.w, tex.h, this.x, this.y, tex.w * this.scale, tex.h * this.scale);
    }
}

let board = [];
let tiles = [];
let newTiles = [];
const boardSize = 4;
const boardXPositions = [122, 142, 162, 182];
const boardYPositions = [52, 72, 92, 112];

let tileMoved = false;
let gameWon = false;


function init() {
    board = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    tiles = [];
    newTiles = [];

    generateNewTile();
    generateNewTile();
}
function move(dir) {
    // The board is looped a different way according to each direction pressed;
    if (dir === "up") {
        for (let col = 0; col < boardSize; col++) {
            for (let row = 1; row < boardSize; row++) {
                for (const tile of tiles) {
                    if (tile.row === row && tile.col === col) {
                        tile.move("up");
                    };
                }
            }
        }
    }
    if (dir === "down") {
        for (let col = 0; col < boardSize; col++) {
            for (let row = boardSize - 1; row >= 0; row--) {
                for (const tile of tiles) {
                    if (tile.row === row && tile.col === col) {
                        tile.move("down");
                    };
                }
            }
        }
    }
    if (dir === "left") {
        for (let row = 0; row < boardSize; row++) {
            for (let col = 1; col < boardSize; col++) {
                for (const tile of tiles) {
                    if (tile.row === row && tile.col === col) {
                        tile.move("left");
                    };
                }
            }
        }
    }
    if (dir === "right") {
        for (let row = 0; row < boardSize; row++) {
            for (let col = boardSize - 1; col >= 0; col--) {
                for (const tile of tiles) {
                    if (tile.row === row && tile.col === col) {
                        tile.move("right");
                    };
                }
            }
        }
    }
}
function getEmptyTiles() {
    let emptyTiles = [];

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === 0) {
                emptyTiles.push({row: row, col: col});
            }
        }
    }

    return emptyTiles;
}
function generateNewTile() {
    let emptyTiles = getEmptyTiles();

    // Get random empty tile and id;
    let tileCoord = emptyTiles[randomInt(0, emptyTiles.length - 1)];
    let id = randomInt(1, 2);

    // Push to newTiles to be added to the main list after animations are completed;
    // Update board with the new tiles;
    newTiles.push(new Tile(id, tileCoord.row, tileCoord.col, "spawn"));
    board[tileCoord.row][tileCoord.col] = id;
}
function isGameOver() {
    // Check if the board is full
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            if (board[row][col] === 0) {
                return false; // There is an empty cell, the game is not over
            }
        }
    }

    // Check for adjacent tiles with the same value
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const currentTile = board[row][col];

            // Check right neighbor
            if (col < boardSize - 1 && currentTile === board[row][col + 1]) {
                return false; // There is a merge possibility to the right
            }

            // Check bottom neighbor
            if (row < boardSize - 1 && currentTile === board[row + 1][col]) {
                return false; // There is a merge possibility below
            }
        }
    }

    // No valid moves left, the game is over
    return true;
}
function isGameWon() {
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            // Found "2048" tile
            if (board[row][col] === 11) {
                return true;
            }
        }
    }

    return false;
}
function update(deltaTime) {
    let animationsPlaying = false;

    // Update all tiles animation before allowing anything else;
    for (const tile of tiles) {
        if (tile.animPlaying) {
            tile.update(deltaTime);
            animationsPlaying = true;
        }
    }
    
    if (animationsPlaying) {
        return;
    }

    // Movement happened, create new random tile and check game state;
    if (tileMoved) {
        generateNewTile();
        tileMoved = false;

        if (isGameOver()) {
            Game.setGameState("gameover");
        } else if (isGameWon()) {
            gameWon = true;
            Game.setGameState("gameover");
        }
    }

    // Push all new tiles to the board,
    // remove the old ones that are in the same position;
    if (newTiles.length > 0){
        for (const newTile of newTiles) {
            tiles = tiles.filter(tile => !(tile.row === newTile.row && tile.col === newTile.col));
            tiles.push(newTile);
        }
    
        // Clear this since new tiles where already added;
        newTiles = [];
    }

    if (isActionJustPressed("up")) { move("up"); }
    if (isActionJustPressed("down")) { move("down"); }
    if (isActionJustPressed("left")) { move("left"); }
    if (isActionJustPressed("right")) { move("right"); }
}

function getTextureCoord(id) {
    switch (id) {
        case 0: return { x: 0, y: 0, w: 16, h: 16 };
        case 1: return { x: 16, y: 0, w: 16, h: 16 };
        case 2: return { x: 32, y: 0, w: 16, h: 16 };
        case 3: return { x: 48, y: 0, w: 16, h: 16 };
        case 4: return { x: 64, y: 0, w: 16, h: 16 };
        case 5: return { x: 80, y: 0, w: 16, h: 16 };
        case 6: return { x: 96, y: 0, w: 16, h: 16 };
        case 7: return { x: 112, y: 0, w: 16, h: 16 };
        case 8: return { x: 128, y: 0, w: 16, h: 16 };
        case 9: return { x: 144, y: 0, w: 16, h: 16 };
        case 10: return { x: 160, y: 0, w: 16, h: 16 };
        case 11: return { x: 176, y: 0, w: 16, h: 16 };
        default: console.log("Tile coord not available"); break;
    }
}
function draw() {
    layers.main.clearRect(0, 0, Game.width, Game.height);
    layers.main.drawImage(textures.bg1, 0, 0);

    for (const tile of tiles) {
        tile.draw(layers.main);
    }
}

// Draw Menu
function drawStart() {
    layers.main.clearRect(0, 0, Game.width, Game.height);
    layers.main.drawImage(textures.start1, 0, 0);

    let startButtomCollider = new RectangleCollisionShape2D(136,82,50,17);

    if (checkCollision(Game.mousePos, startButtomCollider)) {
        layers.main.drawImage(textures.start2, 0, 0);

        if (isActionJustPressed("leftClick")) {
            sfxUi.play(1);
            Game.setGameState("run");
            init();
        }
    }
};
function drawGameOver() {
    layers.main.clearRect(0, 0, Game.width, Game.height);
    
    let gameoverButtomCollider = new RectangleCollisionShape2D(140,107,40,15);
    let winCollider = new RectangleCollisionShape2D(112,48,84,84);
    
    if (gameWon) {
        layers.main.drawImage(textures.win, 0, 0);

        if (checkCollision(Game.mousePos, winCollider)) {
            if (isActionJustPressed("leftClick")) {
                sfxUi.play(1);
                Game.setGameState("start");
            }
        }
    } else {
        layers.main.drawImage(textures.over1, 0, 0);

        if (checkCollision(Game.mousePos, gameoverButtomCollider)) {
            layers.main.drawImage(textures.over2, 0, 0);
    
            if (isActionJustPressed("leftClick")) {
                sfxUi.play(1);
                Game.setGameState("start");
            }
        }
    }


};


// Gameloop
let prevTime = performance.now();
function gameLoop() {
    let currentTime = performance.now();
    let deltaTime = (currentTime - prevTime) / 1000;
    prevTime = currentTime;

    updateInput();

    if (Game.state === "start") { drawStart(); }
    else if (Game.state === "gameover") { drawGameOver(); }
    else if (Game.state === "run") { 
        update(deltaTime);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
