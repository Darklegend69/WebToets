/*
  Bestand 3 van 3: Road Dodge.
  Basisidee: W3Schools HTML Game Tutorial.
*/

var canvas = document.getElementById("roadGame");

if (canvas) {
  var ctx = canvas.getContext("2d");
  var scoreLabel = document.querySelector("[data-game-score]");
  var bestLabel = document.querySelector("[data-game-best]");
  var coinLabels = document.querySelectorAll("[data-game-coins], [data-garage-coins]");
  var statusLabel = document.querySelector("[data-game-status]");
  var powerLabel = document.querySelector("[data-game-power]");
  var startButton = document.querySelector("[data-game-start]");
  var skinGrid = document.querySelector("[data-skin-grid]");
  var garageMessage = document.querySelector("[data-garage-message]");

  var skins = [
    { id: "red", name: "Rode Sport", color: "#dc2638", stripe: "#ffffff" },
    { id: "blue", name: "Ocean Blue", color: "#2474d8", stripe: "#d9efff", price: 40 },
    { id: "gold", name: "Golden GT", color: "#e6ad24", stripe: "#fff0a6", price: 120 },
    { id: "black", name: "Midnight", color: "#181a1f", stripe: "#dc2638", price: 250 },
    { id: "bronze", name: "Bronze Record", color: "#a86532", stripe: "#f0c08d", record: 100 },
    { id: "silver", name: "Silver Record", color: "#aeb8c4", stripe: "#ffffff", record: 500 },
    { id: "emerald", name: "Emerald", color: "#168f6a", stripe: "#9effd8", record: 1000 },
    { id: "purple", name: "Purple Storm", color: "#7138b8", stripe: "#e7ccff", record: 2500 },
    { id: "diamond", name: "Diamond", color: "#79d8e8", stripe: "#ffffff", record: 5000 },
    { id: "legend", name: "Legend 7000", color: "#740014", stripe: "#ffd45e", record: 7000 }
  ];

  var player = { x: 310, y: 315, width: 46, height: 70 };
  var obstacles = [];
  var coins = [];
  var powers = [];
  var running = false;
  var score = 0;
  var frame = 0;
  var animationId = 0;
  var lastTime = 0;
  var shield = false;
  var doubleUntil = 0;
  var best = Number(TCD.storage.get("game_best", 0));
  var wallet = Number(TCD.storage.get("game_coins", 0));
  var owned = TCD.storage.get("game_owned_skins", ["red"]);
  var selectedId = TCD.storage.get("game_skin", "red");
  var selected;

  if (!Array.isArray(owned)) owned = ["red"];
  if (owned.indexOf("red") === -1) owned.push("red");

  function findSkin(id) {
    return skins.find(function (skin) { return skin.id === id; });
  }

  function available(skin) {
    if (skin.record) return best >= skin.record;
    return !skin.price || owned.indexOf(skin.id) !== -1;
  }

  function updateCoins() {
    coinLabels.forEach(function (label) { label.textContent = wallet; });
  }

  function renderGarage() {
    skinGrid.innerHTML = skins.map(function (skin) {
      return '<button class="skin-option" type="button" data-skin="' + skin.id + '">' +
        '<span class="skin-color" style="--skin-color:' + skin.color + ';--skin-stripe:' + skin.stripe + '"></span>' +
        '<strong>' + skin.name + '</strong><small data-skin-state></small></button>';
    }).join("");

    skinGrid.querySelectorAll("[data-skin]").forEach(function (button) {
      button.addEventListener("click", function () {
        chooseSkin(findSkin(button.getAttribute("data-skin")));
      });
    });
    updateGarage();
  }

  function updateGarage() {
    skinGrid.querySelectorAll("[data-skin]").forEach(function (button) {
      var skin = findSkin(button.getAttribute("data-skin"));
      var open = available(skin);
      var state = button.querySelector("[data-skin-state]");
      button.classList.toggle("is-locked", !open);
      button.classList.toggle("is-selected", skin.id === selectedId);

      if (skin.id === selectedId) state.textContent = "Geselecteerd";
      else if (skin.record) state.textContent = open ? "Vrijgespeeld" : "Record " + skin.record.toLocaleString("nl-NL");
      else if (open) state.textContent = "In bezit";
      else state.textContent = skin.price + " coins";
    });
  }

  function chooseSkin(skin) {
    if (skin.record && best < skin.record) {
      garageMessage.textContent = "Voor deze skin heb je record " + skin.record.toLocaleString("nl-NL") + " nodig.";
      return;
    }
    if (skin.price && owned.indexOf(skin.id) === -1) {
      if (wallet < skin.price) {
        garageMessage.textContent = "Je hebt nog " + (skin.price - wallet) + " coins nodig.";
        return;
      }
      wallet -= skin.price;
      owned.push(skin.id);
      TCD.storage.set("game_coins", wallet);
      TCD.storage.set("game_owned_skins", owned);
      updateCoins();
      garageMessage.textContent = skin.name + " is gekocht.";
    } else {
      garageMessage.textContent = skin.name + " is geselecteerd.";
    }
    selected = skin;
    selectedId = skin.id;
    TCD.storage.set("game_skin", selectedId);
    updateGarage();
    if (!running) drawGame();
  }

  function drawTree(x, y) {
    ctx.fillStyle = "#70452a";
    ctx.fillRect(x - 3, y + 12, 6, 18);
    ctx.fillStyle = "#2f8f46";
    ctx.beginPath();
    ctx.arc(x, y + 8, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRoad() {
    var move = (frame * 5) % 80;
    ctx.fillStyle = "#173a22";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3d424a";
    ctx.fillRect(90, 0, 500, canvas.height);
    ctx.fillStyle = "#343940";
    ctx.fillRect(105, 0, 470, canvas.height);

    ctx.fillStyle = "#f4f4f4";
    for (var y = -50 + move; y < canvas.height; y += 80) ctx.fillRect(336, y, 8, 42);
    for (var sideY = -40 + move % 40, n = 0; sideY < canvas.height; sideY += 40, n += 1) {
      ctx.fillStyle = n % 2 ? "#fff" : "#dc2638";
      ctx.fillRect(84, sideY, 8, 25);
      ctx.fillRect(590, sideY, 8, 25);
    }
    for (var treeY = -80 + (frame * 2) % 100; treeY < 450; treeY += 100) {
      drawTree(42, treeY);
      drawTree(638, treeY + 45);
    }
  }

  function drawCar(car, skin, isPlayer) {
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.fillRect(car.x + 4, car.y + 6, car.width, car.height);
    if (isPlayer && shield) {
      ctx.strokeStyle = "#62dcff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(car.x + 23, car.y + 35, 42, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#101215";
    ctx.fillRect(car.x - 4, car.y + 10, 5, 18);
    ctx.fillRect(car.x + 45, car.y + 10, 5, 18);
    ctx.fillRect(car.x - 4, car.y + 45, 5, 18);
    ctx.fillRect(car.x + 45, car.y + 45, 5, 18);
    ctx.fillStyle = skin.color;
    ctx.fillRect(car.x, car.y + 5, 46, 60);
    ctx.fillRect(car.x + 5, car.y, 36, 70);
    ctx.fillStyle = skin.stripe;
    ctx.fillRect(car.x + 20, car.y + 2, 6, 66);
    ctx.fillStyle = "#bfe6ff";
    ctx.fillRect(car.x + 8, car.y + 12, 30, 17);
    ctx.fillStyle = "#6c8799";
    ctx.fillRect(car.x + 8, car.y + 35, 30, 13);
  }

  function drawCoin(item) {
    ctx.fillStyle = "#f7c948";
    ctx.beginPath();
    ctx.arc(item.x + 12, item.y + 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5b4300";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("C", item.x + 12, item.y + 17);
  }

  function drawPower(item) {
    ctx.fillStyle = item.type === "shield" ? "#35bce8" : "#9b59d0";
    ctx.beginPath();
    ctx.arc(item.x + 15, item.y + 15, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.type === "shield" ? "S" : "2x", item.x + 15, item.y + 19);
  }

  function roadX(width) {
    return 115 + Math.floor(Math.random() * (450 - width));
  }

  function addObstacle() {
    obstacles.push({
      x: Math.random() < 0.5 ? 205 : 430, y: -80, width: 46, height: 70,
      speed: 4 + Math.min(score / 500, 4),
      skin: { color: ["#f2b134", "#3498db", "#eceff1"][Math.floor(Math.random() * 3)], stripe: "#fff" }
    });
  }

  function addCoin() {
    coins.push({ x: roadX(24), y: -30, width: 24, height: 24 });
  }

  function addPower() {
    powers.push({ x: roadX(30), y: -35, width: 30, height: 30, type: Math.random() < 0.5 ? "shield" : "double" });
  }

  function touches(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  function updatePowerLabel() {
    var text = [];
    if (shield) text.push("Schild");
    if (doubleUntil > frame) text.push("2× coins");
    powerLabel.textContent = text.length ? text.join(" + ") : "Geen";
  }

  function message(text) {
    ctx.fillStyle = "rgba(0,0,0,.62)";
    ctx.fillRect(90, 0, 500, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 340, 190);
    ctx.font = "16px Arial";
    ctx.fillText("Pak coins, schilden en 2× power-ups", 340, 222);
  }

  function drawGame() {
    drawRoad();
    obstacles.forEach(function (item) { drawCar(item, item.skin, false); });
    coins.forEach(drawCoin);
    powers.forEach(drawPower);
    drawCar(player, selected, true);
    if (!running) message(frame ? "Botsing! Klik op Opnieuw" : "Klik op Start");
  }

  function saveBest() {
    if (score <= best) return;
    best = score;
    bestLabel.textContent = best;
    TCD.storage.set("game_best", best);
    garageMessage.textContent = "Nieuw record: " + best.toLocaleString("nl-NL") + ".";
    updateGarage();
  }

  function stopGame() {
    running = false;
    statusLabel.textContent = "Botsing";
    saveBest();
  }

  function startGame() {
    if (running) saveBest();
    player.x = 310;
    obstacles = [];
    coins = [];
    powers = [];
    score = 0;
    frame = 0;
    lastTime = 0;
    shield = false;
    doubleUntil = 0;
    running = true;
    scoreLabel.textContent = "0";
    statusLabel.textContent = "Rijdend";
    startButton.textContent = "Opnieuw";
    updatePowerLabel();
    if (!animationId) animationId = requestAnimationFrame(gameLoop);
  }

  function movePlayer(direction) {
    if (!running) return;
    player.x += direction * 55;
    player.x = Math.max(105, Math.min(player.x, 529));
  }

  function moveItems() {
    obstacles.forEach(function (item) {
      item.y += item.speed;
      if (touches(player, item)) {
        if (shield) { shield = false; item.done = true; updatePowerLabel(); }
        else stopGame();
      }
    });
    coins.forEach(function (item) {
      item.y += 3.7;
      if (touches(player, item)) {
        item.done = true;
        wallet += doubleUntil > frame ? 2 : 1;
        TCD.storage.set("game_coins", wallet);
        updateCoins();
      }
    });
    powers.forEach(function (item) {
      item.y += 3.2;
      if (touches(player, item)) {
        item.done = true;
        if (item.type === "shield") shield = true;
        else doubleUntil = frame + 360;
        updatePowerLabel();
      }
    });
    obstacles = obstacles.filter(function (item) { return !item.done && item.y < 480; });
    coins = coins.filter(function (item) { return !item.done && item.y < 430; });
    powers = powers.filter(function (item) { return !item.done && item.y < 435; });
  }

  function gameLoop(time) {
    animationId = 0;
    if (!running) { drawGame(); return; }
    if (lastTime && time - lastTime < 16) { animationId = requestAnimationFrame(gameLoop); return; }
    lastTime = time;
    frame += 1;
    if (frame % 70 === 0) addObstacle();
    if (frame % 85 === 0) addCoin();
    if (frame % 520 === 0) addPower();
    if (doubleUntil && frame >= doubleUntil) { doubleUntil = 0; updatePowerLabel(); }
    moveItems();
    if (running && frame % 8 === 0) { score += 1; scoreLabel.textContent = score; }
    drawGame();
    if (running) animationId = requestAnimationFrame(gameLoop);
  }

  selected = findSkin(selectedId);
  if (!selected || !available(selected)) { selected = skins[0]; selectedId = "red"; }
  bestLabel.textContent = best;
  updateCoins();
  renderGarage();
  updatePowerLabel();
  drawGame();

  startButton.addEventListener("click", startGame);
  document.querySelectorAll("[data-game-move]").forEach(function (button) {
    button.addEventListener("click", function () { movePlayer(Number(button.getAttribute("data-game-move"))); });
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); movePlayer(-1); }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); movePlayer(1); }
    if (event.key === " " && !running) { event.preventDefault(); startGame(); }
  });
}
