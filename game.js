(() => {

    const TOTAL_LEVELS = 1000;
    const STORAGE_KEY = "mindQuest_save_v1";

    let currentLevel = 1;
    let unlockedLevel = 1;

    let gridSize = 3;

    let puzzleState = [];
    let initialState = [];

    let moveCount = 0;
    let timerSeconds = 0;

    let timerInterval = null;
    let isSolved = false;

    let undoStack = [];

    const gridEl = document.getElementById("puzzleGrid");
    const levelDisplay = document.getElementById("levelDisplay");
    const difficultyDisplay = document.getElementById("difficultyDisplay");

    const movesDisplay = document.getElementById("movesDisplay");
    const timerDisplay = document.getElementById("timerDisplay");

    const starsContainer = document.getElementById("starsContainer");
    const solvedMessage = document.getElementById("solvedMessage");

    const undoBtn = document.getElementById("undoBtn");
    const hintBtn = document.getElementById("hintBtn");
    const restartBtn = document.getElementById("restartBtn");

    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");


    // -------------------------
    // DIFFICULTY
    // -------------------------

    function getDifficulty(level) {

        if (level <= 100) return "Easy";
        if (level <= 300) return "Medium";
        if (level <= 600) return "Hard";
        if (level <= 800) return "Very Hard";

        return "Expert";
    }


    // -------------------------
    // GRID SIZE
    // -------------------------

    function getGridSize(level) {

        if (level <= 100) return 3;
        if (level <= 300) return 4;

        return 5;
    }


    // -------------------------
    // RANDOM GENERATOR
    // -------------------------

    function createRandom(seed) {

        let t = seed + 0x6D2B79F5;

        return function () {

            t = Math.imul(t ^ t >>> 15, t | 1);

            t ^= t + Math.imul(t ^ t >>> 7, t | 61);

            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }


    // -------------------------
    // NEIGHBORS
    // -------------------------

    function getNeighbors(index, size) {

        const row = Math.floor(index / size);
        const col = index % size;

        const neighbors = [];

        if (row > 0)
            neighbors.push(index - size);

        if (row < size - 1)
            neighbors.push(index + size);

        if (col > 0)
            neighbors.push(index - 1);

        if (col < size - 1)
            neighbors.push(index + 1);

        return neighbors;
    }


    // -------------------------
    // GENERATE PUZZLE
    // -------------------------

    function generatePuzzle(level, size) {

        const seed =
            level * 7919 +
            size * 104729;

        const rand = createRandom(seed);

        const total = size * size;

        const solved = Array.from(
            { length: total },
            (_, i) => (i + 1) % total
        );

        let state = [...solved];

        let emptyIndex = total - 1;

        const shuffleMoves =
            size * size * 12 +
            Math.floor(rand() * 20) +
            30;

        let lastMove = -1;

        for (let i = 0; i < shuffleMoves; i++) {

            const neighbors =
                getNeighbors(emptyIndex, size);

            const candidates =
                neighbors.filter(index => index !== lastMove);

            if (!candidates.length)
                continue;

            const randomNeighbor =
                candidates[
                    Math.floor(
                        rand() * candidates.length
                    )
                ];

            state[emptyIndex] =
                state[randomNeighbor];

            state[randomNeighbor] = 0;

            lastMove = emptyIndex;

            emptyIndex = randomNeighbor;
        }

        return state;
    }


    // -------------------------
    // SOLVED CHECK
    // -------------------------

    function isSolvedState(state, size) {

        const total = size * size;

        for (let i = 0; i < total - 1; i++) {

            if (state[i] !== i + 1)
                return false;
        }

        return state[total - 1] === 0;
    }


    // -------------------------
    // RENDER
    // -------------------------

    function renderGrid() {

        const total = gridSize * gridSize;

        gridEl.style.gridTemplateColumns =
            `repeat(${gridSize}, 1fr)`;

        gridEl.innerHTML = "";

        for (let i = 0; i < total; i++) {

            const value = puzzleState[i];

            const tile = document.createElement("div");

            tile.className =
                value === 0
                    ? "tile empty"
                    : "tile";

            tile.textContent =
                value === 0
                    ? ""
                    : value;

            if (value !== 0 && !isSolved) {

                tile.addEventListener(
                    "click",
                    () => handleTileClick(i)
                );
            }

            gridEl.appendChild(tile);
        }
    }


    // -------------------------
    // TILE CLICK
    // -------------------------

    function handleTileClick(index) {

        if (isSolved)
            return;

        const emptyIndex =
            puzzleState.indexOf(0);

        if (!isAdjacent(index, emptyIndex))
            return;

        undoStack.push([...puzzleState]);

        if (undoStack.length > 100)
            undoStack.shift();

        puzzleState[emptyIndex] =
            puzzleState[index];

        puzzleState[index] = 0;

        moveCount++;

        updateStats();

        renderGrid();

        checkSolved();
    }


    // -------------------------
    // ADJACENT
    // -------------------------

    function isAdjacent(i, j) {

        const row1 = Math.floor(i / gridSize);
        const col1 = i % gridSize;

        const row2 = Math.floor(j / gridSize);
        const col2 = j % gridSize;

        return (
            Math.abs(row1 - row2) +
            Math.abs(col1 - col2)
        ) === 1;
    }


    // -------------------------
    // SOLVED
    // -------------------------

    function checkSolved() {

        if (isSolved)
            return;

        if (!isSolvedState(puzzleState, gridSize))
            return;

        isSolved = true;

        stopTimer();

        const stars = calculateStars();

        displayStars(stars);

        solvedMessage.textContent =
            "✨ PUZZLE SOLVED! ✨";

        if (
            currentLevel === unlockedLevel &&
            currentLevel < TOTAL_LEVELS
        ) {

            unlockedLevel =
                currentLevel + 1;

            saveProgress();
        }

        updateNavButtons();

        renderGrid();

        undoBtn.disabled = true;
        hintBtn.disabled = true;
    }


    // -------------------------
    // STARS
    // -------------------------

    function calculateStars() {

        const par =
            gridSize * gridSize * 3;

        if (moveCount <= par)
            return 3;

        if (moveCount <= par * 1.8)
            return 2;

        return 1;
    }


    function displayStars(count) {

        starsContainer.innerHTML = "";

        for (let i = 1; i <= 3; i++) {

            const star =
                document.createElement("span");

            star.className =
                i <= count
                    ? "star-filled"
                    : "star-empty";

            star.textContent = "★";

            starsContainer.appendChild(star);
        }
    }


    // -------------------------
    // TIMER
    // -------------------------

    function startTimer() {

        stopTimer();

        timerSeconds = 0;

        updateTimer();

        timerInterval = setInterval(() => {

            if (!isSolved) {

                timerSeconds++;

                updateTimer();
            }

        }, 1000);
    }


    function stopTimer() {

        if (timerInterval) {

            clearInterval(timerInterval);

            timerInterval = null;
        }
    }


    function updateTimer() {

        const minutes =
            Math.floor(timerSeconds / 60);

        const seconds =
            timerSeconds % 60;

        timerDisplay.textContent =
            `${minutes}:${seconds
                .toString()
                .padStart(2, "0")}`;
    }


    // -------------------------
    // STATS
    // -------------------------

    function updateStats() {

        movesDisplay.textContent =
            moveCount;
    }


    // -------------------------
    // RESET UI
    // -------------------------

    function resetUI() {

        displayStars(0);

        solvedMessage.textContent = "";

        undoBtn.disabled = false;
        hintBtn.disabled = false;
    }


    // -------------------------
    // LOAD LEVEL
    // -------------------------

    function loadLevel(level) {

        if (level < 1)
            level = 1;

        if (level > TOTAL_LEVELS)
            level = TOTAL_LEVELS;

        if (level > unlockedLevel)
            level = unlockedLevel;

        currentLevel = level;

        gridSize =
            getGridSize(currentLevel);

        levelDisplay.textContent =
            currentLevel;

        difficultyDisplay.textContent =
            getDifficulty(currentLevel);

        puzzleState =
            generatePuzzle(
                currentLevel,
                gridSize
            );

        initialState =
            [...puzzleState];

        moveCount = 0;

        undoStack = [];

        isSolved = false;

        resetUI();

        updateStats();

        renderGrid();

        startTimer();

        updateNavButtons();

        saveProgress();
    }


    // -------------------------
    // RESTART
    // -------------------------

    function restartLevel() {

        puzzleState =
            [...initialState];

        moveCount = 0;

        undoStack = [];

        isSolved = false;

        resetUI();

        updateStats();

        renderGrid();

        startTimer();
    }


    // -------------------------
    // UNDO
    // -------------------------

    function undoMove() {

        if (!undoStack.length || isSolved)
            return;

        puzzleState =
            undoStack.pop();

        moveCount++;

        updateStats();

        renderGrid();
    }


    // -------------------------
    // HINT
    // -------------------------

    function showHint() {

        if (isSolved)
            return;

        const empty =
            puzzleState.indexOf(0);

        const neighbors =
            getNeighbors(
                empty,
                gridSize
            );

        if (!neighbors.length)
            return;

        let bestMove = null;
        let bestScore = Infinity;

        for (const index of neighbors) {

            const testState =
                [...puzzleState];

            testState[empty] =
                testState[index];

            testState[index] = 0;

            let score = 0;

            for (
                let i = 0;
                i < testState.length;
                i++
            ) {

                if (
                    testState[i] !== 0 &&
                    testState[i] !== i + 1
                ) {
                    score++;
                }
            }

            if (score < bestScore) {

                bestScore = score;

                bestMove = index;
            }
        }

        if (bestMove !== null) {

            const tile =
                gridEl.children[bestMove];

            tile.animate(
                [
                    { transform: "scale(1)" },
                    { transform: "scale(1.12)" },
                    { transform: "scale(1)" }
                ],
                {
                    duration: 500,
                    iterations: 2
                }
            );
        }
    }


    // -------------------------
    // NAVIGATION
    // -------------------------

    function updateNavButtons() {

        prevBtn.disabled =
            currentLevel <= 1;

        nextBtn.disabled =
            currentLevel >= unlockedLevel ||
            currentLevel >= TOTAL_LEVELS;
    }


    prevBtn.addEventListener(
        "click",
        () => loadLevel(currentLevel - 1)
    );

    nextBtn.addEventListener(
        "click",
        () => loadLevel(currentLevel + 1)
    );


    // -------------------------
    // BUTTONS
    // -------------------------

    undoBtn.addEventListener(
        "click",
        undoMove
    );

    hintBtn.addEventListener(
        "click",
        showHint
    );

    restartBtn.addEventListener(
        "click",
        restartLevel
    );


    // -------------------------
    // SAVE
    // -------------------------

    function saveProgress() {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    unlockedLevel,
                    currentLevel
                })
            );

        } catch (error) {

            console.warn(
                "Could not save progress"
            );
        }
    }


    // -------------------------
    // LOAD SAVE
    // -------------------------

    function loadProgress() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (saved) {

                const data =
                    JSON.parse(saved);

                if (
                    data.unlockedLevel >= 1 &&
                    data.unlockedLevel <= TOTAL_LEVELS
                ) {

                    unlockedLevel =
                        data.unlockedLevel;
                }

                if (
                    data.currentLevel >= 1 &&
                    data.currentLevel <= TOTAL_LEVELS
                ) {

                    currentLevel =
                        data.currentLevel;
                }
            }

        } catch (error) {

            console.warn(
                "Could not load progress"
            );
        }

        if (
            currentLevel >
            unlockedLevel
        ) {

            currentLevel =
                unlockedLevel;
        }
    }


    // -------------------------
    // START GAME
    // -------------------------

    loadProgress();

    loadLevel(currentLevel);

})();// game.js — state, game loop, resize, and boot
// draw() is defined in render.js; input listeners are set up in input.js

var COLS = 20;
var ROWS = 20;
var FPS  = 9;
var CELL; // pixels per cell, computed in resize()

// ── State ─────────────────────────────────────────────────────────────────

var snake, dir, nextDir, food, score, best, phase, loopTimer;
// phase: 'idle' | 'running' | 'dead'

function init() {
  snake   = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  placeFood();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(function(s) { return s.x === food.x && s.y === food.y; }));
}

function start() {
  if (loopTimer) clearInterval(loopTimer);
  init();
  phase     = 'running';
  loopTimer = setInterval(tick, 1000 / FPS);
}

// ── Game loop ──────────────────────────────────────────────────────────────

function tick() {
  dir = nextDir;

  var head = { x: (snake[0].x + dir.x + COLS) % COLS,
               y: (snake[0].y + dir.y + ROWS) % ROWS };

  if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
    phase = 'dead';
    best  = Math.max(best, score);
    clearInterval(loopTimer);
    draw();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

// ── Resize ────────────────────────────────────────────────────────────────

function resize() {
  const size  = Math.min(globalThis.innerWidth, globalThis.innerHeight);
  CELL      = Math.floor(size / COLS);
  const px    = CELL * COLS;
  canvas.width  = px;
  canvas.height = px;
  draw();
}

window.addEventListener('resize', resize);

// ── Boot ──────────────────────────────────────────────────────────────────

best  = 0;
phase = 'idle';
init();
resize();
