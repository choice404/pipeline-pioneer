// ============================================
// Pipeline Pioneer — charity: water game
// ============================================

// ----- Constants -----
const COLS = 7;
const ROWS = 12;

const SHOP_PRICES = {
  drill: 30,
  pipes: 20,
};

// ----- Level Data -----
// Tile legend: D = dirt, R = rock, B = bedrock, C = coin, A = aquifer
const LEVEL_MAPS = [
  // Level 1 — introductory
  [
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "C", "D", "R", "D", "C", "D"],
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "R", "D", "C", "D", "R", "D"],
    ["D", "D", "B", "D", "B", "D", "D"],
    ["C", "D", "D", "D", "D", "D", "C"],
    ["D", "D", "R", "D", "R", "D", "D"],
    ["D", "C", "D", "D", "D", "C", "D"],
    ["D", "D", "D", "R", "D", "D", "D"],
    ["D", "R", "D", "D", "D", "R", "D"],
    ["D", "D", "C", "D", "C", "D", "D"],
    ["A", "A", "A", "A", "A", "A", "A"],
  ],
  // Level 2 — harder
  [
    ["D", "D", "D", "D", "D", "D", "D"],
    ["B", "D", "R", "C", "R", "D", "B"],
    ["D", "D", "B", "D", "B", "D", "D"],
    ["D", "R", "D", "D", "D", "R", "D"],
    ["C", "B", "D", "R", "D", "B", "C"],
    ["D", "D", "D", "B", "D", "D", "D"],
    ["D", "R", "C", "D", "C", "R", "D"],
    ["B", "D", "D", "R", "D", "D", "B"],
    ["D", "D", "R", "D", "R", "D", "D"],
    ["D", "B", "C", "D", "C", "B", "D"],
    ["D", "D", "D", "R", "D", "D", "D"],
    ["A", "A", "A", "A", "A", "A", "A"],
  ],
];

const LEVEL_PIPES = [24, 20];

const TILE_EXPAND = {
  D: "dirt",
  R: "rock",
  B: "bedrock",
  C: "coin",
  A: "aquifer",
};

// ----- DOM Refs -----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screenStart = $("#screen-start");
const screenGame = $("#screen-game");
const screenShop = $("#screen-shop");
const screenWin = $("#screen-win");
const screenLose = $("#screen-lose");

const boardEl = $("#board");
const hudPipes = $("#hud-pipes");
const hudCoins = $("#hud-coins");
const hudLevel = $("#hud-level");
const drillCount = $("#drill-count");

// ----- State -----
let state = createInitialState(0);

function createInitialState(levelIndex) {
  const map = deepCopyMap(LEVEL_MAPS[levelIndex]);
  return {
    levelIndex,
    map,
    originalMap: deepCopyMap(LEVEL_MAPS[levelIndex]),
    playerPos: { x: 3, y: 0 },
    pipesLeft: LEVEL_PIPES[levelIndex] ?? 20,
    coins: 0,
    inventory: { drill: 0 },
    visitedTiles: new Set(["3,0"]),
    gameActive: false,
  };
}

function deepCopyMap(map) {
  return map.map((row) => [...row]);
}

// ----- Screen Management -----
function showScreen(screen) {
  [screenStart, screenGame, screenShop, screenWin, screenLose].forEach(
    (s) => {
      s.classList.remove("active");
    }
  );
  screen.classList.add("active");
}

// ----- Render -----
function isAdjacent(x, y) {
  const dx = Math.abs(x - state.playerPos.x);
  const dy = Math.abs(y - state.playerPos.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function directionFromPlayer(x, y) {
  const dx = x - state.playerPos.x;
  const dy = y - state.playerPos.y;
  if (dx === 1) return "right";
  if (dx === -1) return "left";
  if (dy === 1) return "down";
  if (dy === -1) return "up";
  return null;
}

function render() {
  // Board
  boardEl.innerHTML = "";
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      const key = `${x},${y}`;
      const raw = state.map[y][x];
      const tileType = TILE_EXPAND[raw] ?? raw;

      // If visited and not the current player pos, show pipe
      const isPipe =
        state.visitedTiles.has(key) &&
        !(state.playerPos.x === x && state.playerPos.y === y) &&
        tileType !== "aquifer";

      cell.className = `tile tile-${isPipe ? "pipe" : tileType}`;

      // Player marker
      if (state.playerPos.x === x && state.playerPos.y === y) {
        cell.classList.add("tile-player");
      }

      // Mark adjacent tiles as clickable for tap-to-move
      if (state.gameActive && isAdjacent(x, y)) {
        cell.classList.add("tile-adjacent");
        cell.dataset.tx = x;
        cell.dataset.ty = y;
      }

      boardEl.appendChild(cell);
    }
  }

  // HUD
  hudPipes.textContent = `Pipes Left: ${state.pipesLeft}`;
  hudCoins.textContent = `Coins: ${state.coins}`;
  hudLevel.textContent = `Level ${state.levelIndex + 1}`;
  drillCount.textContent = state.inventory.drill;
}

// ----- Movement Logic -----
const DIR = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

function tryMove(direction) {
  if (!state.gameActive) return;

  const { dx, dy } = DIR[direction];
  const nx = state.playerPos.x + dx;
  const ny = state.playerPos.y + dy;

  // Out of bounds
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
    shakePlayer();
    return;
  }

  const raw = state.map[ny][nx];
  const tileType = TILE_EXPAND[raw] ?? raw;

  // Bedrock — always blocked
  if (tileType === "bedrock") {
    shakePlayer();
    return;
  }

  // Rock — needs drill
  if (tileType === "rock") {
    if (state.inventory.drill > 0) {
      state.inventory.drill -= 1;
      state.map[ny][nx] = "D"; // convert to dirt
    } else {
      shakePlayer();
      return;
    }
  }

  // Coin — collect
  if (tileType === "coin") {
    state.coins += 10;
    state.map[ny][nx] = "D";
  }

  // Move player
  const key = `${nx},${ny}`;
  const isNewTile = !state.visitedTiles.has(key);

  if (isNewTile) {
    state.pipesLeft -= 1;
    state.visitedTiles.add(key);
  }

  state.playerPos = { x: nx, y: ny };

  render();

  // Win check
  if (tileType === "aquifer") {
    handleWin();
    return;
  }

  // Lose check
  if (state.pipesLeft <= 0 && !isOnAquifer()) {
    handleLose();
  }
}

function isOnAquifer() {
  const raw = state.map[state.playerPos.y][state.playerPos.x];
  const tileType = TILE_EXPAND[raw] ?? raw;
  return tileType === "aquifer";
}

function shakePlayer() {
  const idx = state.playerPos.y * COLS + state.playerPos.x;
  const cell = boardEl.children[idx];
  if (!cell) return;
  cell.classList.remove("shake");
  // Force reflow to restart animation
  void cell.offsetWidth;
  cell.classList.add("shake");
}

// ----- Win / Lose -----
function handleWin() {
  state.gameActive = false;
  spawnConfetti();
  showScreen(screenWin);
}

function handleLose() {
  state.gameActive = false;
  showScreen(screenLose);
}

// ----- Confetti -----
function spawnConfetti() {
  const container = $("#confetti-container");
  container.innerHTML = "";
  const colors = [
    "#FFC907",
    "#3FA9F5",
    "#77A8BB",
    "#003366",
    "#fff",
  ];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background =
      colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(piece);
  }
}

// ----- Shop Logic -----
function openShop() {
  state.gameActive = false;
  showScreen(screenShop);
}

function closeShop() {
  showScreen(screenGame);
  state.gameActive = true;
}

function buyItem(itemName) {
  const cost = SHOP_PRICES[itemName];
  if (cost === undefined) return;

  const cardId =
    itemName === "pipes" ? "shop-pipes" : `shop-${itemName}`;
  const card = $(`#${cardId}`);

  if (state.coins >= cost) {
    state.coins -= cost;

    if (itemName === "drill") {
      state.inventory.drill += 1;
    } else if (itemName === "pipes") {
      state.pipesLeft += 5;
    }

    // Pop animation
    if (card) {
      card.classList.remove("shop-pop");
      void card.offsetWidth;
      card.classList.add("shop-pop");
    }

    // Update HUD display while shop is open
    hudPipes.textContent = `Pipes Left: ${state.pipesLeft}`;
    hudCoins.textContent = `Coins: ${state.coins}`;
    drillCount.textContent = state.inventory.drill;
  } else {
    // Flash red
    if (card) {
      card.classList.remove("shop-flash");
      void card.offsetWidth;
      card.classList.add("shop-flash");
    }
  }
}

// ----- Reset / Level Progression -----
function resetLevel() {
  const lvl = state.levelIndex;
  const savedCoins = 0;
  const savedInventory = { drill: 0 };

  state = {
    ...createInitialState(lvl),
    coins: savedCoins,
    inventory: savedInventory,
  };
  state.gameActive = true;

  showScreen(screenGame);
  render();
}

function nextLevel() {
  const nextIdx = state.levelIndex + 1;

  if (nextIdx >= LEVEL_MAPS.length) {
    // Wrap around for prototype
    const savedCoins = state.coins;
    const savedInventory = { ...state.inventory };
    state = {
      ...createInitialState(0),
      coins: savedCoins,
      inventory: savedInventory,
    };
  } else {
    const savedCoins = state.coins;
    const savedInventory = { ...state.inventory };
    state = {
      ...createInitialState(nextIdx),
      coins: savedCoins,
      inventory: savedInventory,
    };
  }

  state.gameActive = true;
  showScreen(screenGame);
  render();
}

function replaySameLevel() {
  const savedCoins = 0;
  const savedInventory = { drill: 0 };
  const lvl = state.levelIndex;

  state = {
    ...createInitialState(lvl),
    coins: savedCoins,
    inventory: savedInventory,
  };
  state.gameActive = true;

  showScreen(screenGame);
  render();
}

// ----- Input Handling -----

// Keyboard
document.addEventListener("keydown", (e) => {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    s: "down",
    d: "right",
    W: "up",
    A: "left",
    S: "down",
    D: "right",
  };

  const dir = keyMap[e.key];
  if (dir) {
    e.preventDefault();
    tryMove(dir);
  }
});

// Click-to-move: click/tap adjacent tiles on the board
function handleBoardClick(e) {
  // Find the tile — e.target could be the tile itself or board
  const cell =
    e.target.closest(".tile-adjacent") ||
    (e.target.classList.contains("tile-adjacent") ? e.target : null);
  if (!cell || !cell.dataset.tx) return;
  const tx = Number(cell.dataset.tx);
  const ty = Number(cell.dataset.ty);
  const dir = directionFromPlayer(tx, ty);
  if (dir) tryMove(dir);
}

boardEl.addEventListener("click", handleBoardClick);

// ----- Button Wiring -----

// Start
$("#btn-start").addEventListener("click", () => {
  state = createInitialState(0);
  state.gameActive = true;
  showScreen(screenGame);
  render();
});

// Shop
$("#btn-shop").addEventListener("click", openShop);
$("#btn-shop-close").addEventListener("click", closeShop);

$$(".btn-buy").forEach((btn) => {
  btn.addEventListener("click", () => {
    buyItem(btn.dataset.item);
  });
});

// Reset
$("#btn-reset").addEventListener("click", resetLevel);

// Win screen
$("#btn-next-level").addEventListener("click", nextLevel);
$("#btn-replay").addEventListener("click", replaySameLevel);

// Lose screen
$("#btn-restart").addEventListener("click", resetLevel);
$("#btn-lose-shop").addEventListener("click", () => {
  showScreen(screenShop);
});
