/* Road Rush - original canvas mini-game for The Car Deal-oog */
(function () {
  "use strict";

  const canvas = document.getElementById("carGame");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreElement = document.querySelector("[data-game-score]");
  const bestElement = document.querySelector("[data-game-best]");
  const stateElement = document.querySelector("[data-game-state]");
  const startButton = document.querySelector("[data-game-start]");

  const game = {
    width: 720,
    height: 480,
    running: false,
    score: 0,
    speed: 5,
    stripeOffset: 0,
    spawnTimer: 0,
    best: Number(TCD.storage.get("game_best", 0)),
    player: { x: 337, y: 382, width: 46, height: 76, velocity: 0 },
    traffic: [],
    frame: 0
  };

  canvas.width = game.width;
  canvas.height = game.height;
  bestElement.textContent = game.best;

  function laneX(lane) {
    return 150 + lane * 140 + 47;
  }

  function reset() {
    game.running = true;
    game.score = 0;
    game.speed = 5;
    game.stripeOffset = 0;
    game.spawnTimer = 0;
    game.traffic = [];
    game.frame = 0;
    game.player.x = laneX(1);
    game.player.velocity = 0;
    stateElement.textContent = "Rijdend";
    startButton.textContent = "Opnieuw starten";
    scoreElement.textContent = "0";
  }

  function drawRoad() {
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, "#0d315d");
    gradient.addColorStop(1, "#071528");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    ctx.fillStyle = "#263548";
    ctx.fillRect(100, 0, 520, game.height);
    ctx.fillStyle = "#39d5ff";
    ctx.fillRect(96, 0, 4, game.height);
    ctx.fillRect(620, 0, 4, game.height);

    ctx.fillStyle = "rgba(255,255,255,.7)";
    for (let lane = 1; lane < 4; lane += 1) {
      const x = 100 + lane * 130;
      for (let y = -60 + game.stripeOffset; y < game.height; y += 95) {
        ctx.fillRect(x - 3, y, 6, 48);
      }
    }

    ctx.fillStyle = "rgba(57,213,255,.15)";
    for (let i = 0; i < 18; i += 1) {
      const x = i % 2 === 0 ? 38 : 660;
      const y = (i * 37 + game.stripeOffset * 1.5) % game.height;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCar(car, color, isPlayer = false) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.shadowColor = isPlayer ? "rgba(57,213,255,.75)" : "rgba(0,0,0,.55)";
    ctx.shadowBlur = isPlayer ? 20 : 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(0, 0, car.width, car.height, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#bfeeff";
    ctx.beginPath();
    ctx.roundRect(7, 12, car.width - 14, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#081426";
    ctx.fillRect(3, 15, 5, 16);
    ctx.fillRect(car.width - 8, 15, 5, 16);
    ctx.fillRect(3, car.height - 28, 5, 16);
    ctx.fillRect(car.width - 8, car.height - 28, 5, 16);
    ctx.fillStyle = isPlayer ? "#fff" : "#ffd7a6";
    ctx.fillRect(7, 3, 10, 5);
    ctx.fillRect(car.width - 17, 3, 10, 5);
    ctx.fillStyle = "#ff4962";
    ctx.fillRect(7, car.height - 8, 10, 5);
    ctx.fillRect(car.width - 17, car.height - 8, 10, 5);
    ctx.restore();
  }

  function spawnTraffic() {
    const lane = Math.floor(Math.random() * 4);
    const colors = ["#e84b60", "#f6b93b", "#f3f6fa", "#7b5cff"];
    game.traffic.push({
      x: laneX(lane),
      y: -90,
      width: 46,
      height: 76,
      speed: game.speed + Math.random() * 2.3,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function intersects(a, b) {
    const padding = 6;
    return a.x + padding < b.x + b.width - padding &&
      a.x + a.width - padding > b.x + padding &&
      a.y + padding < b.y + b.height - padding &&
      a.y + a.height - padding > b.y + padding;
  }

  function endGame() {
    game.running = false;
    stateElement.textContent = "Botsing";
    if (game.score > game.best) {
      game.best = game.score;
      TCD.storage.set("game_best", game.best);
      bestElement.textContent = game.best;
    }
  }

  function update() {
    if (!game.running) return;
    game.frame += 1;
    game.stripeOffset = (game.stripeOffset + game.speed) % 95;
    game.player.x += game.player.velocity;
    game.player.x = Math.max(112, Math.min(562, game.player.x));
    game.player.velocity *= 0.82;
    game.spawnTimer -= 1;
    if (game.spawnTimer <= 0) {
      spawnTraffic();
      game.spawnTimer = Math.max(38, 82 - game.speed * 4 + Math.random() * 25);
    }
    game.traffic.forEach((car) => { car.y += car.speed; });
    if (game.traffic.some((car) => intersects(game.player, car))) endGame();
    game.traffic = game.traffic.filter((car) => car.y < game.height + 100);
    if (game.frame % 12 === 0) {
      game.score += 1;
      game.speed = Math.min(11, 5 + game.score / 35);
      scoreElement.textContent = game.score;
    }
  }

  function drawOverlay() {
    if (game.running) return;
    ctx.fillStyle = "rgba(3,15,35,.72)";
    ctx.fillRect(100, 0, 524, game.height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "800 34px Segoe UI, sans-serif";
    ctx.fillText(game.frame ? "Botsing!" : "Road Rush", game.width / 2, 205);
    ctx.fillStyle = "#83e9ff";
    ctx.font = "600 18px Segoe UI, sans-serif";
    ctx.fillText(game.frame ? `Score: ${game.score} · klik op Opnieuw starten` : "Ontwijk het verkeer en pak de hoogste score", game.width / 2, 242);
  }

  function render() {
    drawRoad();
    game.traffic.forEach((car) => drawCar(car, car.color));
    drawCar(game.player, "#2864e8", true);
    drawOverlay();
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  function move(direction) {
    if (!game.running) return;
    game.player.velocity += direction * 4.5;
  }

  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(event.key)) event.preventDefault();
    if (["ArrowLeft", "a", "A"].includes(event.key)) move(-1);
    if (["ArrowRight", "d", "D"].includes(event.key)) move(1);
    if (event.key === " " && !game.running) reset();
  });

  document.querySelectorAll("[data-game-move]").forEach((button) => {
    const direction = Number(button.dataset.gameMove);
    ["pointerdown", "click"].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        move(direction);
      });
    });
  });
  startButton.addEventListener("click", reset);

  render();
  loop();
}());
