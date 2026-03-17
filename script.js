// ============================================
// Pipeline Pioneer — charity: water game
// ============================================

// ----- Constants -----
const COLS = 7;
const STORAGE_KEY = "pipeline-pioneer-save";

const SHOP_PRICES = {
  drill: 30,
  pipes: 20,
};

// ----- Level Data -----
// Maps can be any number of rows. Row count is derived from array length.
const LEVEL_MAPS = [
  // Level 1 — Tutorial (12 rows, gentle intro)
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
  // Level 2 — Narrow Passage (12 rows)
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
  // Level 3 — The Maze (16 rows, longer dig)
  [
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "R", "B", "D", "B", "R", "D"],
    ["D", "D", "D", "C", "D", "D", "D"],
    ["B", "D", "R", "B", "R", "D", "B"],
    ["D", "C", "D", "D", "D", "C", "D"],
    ["D", "B", "D", "R", "D", "B", "D"],
    ["D", "D", "D", "D", "D", "D", "D"],
    ["R", "D", "B", "C", "B", "D", "R"],
    ["D", "D", "D", "B", "D", "D", "D"],
    ["D", "R", "C", "D", "C", "R", "D"],
    ["B", "D", "D", "R", "D", "D", "B"],
    ["D", "D", "R", "D", "R", "D", "D"],
    ["D", "C", "B", "D", "B", "C", "D"],
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "R", "D", "C", "D", "R", "D"],
    ["A", "A", "A", "A", "A", "A", "A"],
  ],
  // Level 4 — Bedrock Canyon (18 rows, off-center start)
  [
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "B", "D", "R", "D", "C", "D"],
    ["D", "D", "B", "D", "D", "D", "D"],
    ["C", "D", "D", "B", "D", "R", "D"],
    ["D", "R", "D", "D", "B", "D", "D"],
    ["D", "B", "C", "D", "D", "D", "B"],
    ["D", "D", "D", "R", "D", "C", "D"],
    ["B", "D", "B", "D", "D", "B", "D"],
    ["D", "C", "D", "D", "R", "D", "D"],
    ["D", "D", "R", "B", "D", "D", "C"],
    ["D", "B", "D", "D", "D", "B", "D"],
    ["C", "D", "D", "R", "D", "D", "D"],
    ["D", "D", "B", "D", "B", "D", "R"],
    ["D", "R", "D", "C", "D", "D", "D"],
    ["B", "D", "D", "D", "R", "D", "B"],
    ["D", "C", "D", "B", "D", "C", "D"],
    ["D", "D", "D", "D", "D", "D", "D"],
    ["A", "A", "A", "A", "A", "A", "A"],
  ],
  // Level 5 — Deep Dive (20 rows, tight on pipes)
  [
    ["D", "D", "D", "D", "D", "D", "D"],
    ["B", "D", "R", "D", "R", "D", "B"],
    ["D", "C", "B", "D", "B", "C", "D"],
    ["D", "D", "D", "R", "D", "D", "D"],
    ["R", "B", "D", "D", "D", "B", "R"],
    ["D", "D", "C", "B", "C", "D", "D"],
    ["D", "R", "D", "D", "D", "R", "D"],
    ["B", "D", "D", "R", "D", "D", "B"],
    ["D", "D", "B", "D", "B", "D", "D"],
    ["C", "R", "D", "D", "D", "R", "C"],
    ["D", "B", "D", "R", "D", "B", "D"],
    ["D", "D", "C", "B", "C", "D", "D"],
    ["R", "D", "B", "D", "B", "D", "R"],
    ["D", "D", "D", "C", "D", "D", "D"],
    ["B", "R", "D", "D", "D", "R", "B"],
    ["D", "D", "D", "R", "D", "D", "D"],
    ["D", "C", "B", "D", "B", "C", "D"],
    ["D", "D", "D", "D", "D", "D", "D"],
    ["D", "R", "D", "C", "D", "R", "D"],
    ["A", "A", "A", "A", "A", "A", "A"],
  ],
];

const LEVEL_PIPES = [24, 20, 28, 30, 32];

// Per-level start column (rig position). Player always starts row 0.
const LEVEL_START_X = [3, 3, 3, 1, 3];

const TILE_EXPAND = {
  D: "dirt",
  R: "rock",
  B: "bedrock",
  C: "coin",
  A: "aquifer",
};

// ----- Pipe Direction Logic (adjacency-based) -----
function isTilePipe(x, y) {
  // The rig sits above the board at (startX, -1).
  // Treat it as a pipe neighbor so the start tile connects upward.
  if (x === state.startX && y === -1) return true;

  const rows = state.map.length;
  if (x < 0 || x >= COLS || y < 0 || y >= rows) return false;
  return state.visitedTiles.has(`${x},${y}`);
}

function getPipeConnections(x, y) {
  const dirs = [];
  if (isTilePipe(x, y - 1)) dirs.push("up");
  if (isTilePipe(x, y + 1)) dirs.push("down");
  if (isTilePipe(x - 1, y)) dirs.push("left");
  if (isTilePipe(x + 1, y)) dirs.push("right");
  return dirs;
}

function getPipeImage(x, y) {
  const dirs = getPipeConnections(x, y);
  const key = dirs.sort().join(",");

  const PIPE_MAP = {
    "down,up": "05verticalPipe_tile.png",
    "left,right": "06horizontalPipe_tile.png",
    "down,right": "07bottomRightCornerPipe_tile.png",
    "down,left": "08bottomLeftCornerPipe_tile.png",
    "right,up": "09topRightCornerPipe_tile.png",
    "left,up": "10topLeftCornerPipe_tile.png",
    "down,left,right": "11horizontalDownPipe_tile.png",
    "left,right,up": "12horizontalUpPipe_tile.png",
    "down,right,up": "13verticalRightPipe_tile.png",
    "down,left,up": "14verticalLeftPipe_tile.png",
    "down,left,right,up": "15fourWayPipe_tile.png",
  };

  if (PIPE_MAP[key]) return PIPE_MAP[key];

  if (dirs.includes("left") || dirs.includes("right")) {
    return "06horizontalPipe_tile.png";
  }
  return "05verticalPipe_tile.png";
}

// ----- localStorage Persistence -----
function getDefaultSave() {
  return {
    playerName: "Pioneer",
    unlockedLevel: 0,
    completedLevels: [],
    bestRuns: [],
    totalCoins: 0,
    inventory: { drill: 0 },
    showHints: true,
  };
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSave();
    const parsed = JSON.parse(raw);
    return { ...getDefaultSave(), ...parsed };
  } catch {
    return getDefaultSave();
  }
}

function writeSave(save) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function resetSave() {
  localStorage.removeItem(STORAGE_KEY);
  return getDefaultSave();
}

let saveData = loadSave();

// ----- DOM Refs -----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screens = {
  start: $("#screen-start"),
  levels: $("#screen-levels"),
  game: $("#screen-game"),
  shop: $("#screen-shop"),
  win: $("#screen-win"),
  lose: $("#screen-lose"),
  settings: $("#screen-settings"),
  leaderboard: $("#screen-leaderboard"),
};

const boardEl = $("#board");
const hudPipes = $("#hud-pipes");
const hudCoins = $("#hud-coins");
const hudLevel = $("#hud-level");
const drillCount = $("#drill-count");

// ----- Game State -----
let state = createInitialState(0);

function createInitialState(levelIndex) {
  const idx = Math.min(levelIndex, LEVEL_MAPS.length - 1);
  const startX = LEVEL_START_X[idx] ?? 3;
  const map = deepCopyMap(LEVEL_MAPS[idx]);
  return {
    levelIndex: idx,
    startX,
    map,
    originalMap: deepCopyMap(LEVEL_MAPS[idx]),
    playerPos: { x: startX, y: 0 },
    pipesLeft: LEVEL_PIPES[idx] ?? 20,
    coins: saveData.totalCoins,
    inventory: { ...saveData.inventory },
    visitedTiles: new Set([`${startX},0`]),
    gameActive: false,
    pipesUsed: 0,
    coinsCollected: 0,
  };
}

function deepCopyMap(map) {
  return map.map((row) => [...row]);
}

// ----- Screen Management -----
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
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

const TILE_IMAGES = {
  dirt: "01dirt_tile.png",
  rock: "02stone_tile.png",
  bedrock: "03bedrock_tile.png",
  coin: "04coin_tile.png",
  aquifer: "17aquifer_tile.png",
};

function renderRigHeader() {
  const rigHeader = $("#rig-header");
  rigHeader.innerHTML = "";

  // Create column slots matching the grid
  for (let x = 0; x < COLS; x++) {
    const slot = document.createElement("div");
    slot.className = "rig-slot";

    if (x === state.startX) {
      const img = document.createElement("img");
      img.src = "img/16drillRig_tile.png";
      img.alt = "Drill Rig";
      img.className = "rig-img";
      slot.appendChild(img);
    }

    rigHeader.appendChild(slot);
  }
}

function render() {
  const rows = state.map.length;
  boardEl.innerHTML = "";
  renderRigHeader();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = document.createElement("div");
      const key = `${x},${y}`;
      const raw = state.map[y][x];
      const tileType = TILE_EXPAND[raw] ?? raw;
      const isPlayer =
        state.playerPos.x === x && state.playerPos.y === y;
      const isVisited = state.visitedTiles.has(key);
      const isPipe =
        isVisited && !isPlayer && tileType !== "aquifer";

      cell.className = "tile";

      let tileImg = null;

      if (isPipe || (isPlayer && isVisited)) {
        tileImg = getPipeImage(x, y);
      } else {
        tileImg = TILE_IMAGES[tileType] ?? TILE_IMAGES.dirt;
      }

      cell.style.backgroundImage = `url(img/${tileImg})`;

      if (isPlayer) {
        cell.classList.add("tile-current");
      }

      if (state.gameActive && isAdjacent(x, y)) {
        cell.classList.add("tile-clickable");
        cell.dataset.tx = x;
        cell.dataset.ty = y;

        if (saveData.showHints) {
          cell.classList.add("tile-adjacent");
        }
      }

      boardEl.appendChild(cell);
    }
  }

  hudPipes.textContent = `Pipes Left: ${state.pipesLeft}`;
  hudCoins.textContent = `Coins: ${state.coins}`;
  hudLevel.textContent = `Level ${state.levelIndex + 1}`;
  drillCount.textContent = state.inventory.drill;

  scrollToPlayer();
}

// ----- Viewport Scrolling -----
function scrollToPlayer() {
  const viewport = $("#board-viewport");
  const scroller = $("#board-scroller");
  const rigHeader = $("#rig-header");

  if (!viewport || !scroller) return;

  const viewportH = viewport.clientHeight;
  const rigH = rigHeader ? rigHeader.offsetHeight : 0;

  // Calculate tile height from the rendered board
  const firstTile = boardEl.querySelector(".tile");
  if (!firstTile) return;
  const tileH = firstTile.offsetHeight + 1; // +gap

  // Player's pixel position from top of scroller
  const playerTop = rigH + state.playerPos.y * tileH;

  // We want the player roughly centered, but never scroll above 0
  const targetScroll = Math.max(
    0,
    playerTop - viewportH * 0.4
  );

  // Don't scroll past the bottom
  const scrollerH = scroller.scrollHeight;
  const maxScroll = Math.max(0, scrollerH - viewportH);
  const clampedScroll = Math.min(targetScroll, maxScroll);

  scroller.style.transform = `translateY(-${clampedScroll}px)`;
}

// ----- Level Select -----
function renderLevelSelect() {
  const grid = $("#levels-grid");
  grid.innerHTML = "";

  for (let i = 0; i < LEVEL_MAPS.length; i++) {
    const btn = document.createElement("button");
    btn.className = "level-btn";
    btn.textContent = i + 1;

    const isCompleted = saveData.completedLevels[i] === true;
    const isUnlocked = i <= saveData.unlockedLevel;
    const isCurrent = i === saveData.unlockedLevel && !isCompleted;

    if (isCompleted) {
      btn.classList.add("completed");
    } else if (isCurrent) {
      btn.classList.add("current");
    } else if (!isUnlocked) {
      btn.classList.add("locked");
    }

    if (isUnlocked) {
      btn.addEventListener("click", () => startLevel(i));
    }

    grid.appendChild(btn);
  }
}

// ----- Leaderboard -----
function renderLeaderboard() {
  const list = $("#leaderboard-list");
  list.innerHTML = "";

  const hasAnyData = saveData.bestRuns.some((r) => r);

  if (!hasAnyData) {
    const row = document.createElement("div");
    row.className = "lb-row no-data";
    row.textContent = "No runs yet — start digging!";
    list.appendChild(row);
    return;
  }

  for (let i = 0; i < LEVEL_MAPS.length; i++) {
    const run = saveData.bestRuns[i];
    const row = document.createElement("div");
    row.className = "lb-row";

    const levelLabel = document.createElement("span");
    levelLabel.className = "lb-level";
    levelLabel.textContent = `Level ${i + 1}`;

    const stats = document.createElement("span");
    stats.className = "lb-stats";

    if (run) {
      stats.innerHTML =
        `<span>Pipes used: ${run.pipesUsed}</span>` +
        `<span>Coins: ${run.coinsCollected}</span>`;
    } else {
      stats.innerHTML = "<span>—</span>";
    }

    row.appendChild(levelLabel);
    row.appendChild(stats);
    list.appendChild(row);
  }
}

// ----- Settings -----
function renderSettings() {
  const nameInput = $("#settings-name");
  nameInput.value = saveData.playerName;

  const hintsBtn = $("#settings-hints");
  hintsBtn.textContent = saveData.showHints ? "ON" : "OFF";
  hintsBtn.className = `settings-toggle ${saveData.showHints ? "on" : ""}`;
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

  const rows = state.map.length;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= rows) {
    shakePlayer();
    return;
  }

  const raw = state.map[ny][nx];
  const tileType = TILE_EXPAND[raw] ?? raw;

  if (tileType === "bedrock") {
    shakePlayer();
    return;
  }

  if (tileType === "rock") {
    if (state.inventory.drill > 0) {
      state.inventory.drill -= 1;
      state.map[ny][nx] = "D";
    } else {
      shakePlayer();
      return;
    }
  }

  if (tileType === "coin") {
    state.coins += 10;
    state.coinsCollected += 10;
    state.map[ny][nx] = "D";
  }

  const key = `${nx},${ny}`;
  const isNewTile = !state.visitedTiles.has(key);

  if (isNewTile) {
    state.pipesLeft -= 1;
    state.pipesUsed += 1;
    state.visitedTiles.add(key);
  }

  state.playerPos = { x: nx, y: ny };

  render();

  if (tileType === "aquifer") {
    handleWin();
    return;
  }

  if (state.pipesLeft <= 0 && !isOnAquifer()) {
    handleLose();
  }
}

function isOnAquifer() {
  const raw = state.map[state.playerPos.y][state.playerPos.x];
  return (TILE_EXPAND[raw] ?? raw) === "aquifer";
}

function shakePlayer() {
  const idx = state.playerPos.y * COLS + state.playerPos.x;
  const cell = boardEl.children[idx];
  if (!cell) return;
  cell.classList.remove("shake");
  void cell.offsetWidth;
  cell.classList.add("shake");
}

// ----- Win / Lose -----
function handleWin() {
  state.gameActive = false;

  // Update save data
  const lvl = state.levelIndex;
  saveData.completedLevels[lvl] = true;

  if (lvl + 1 > saveData.unlockedLevel) {
    saveData.unlockedLevel = Math.min(lvl + 1, LEVEL_MAPS.length - 1);
  }

  // Track best run
  const currentRun = {
    pipesUsed: state.pipesUsed,
    coinsCollected: state.coinsCollected,
  };
  const prevBest = saveData.bestRuns[lvl];
  if (!prevBest || currentRun.pipesUsed < prevBest.pipesUsed) {
    saveData.bestRuns[lvl] = currentRun;
  }

  saveData.totalCoins = state.coins;
  saveData.inventory = { ...state.inventory };
  writeSave(saveData);

  spawnConfetti();
  showScreen("win");
}

function handleLose() {
  state.gameActive = false;
  showScreen("lose");
}

// ----- Confetti -----
function spawnConfetti() {
  const container = $("#confetti-container");
  container.innerHTML = "";
  const colors = ["#FFC907", "#3FA9F5", "#77A8BB", "#003366", "#fff"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    container.appendChild(piece);
  }
}

// ----- Shop Logic -----
function openShop() {
  state.gameActive = false;
  showScreen("shop");
}

function closeShop() {
  showScreen("game");
  state.gameActive = true;
}

function buyItem(itemName) {
  const cost = SHOP_PRICES[itemName];
  if (cost === undefined) return;

  const cardId = itemName === "pipes" ? "shop-pipes" : `shop-${itemName}`;
  const card = $(`#${cardId}`);

  if (state.coins >= cost) {
    state.coins -= cost;

    if (itemName === "drill") {
      state.inventory.drill += 1;
    } else if (itemName === "pipes") {
      state.pipesLeft += 5;
    }

    if (card) {
      card.classList.remove("shop-pop");
      void card.offsetWidth;
      card.classList.add("shop-pop");
    }

    hudPipes.textContent = `Pipes Left: ${state.pipesLeft}`;
    hudCoins.textContent = `Coins: ${state.coins}`;
    drillCount.textContent = state.inventory.drill;
  } else {
    if (card) {
      card.classList.remove("shop-flash");
      void card.offsetWidth;
      card.classList.add("shop-flash");
    }
  }
}

// ----- Game Flow -----
function startLevel(levelIndex) {
  state = createInitialState(levelIndex);
  state.gameActive = true;
  showScreen("game");
  render();
}

function goHome() {
  state.gameActive = false;
  // Save coins/inventory when leaving mid-game
  saveData.totalCoins = state.coins;
  saveData.inventory = { ...state.inventory };
  writeSave(saveData);
  showScreen("start");
}

function resetLevel() {
  const lvl = state.levelIndex;
  state = createInitialState(lvl);
  state.gameActive = true;
  showScreen("game");
  render();
}

function nextLevel() {
  const nextIdx = state.levelIndex + 1;
  const lvl = nextIdx >= LEVEL_MAPS.length ? 0 : nextIdx;

  // Carry over coins and inventory
  saveData.totalCoins = state.coins;
  saveData.inventory = { ...state.inventory };
  writeSave(saveData);

  startLevel(lvl);
}

function replaySameLevel() {
  startLevel(state.levelIndex);
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

// Click-to-move
function handleBoardClick(e) {
  const cell =
    e.target.closest(".tile-clickable") ||
    (e.target.classList.contains("tile-clickable") ? e.target : null);
  if (!cell || !cell.dataset.tx) return;
  const tx = Number(cell.dataset.tx);
  const ty = Number(cell.dataset.ty);
  const dir = directionFromPlayer(tx, ty);
  if (dir) tryMove(dir);
}

boardEl.addEventListener("click", handleBoardClick);

// ----- Button Wiring -----

// Start — continue from highest unlocked level
$("#btn-start").addEventListener("click", () => {
  const lvl = saveData.unlockedLevel;
  startLevel(lvl);
});

// Level select
$("#btn-levels").addEventListener("click", () => {
  renderLevelSelect();
  showScreen("levels");
});

$("#btn-levels-back").addEventListener("click", () => {
  showScreen("start");
});

// Home
$("#btn-home").addEventListener("click", goHome);

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
  showScreen("shop");
});

// Settings
$("#btn-settings-open").addEventListener("click", () => {
  renderSettings();
  showScreen("settings");
});

$("#btn-settings-close").addEventListener("click", () => {
  // Save name
  const name = $("#settings-name").value.trim();
  saveData.playerName = name || "Pioneer";
  writeSave(saveData);
  showScreen("start");
});

$("#settings-hints").addEventListener("click", () => {
  saveData.showHints = !saveData.showHints;
  writeSave(saveData);
  renderSettings();
});

$("#btn-reset-progress").addEventListener("click", () => {
  if (
    confirm("This will erase all progress, coins, and best runs. Continue?")
  ) {
    saveData = resetSave();
    renderSettings();
  }
});

// Leaderboard
$("#btn-leaderboard-open").addEventListener("click", () => {
  renderLeaderboard();
  showScreen("leaderboard");
});

$("#btn-leaderboard-close").addEventListener("click", () => {
  showScreen("start");
});
