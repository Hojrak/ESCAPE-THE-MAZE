document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const startButton = document.getElementById("startGame");
  const timeDisplay = document.getElementById("time");
  const livesDisplay = document.getElementById("lives");
  const upBtn = document.getElementById("upBtn");
  const downBtn = document.getElementById("downBtn");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const themeButtons = document.querySelectorAll(".theme-btn");
  const body = document.body;

  // Stałe gry
  const ROWS = 15;
  const COLS = 15;
  const CELL_SIZE = Math.min(canvas.width / COLS, canvas.height / ROWS);
  const PLAYER_SIZE = CELL_SIZE * 0.6;

  // Zmienne gry
  let maze = [];
  let player = { x: 1, y: 1 };
  let exit = { x: COLS - 2, y: ROWS - 2 };
  let lives = 3;
  let startTime = 0;
  let gameInterval;
  let isGameRunning = false;

  // Motywy
  const themes = {
    default: { emoji: "🌞", name: "Default" },
    dark: { emoji: "🌙", name: "Dark" },
    neon: { emoji: "🌈", name: "Neon" },
    nature: { emoji: "🌿", name: "Nature" },
  };

  // Inicjalizacja gry
  function initGame() {
    console.log("Inicjalizacja gry...");
    generateMaze();
    console.log("Labirynt wygenerowany:", maze);
    generateMaze();
    player = { x: 1, y: 1 };
    lives = 3;
    updateLivesDisplay();
    startTime = Date.now();
    livesDisplay.textContent = "Życia: ❤️❤️❤️";

    if (isGameRunning) {
      clearInterval(gameInterval);
    }

    gameInterval = setInterval(updateGame, 100);
    isGameRunning = true;
    drawMaze();
  }

  // Generowanie labiryntu
  function generateMaze() {
    maze = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(1));
    const startX = 1,
      startY = 1;
    maze[startY][startX] = 0;

    let stack = [{ x: startX, y: startY }];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const { x, y } = current;

      const availableDirections = directions.filter((dir) => {
        const nx = x + dir.dx * 2,
          ny = y + dir.dy * 2;
        return (
          nx > 0 &&
          nx < COLS - 1 &&
          ny > 0 &&
          ny < ROWS - 1 &&
          maze[ny][nx] === 1
        );
      });

      if (availableDirections.length === 0) {
        stack.pop();
        continue;
      }

      const dir =
        availableDirections[
          Math.floor(Math.random() * availableDirections.length)
        ];
      const nx = x + dir.dx,
        ny = y + dir.dy;
      const nx2 = x + dir.dx * 2,
        ny2 = y + dir.dy * 2;

      maze[ny][nx] = 0;
      maze[ny2][nx2] = 0;
      stack.push({ x: nx2, y: ny2 });
    }

    exit = findFurthestPoint(player.x, player.y);
    maze[exit.y][exit.x] = 0;
    removeSomeWalls(0.05);
  }

  function findFurthestPoint(startX, startY) {
    const visited = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(false));
    const queue = [{ x: startX, y: startY, dist: 0 }];
    let furthest = { x: startX, y: startY, dist: 0 };
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const current = queue.shift();
      if (current.dist > furthest.dist) furthest = current;

      const neighbors = [
        { x: current.x, y: current.y - 1 },
        { x: current.x + 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x - 1, y: current.y },
      ];

      for (const neighbor of neighbors) {
        if (
          neighbor.x >= 0 &&
          neighbor.x < COLS &&
          neighbor.y >= 0 &&
          neighbor.y < ROWS &&
          maze[neighbor.y][neighbor.x] === 0 &&
          !visited[neighbor.y][neighbor.x]
        ) {
          visited[neighbor.y][neighbor.x] = true;
          queue.push({ x: neighbor.x, y: neighbor.y, dist: current.dist + 1 });
        }
      }
    }
    return { x: furthest.x, y: furthest.y };
  }

  function removeSomeWalls(probability) {
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        if (
          maze[y][x] === 1 &&
          Math.random() < probability &&
          countAdjacentWalls(x, y) >= 5
        ) {
          maze[y][x] = 0;
        }
      }
    }
  }

  function countAdjacentWalls(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx,
          ny = y + dy;
        if (
          nx >= 0 &&
          nx < COLS &&
          ny >= 0 &&
          ny < ROWS &&
          maze[ny][nx] === 1
        ) {
          count++;
        }
      }
    }
    return count;
  }

  function drawMaze() {
    console.log("Rysowanie labiryntu...");
    // Reset canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pobierz kolory
    const styles = getComputedStyle(document.documentElement);
    const wallColor = styles.getPropertyValue("--wall-color").trim();
    const pathColor = styles.getPropertyValue("--path-color").trim();
    const exitColor = styles.getPropertyValue("--exit-color").trim();
    const playerColor = styles.getPropertyValue("--player-color").trim();

    // Oblicz marginesy dla wyśrodkowania
    const marginX = (canvas.width - COLS * CELL_SIZE) / 2;
    const marginY = (canvas.height - ROWS * CELL_SIZE) / 2;

    // Rysuj labirynt
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = maze[y][x] === 1 ? wallColor : pathColor;
        ctx.fillRect(
          marginX + x * CELL_SIZE,
          marginY + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    // Rysuj wyjście
    ctx.fillStyle = exitColor;
    ctx.fillRect(
      marginX + exit.x * CELL_SIZE,
      marginY + exit.y * CELL_SIZE,
      CELL_SIZE,
      CELL_SIZE
    );

    // Rysuj gracza
    ctx.fillStyle = playerColor;
    const playerX =
      marginX + player.x * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE) / 2;
    const playerY =
      marginY + player.y * CELL_SIZE + (CELL_SIZE - PLAYER_SIZE) / 2;
    ctx.fillRect(playerX, playerY, PLAYER_SIZE, PLAYER_SIZE);
  }

  function updateGame() {
    const currentTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(currentTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (currentTime % 60).toString().padStart(2, "0");
    timeDisplay.textContent = `Time: ${minutes}:${seconds}`;

    if (player.x === exit.x && player.y === exit.y) {
      clearInterval(gameInterval);
      isGameRunning = false;
      setTimeout(
        () => alert(`Gratulacje! Ukończyłeś labirynt w ${minutes}:${seconds}!`),
        100
      );
    }
  }

  function movePlayer(dx, dy) {
    if (!isGameRunning) return;

    const newX = player.x + dx;
    const newY = player.y + dy;

    if (
      newX >= 0 &&
      newX < COLS &&
      newY >= 0 &&
      newY < ROWS &&
      maze[newY][newX] === 0
    ) {
      player.x = newX;
      player.y = newY;
      drawMaze();
    } else if (maze[newY]?.[newX] === 1) {
      // Kolizja ze ścianą
      lives--;
      updateLivesDisplay();

      if (lives <= 0) {
        clearInterval(gameInterval);
        isGameRunning = false;
        setTimeout(() => alert("Game Over! Spróbuj jeszcze raz."), 100);
      }
    }
  }

  function updateLivesDisplay() {
    const hearts = "❤️".repeat(lives) + "♡".repeat(3 - lives);
    livesDisplay.textContent = `Życia: ${hearts}`;
  }

  function updateThemeExamples() {
    const styles = getComputedStyle(document.documentElement);
    document.documentElement.style.setProperty(
      "--wall-color",
      styles.getPropertyValue("--secondary")
    );
    document.documentElement.style.setProperty(
      "--exit-color",
      styles.getPropertyValue("--success")
    );
    document.documentElement.style.setProperty(
      "--player-color",
      styles.getPropertyValue("--primary")
    );
  }

  // Inicjalizacja przycisków motywów
  themeButtons.forEach((button) => {
    const theme = button.dataset.theme;
    if (themes[theme]) {
      button.textContent = themes[theme].emoji;
      button.title = themes[theme].name;
      button.addEventListener("click", () => {
        body.setAttribute("data-theme", theme);
        localStorage.setItem("gameTheme", theme);
        updateThemeExamples();
        if (isGameRunning) drawMaze();
      });
    }
  });

  // Załaduj zapisany motyw
  const savedTheme = localStorage.getItem("gameTheme") || "default";
  body.setAttribute("data-theme", savedTheme);
  updateThemeExamples();

  // Event listeners
  document.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") movePlayer(0, -1);
    else if (key === "arrowright" || key === "d") movePlayer(1, 0);
    else if (key === "arrowdown" || key === "s") movePlayer(0, 1);
    else if (key === "arrowleft" || key === "a") movePlayer(-1, 0);
  });

  upBtn.addEventListener("click", () => movePlayer(0, -1));
  downBtn.addEventListener("click", () => movePlayer(0, 1));
  leftBtn.addEventListener("click", () => movePlayer(-1, 0));
  rightBtn.addEventListener("click", () => movePlayer(1, 0));
  startButton.addEventListener("click", initGame);
});
