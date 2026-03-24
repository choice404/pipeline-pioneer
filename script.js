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

// ----- Level Data (loaded from levels.json) -----
let LEVEL_MAPS = [];
let LEVEL_PIPES = [];
let LEVEL_START_X = [];
let LEVEL_PAR = [];
let LEVEL_NAMES = [];

async function loadLevels() {
  try {
    const res = await fetch("levels.json");
    const levels = await res.json();
    LEVEL_MAPS = levels.map((l) => l.map);
    LEVEL_PIPES = levels.map((l) => l.pipes);
    LEVEL_START_X = levels.map((l) => l.startX);
    LEVEL_PAR = levels.map((l) => l.par);
    LEVEL_NAMES = levels.map((l) => l.name);
  } catch (err) {
    console.error("Failed to load levels.json:", err);
  }
}

// ----- Water Facts (charity: water) -----
const WATER_FACTS = [
  "663 million people — 1 in 10 — lack access to safe water.",
  "Women and children spend 200 million hours every day collecting water.",
  "Every day, more than 800 children under 5 die from diarrhea caused by dirty water.",
  "Access to clean water can reduce school absenteeism by up to 90%.",
  "A $1 investment in water and sanitation yields $4–$12 in economic returns.",
  "Clean water helps communities grow more food and earn more income.",
  "charity: water has funded over 137,000 water projects in 29 countries.",
  "The average water project serves about 250 people for decades.",
  "Safe water reduces the risk of waterborne diseases like cholera and typhoid.",
  "Girls are most affected by the water crisis — they miss school to collect water.",
  "In sub-Saharan Africa, people walk an average of 6 km to collect water.",
  "Clean water gives people time back — time for school, work, and family.",
  "100% of public donations to charity: water go directly to water projects.",
  "Every water project is tracked with GPS and satellite imagery.",
  "Clean water improves health, education, and economic opportunity for entire communities.",
];

const TILE_EXPAND = {
  D: "dirt",
  R: "rock",
  B: "bedrock",
  C: "coin",
  A: "aquifer",
};

// ----- Pipe Direction Logic (adjacency-based) -----
function isTilePipe(x, y) {
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

// ----- Procedural Map Generation (Endless Mode) -----
function generateEndlessMap(floor) {
  const rows = 10 + Math.min(floor, 10);
  const map = [];

  // Difficulty scaling
  const bedrockChance = Math.min(0.12 + floor * 0.015, 0.3);
  const rockChance = Math.min(0.08 + floor * 0.012, 0.25);
  const coinChance = Math.max(0.12 - floor * 0.005, 0.06);

  // Generate rows
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < COLS; x++) {
      if (y === rows - 1) {
        row.push("A"); // Aquifer bottom row
      } else if (y === 0) {
        row.push("D"); // First row always open
      } else {
        const r = Math.random();
        if (r < bedrockChance) {
          row.push("B");
        } else if (r < bedrockChance + rockChance) {
          row.push("R");
        } else if (r < bedrockChance + rockChance + coinChance) {
          row.push("C");
        } else {
          row.push("D");
        }
      }
    }
    map.push(row);
  }

  // Ensure solvability: carve a guaranteed path
  const startX = Math.floor(Math.random() * COLS);
  map[0][startX] = "D";

  let cx = startX;
  for (let y = 1; y < rows - 1; y++) {
    // Randomly move left, right, or straight down
    const moves = [0]; // always allow straight
    if (cx > 0) moves.push(-1);
    if (cx < COLS - 1) moves.push(1);
    const dx = moves[Math.floor(Math.random() * moves.length)];

    if (dx !== 0) {
      // Clear horizontal step
      map[y][cx + dx] = map[y][cx + dx] === "C" ? "C" : "D";
      cx += dx;
    }
    // Clear the current column in this row
    if (map[y][cx] === "B" || map[y][cx] === "R") {
      map[y][cx] = "D";
    }
  }

  // Sprinkle extra coins along path for early floors
  if (floor < 5) {
    let placed = 0;
    for (let y = 1; y < rows - 1 && placed < 3; y++) {
      for (let x = 0; x < COLS && placed < 3; x++) {
        if (map[y][x] === "D" && Math.random() < 0.1) {
          map[y][x] = "C";
          placed++;
        }
      }
    }
  }

  const pipes = Math.max(rows + 4 - Math.floor(floor / 3), rows);
  return { map, startX, pipes };
}

// ----- localStorage Persistence -----
function getDefaultSave() {
  return {
    playerName: "Pioneer",
    unlockedLevel: 0,
    completedLevels: [],
    bestRuns: [],
    showHints: true,
    tutorialSeen: false,
    endlessBest: { floors: 0, coins: 0 },
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
    // silently fail
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
  endlessOver: $("#screen-endless-over"),
};

const boardEl = $("#board");
const hudPipes = $("#hud-pipes");
const hudCoins = $("#hud-coins");
const hudLevel = $("#hud-level");
const drillCount = $("#drill-count");

// ----- Game State -----
let state = null;

// Game mode: "story" or "endless"
let gameMode = "story";
let endlessFloor = 0;
let endlessTotalCoins = 0;

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
    coins: 0,
    inventory: { drill: 0 },
    visitedTiles: new Set([`${startX},0`]),
    gameActive: false,
    pipesUsed: 0,
    coinsCollected: 0,
  };
}

function createEndlessState(floor) {
  const { map, startX, pipes } = generateEndlessMap(floor);
  return {
    levelIndex: -1,
    startX,
    map,
    originalMap: deepCopyMap(map),
    playerPos: { x: startX, y: 0 },
    pipesLeft: pipes,
    coins: endlessTotalCoins,
    inventory: { drill: 0 },
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
  coin: "water-can-transparent.png",
  aquifer: "17aquifer_tile.png",
};

function renderRigHeader() {
  const rigHeader = $("#rig-header");
  rigHeader.innerHTML = "";

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
      const isPlayer = state.playerPos.x === x && state.playerPos.y === y;
      const isVisited = state.visitedTiles.has(key);
      const isPipe = isVisited && !isPlayer && tileType !== "aquifer";

      cell.className = "tile";

      let tileImg = null;

      if (isPipe || (isPlayer && isVisited)) {
        tileImg = getPipeImage(x, y);
      } else {
        tileImg = TILE_IMAGES[tileType] ?? TILE_IMAGES.dirt;
      }

      // Water can sits on top of dirt tile
      if (tileType === "coin" && !isVisited) {
        cell.style.backgroundImage = `url(img/water-can-transparent.png), url(img/01dirt_tile.png)`;
        cell.style.backgroundSize = "60%, cover";
        cell.style.backgroundPosition = "center, center";
      } else {
        cell.style.backgroundImage = `url(img/${tileImg})`;
      }

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
  hudCoins.textContent = `Cans: ${state.coins}`;
  hudLevel.textContent =
    gameMode === "endless"
      ? `Floor ${endlessFloor + 1}`
      : `Level ${state.levelIndex + 1}`;
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

  const firstTile = boardEl.querySelector(".tile");
  if (!firstTile) return;
  const tileH = firstTile.offsetHeight + 1;

  const playerTop = rigH + state.playerPos.y * tileH;
  const targetScroll = Math.max(0, playerTop - viewportH * 0.4);
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

    const num = document.createElement("span");
    num.textContent = i + 1;
    btn.appendChild(num);

    // Show par under the level number
    const par = LEVEL_PAR[i];
    if (par) {
      const parLabel = document.createElement("span");
      parLabel.className = "level-par";
      parLabel.textContent = `Par ${par}`;
      btn.appendChild(parLabel);
    }

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

  // Endless best
  const eb = saveData.endlessBest;
  if (eb.floors > 0) {
    const header = document.createElement("div");
    header.className = "lb-row";
    header.innerHTML =
      `<span class="lb-level">♾️ Endless Best</span>` +
      `<span class="lb-stats">` +
      `<span>Floors: ${eb.floors}</span>` +
      `<span>Cans: ${eb.coins}</span></span>`;
    list.appendChild(header);
  }

  // Story levels
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
        `<span>Cans: ${run.coinsCollected}</span>`;
    } else {
      stats.innerHTML = "<span>—</span>";
    }

    row.appendChild(levelLabel);
    row.appendChild(stats);
    list.appendChild(row);
  }

  if (!eb.floors && !saveData.bestRuns.some((r) => r)) {
    list.innerHTML =
      '<div class="lb-row no-data">No runs yet — start digging!</div>';
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

  // Dismiss tutorial on first move
  dismissTutorial();

  const { dx, dy } = DIR[direction];
  const nx = state.playerPos.x + dx;
  const ny = state.playerPos.y + dy;

  const rows = state.map.length;
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= rows) {
    shakePlayer();
    sfxBlocked();
    return;
  }

  const raw = state.map[ny][nx];
  const tileType = TILE_EXPAND[raw] ?? raw;

  if (tileType === "bedrock") {
    shakePlayer();
    sfxBlocked();
    return;
  }

  if (tileType === "rock") {
    if (state.inventory.drill > 0) {
      state.inventory.drill -= 1;
      state.map[ny][nx] = "D";
      sfxRockBreak();
    } else {
      shakePlayer();
      sfxBlocked();
      return;
    }
  }

  if (tileType === "coin") {
    state.coins += 10;
    state.coinsCollected += 10;
    state.map[ny][nx] = "D";
    sfxCoin();
  } else {
    sfxMove();
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

  if (gameMode === "endless") {
    // Endless: advance to next floor
    endlessTotalCoins = state.coins;
    endlessFloor += 1;
    state = createEndlessState(endlessFloor);
    state.gameActive = true;
    render();
    return;
  }

  // Story mode
  const lvl = state.levelIndex;
  saveData.completedLevels[lvl] = true;

  if (lvl + 1 > saveData.unlockedLevel) {
    saveData.unlockedLevel = Math.min(lvl + 1, LEVEL_MAPS.length - 1);
  }

  const currentRun = {
    pipesUsed: state.pipesUsed,
    coinsCollected: state.coinsCollected,
  };
  const prevBest = saveData.bestRuns[lvl];
  if (!prevBest || currentRun.pipesUsed < prevBest.pipesUsed) {
    saveData.bestRuns[lvl] = currentRun;
  }

  writeSave(saveData);

  // Par display
  const par = LEVEL_PAR[lvl];
  const parEl = $("#win-par");
  if (par) {
    const diff = state.pipesUsed - par;
    if (diff <= 0) {
      parEl.textContent = `${state.pipesUsed} pipes used — Par ${par} 🎯 Under par!`;
      parEl.className = "win-par under-par";
    } else {
      parEl.textContent = `${state.pipesUsed} pipes used — Par ${par} (+${diff})`;
      parEl.className = "win-par over-par";
    }
  } else {
    parEl.textContent = `${state.pipesUsed} pipes used`;
    parEl.className = "win-par";
  }

  // Random water fact
  const factEl = $("#win-fact");
  factEl.textContent =
    WATER_FACTS[Math.floor(Math.random() * WATER_FACTS.length)];

  sfxWin();
  spawnConfetti();
  showScreen("win");
}

function handleLose() {
  state.gameActive = false;
  sfxLose();

  if (gameMode === "endless") {
    // Save endless best
    if (
      endlessFloor > saveData.endlessBest.floors ||
      (endlessFloor === saveData.endlessBest.floors &&
        endlessTotalCoins + state.coinsCollected > saveData.endlessBest.coins)
    ) {
      saveData.endlessBest = {
        floors: endlessFloor,
        coins: endlessTotalCoins + state.coinsCollected,
      };
      writeSave(saveData);
    }

    $("#endless-floors").textContent = endlessFloor;
    $("#endless-coins").textContent = endlessTotalCoins + state.coinsCollected;
    showScreen("endlessOver");
    return;
  }

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

// ----- Sound Effects (Web Audio API) -----
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = "square", volume = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio unavailable
  }
}

function sfxMove() {
  playTone(220, 0.08, "square", 0.08);
}

function sfxCoin() {
  playTone(660, 0.1, "sine", 0.15);
  setTimeout(() => playTone(880, 0.15, "sine", 0.12), 80);
}

function sfxRockBreak() {
  playTone(120, 0.15, "sawtooth", 0.12);
  setTimeout(() => playTone(80, 0.2, "sawtooth", 0.08), 100);
}

function sfxBlocked() {
  playTone(100, 0.12, "square", 0.1);
}

function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, "sine", 0.12), i * 120);
  });
}

function sfxLose() {
  [300, 250, 200, 150].forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, "sawtooth", 0.08), i * 150);
  });
}

function sfxBuy() {
  playTone(440, 0.1, "sine", 0.12);
  setTimeout(() => playTone(660, 0.15, "sine", 0.1), 80);
}

// ----- Tutorial -----
function showTutorial() {
  const overlay = $("#tutorial-overlay");
  if (overlay) overlay.classList.remove("hidden");
}

function hideTutorial() {
  const overlay = $("#tutorial-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function checkTutorial() {
  if (
    gameMode === "story" &&
    state.levelIndex === 0 &&
    !saveData.tutorialSeen
  ) {
    showTutorial();
  } else {
    hideTutorial();
  }
}

function dismissTutorial() {
  if (!saveData.tutorialSeen) {
    saveData.tutorialSeen = true;
    writeSave(saveData);
  }
  hideTutorial();
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

    sfxBuy();

    if (card) {
      card.classList.remove("shop-pop");
      void card.offsetWidth;
      card.classList.add("shop-pop");
    }

    hudPipes.textContent = `Pipes Left: ${state.pipesLeft}`;
    hudCoins.textContent = `Cans: ${state.coins}`;
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
  gameMode = "story";
  state = createInitialState(levelIndex);
  state.gameActive = true;
  $("#btn-reset").style.display = "";
  showScreen("game");
  render();
  checkTutorial();
}

function startEndless() {
  gameMode = "endless";
  endlessFloor = 0;
  endlessTotalCoins = 0;
  state = createEndlessState(0);
  state.gameActive = true;
  $("#btn-reset").style.display = "none";
  showScreen("game");
  render();
}

function goHome() {
  state.gameActive = false;
  showScreen("start");
}

function resetLevel() {
  if (gameMode === "endless") {
    state = createEndlessState(endlessFloor);
  } else {
    const lvl = state.levelIndex;
    state = createInitialState(lvl);
  }
  state.gameActive = true;
  showScreen("game");
  render();
}

function nextLevel() {
  const nextIdx = state.levelIndex + 1;
  const lvl = nextIdx >= LEVEL_MAPS.length ? 0 : nextIdx;
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
  startLevel(saveData.unlockedLevel);
});

// Endless mode
$("#btn-endless").addEventListener("click", startEndless);

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

// Win screen (story mode)
$("#btn-next-level").addEventListener("click", nextLevel);
$("#btn-replay").addEventListener("click", replaySameLevel);

// Lose screen (story mode)
$("#btn-restart").addEventListener("click", resetLevel);
$("#btn-lose-shop").addEventListener("click", () => {
  showScreen("shop");
});

// Endless game over
$("#btn-endless-retry").addEventListener("click", startEndless);
$("#btn-endless-home").addEventListener("click", () => {
  showScreen("start");
});

// Settings
$("#btn-settings-open").addEventListener("click", () => {
  renderSettings();
  showScreen("settings");
});

$("#btn-settings-close").addEventListener("click", () => {
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
  if (confirm("This will erase all progress, cans, and best runs. Continue?")) {
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

// ----- Bootstrap -----
(async () => {
  await loadLevels();
  state = createInitialState(0);
})();
