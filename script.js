let players = [];
let rounds = [];
let scores = [];
let currentRoundData = [];
let currentPlayerIndexForDetails = 0;

const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

window.onload = () => {
  const data = JSON.parse(localStorage.getItem("canastra"));
  if (data) {
    players = data.players;
    rounds = data.rounds;
    if (players.length > 0) {
      document.getElementById("setupCard").style.display = "none";
      document.getElementById("gamePanel").style.display = "block";
      recalculateScores();
      renderRounds();
    }
  }
  renderHistory();
};

function saveGame() {
  localStorage.setItem("canastra", JSON.stringify({ players, rounds }));
}

function addPlayer() {
  const name = document.getElementById("name").value.trim();
  if (!name || players.length >= 2) return;

  players.push(name);
  document.getElementById("name").value = "";

  renderPlayersList();
  if (players.length === 2) {
    document.getElementById("startGameBtn").style.display = "block";
  }
}

function renderPlayersList() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";
  players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p;
    list.appendChild(li);
  });
}

function startGame() {
  if (players.length < 2) return;
  document.getElementById("setupCard").style.display = "none";
  document.getElementById("gamePanel").style.display = "block";
  recalculateScores();
  saveGame();
}

function openRoundModal() {
  currentRoundData = players.map(() => 0);
  renderRoundInputs();
  document.getElementById("roundModal").style.display = "flex";
}

function closeRoundModal() {
  document.getElementById("roundModal").style.display = "none";
}

function renderRoundInputs() {
  const div = document.getElementById("roundInputs");
  div.innerHTML = "";
  players.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.innerText = `Definir pontos de: ${p}`;
    btn.style.margin = "8px 0";
    btn.onclick = () => openDetailsModal(i);
    div.appendChild(btn);
  });
}

function openDetailsModal(playerIndex) {
  currentPlayerIndexForDetails = playerIndex;
  document.getElementById("detailsTitle").innerText = `Pontos de ${players[playerIndex]}`;
  
  document.getElementById("limpa").value = 0;
  document.getElementById("suja").value = 0;
  document.getElementById("real").value = 0;
  document.getElementById("meioReal").value = 0;
  document.getElementById("bate").value = 0;
  document.getElementById("corrido").value = 0;

  document.getElementById("detailsModal").style.display = "flex";
}

function savePlayerDetails() {
  const limpa = (parseInt(document.getElementById("limpa").value) || 0) * 200;
  const suja = (parseInt(document.getElementById("suja").value) || 0) * 100;
  const real = (parseInt(document.getElementById("real").value) || 0) * 500;
  const meioReal = (parseInt(document.getElementById("meioReal").value) || 0) * 300;
  const bate = (parseInt(document.getElementById("bate").value) || 0) * 100;
  const corrido = parseInt(document.getElementById("corrido").value) || 0;

  const total = limpa + suja + real + meioReal + bate + corrido;
  currentRoundData[currentPlayerIndexForDetails] = total;

  document.getElementById("detailsModal").style.display = "none";
}

function addRound() {
  rounds.push([...currentRoundData]);
  closeRoundModal();
  recalculateScores();
  renderRounds();
  checkWinner();
  saveGame();
}

function recalculateScores() {
  scores = players.map(() => 0);
  rounds.forEach(r => {
    r.forEach((v, i) => {
      if (scores[i] !== undefined) scores[i] += v;
    });
  });
  renderScoreBoard();
}

function renderScoreBoard() {
  const div = document.getElementById("scoreBoard");
  div.innerHTML = "";
  let max = Math.max(...scores, 0);

  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "score-card";
    if (scores[i] === max && max > 0) card.classList.add("winner");
    card.innerHTML = `<h3>${p}</h3><p>${scores[i] || 0}</p>`;
    div.appendChild(card);
  });
}

function renderRounds() {
  const list = document.getElementById("rounds");
  list.innerHTML = "";
  rounds.forEach((r, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.innerText = `Rodada ${i + 1}: ` + r.map((v, idx) => `${players[idx]}: ${v}`).join(" | ");
    li.appendChild(span);

    const btn = document.createElement("button");
    btn.innerText = "Excluir";
    btn.className = "delete";
    btn.onclick = () => deleteRound(i);
    li.appendChild(btn);
    list.appendChild(li);
  });
}

function deleteRound(i) {
  rounds.splice(i, 1);
  recalculateScores();
  renderRounds();
  saveGame();
}

function checkWinner() {
  const target = parseInt(document.getElementById("target").value);
  if (!target) return;

  if (scores.some(s => s >= target)) {
    let max = Math.max(...scores);
    let winner = players[scores.indexOf(max)];
    try { winSound.play(); } catch(e){}
    saveHistory(winner, max);
    alert(`🏆 ${winner} venceu a partida com ${max} pontos!`);
  }
}

function saveHistory(name, score) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.push({ name, score, date: new Date().toLocaleString() });
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("history");
  list.innerHTML = "";
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.innerText = `${h.name} - ${h.score} pts (${h.date})`;
    list.appendChild(li);
  });
}

function resetGame() {
  players = [];
  rounds = [];
  scores = [];
  localStorage.removeItem("canastra");
  document.getElementById("scoreBoard").innerHTML = "";
  document.getElementById("rounds").innerHTML = "";
  document.getElementById("playersList").innerHTML = "";
  document.getElementById("startGameBtn").style.display = "none";
  document.getElementById("setupCard").style.display = "block";
  document.getElementById("gamePanel").style.display = "none";
}