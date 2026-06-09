let players = [];
let rounds = [];
let scores = [];

const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// carregar dados
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("canastra"));
  if (data) {
    players = data.players;
    rounds = data.rounds;
    recalculateScores();
    renderRounds();
  }
  renderHistory();
};

// salvar
function saveGame() {
  localStorage.setItem("canastra", JSON.stringify({ players, rounds }));
}

// adicionar dupla
function addPlayer() {
  const name = document.getElementById("name").value;
  if (!name || players.length >= 2) return;

  players.push(name);
  document.getElementById("name").value = "";

  renderRoundInputs();
  renderScoreBoard();
  saveGame();
}

// inputs
function renderRoundInputs() {
  const div = document.getElementById("roundInputs");
  div.innerHTML = "";

  players.forEach((p, i) => {
    const input = document.createElement("input");
    input.placeholder = p;
    input.type = "number";
    input.id = "p" + i;
    div.appendChild(input);
  });
}

// adicionar rodada
function addRound() {
  let round = [];

  players.forEach((p, i) => {
    const val = parseInt(document.getElementById("p" + i).value) || 0;
    round.push(val);
  });

  rounds.push(round);

  recalculateScores();
  renderRounds();
  checkWinner();
  saveGame();
}

// recalcular
function recalculateScores() {
  scores = players.map(() => 0);

  rounds.forEach(r => {
    r.forEach((v, i) => scores[i] += v);
  });

  renderScoreBoard();
}

// placar
function renderScoreBoard() {
  const div = document.getElementById("scoreBoard");
  div.innerHTML = "";

  let max = Math.max(...scores, 0);

  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "score-card";

    if (scores[i] === max && max > 0) {
      card.classList.add("winner");
    }

    card.innerHTML = `<h3>${p}</h3><p>${scores[i] || 0}</p>`;
    div.appendChild(card);
  });
}

// rodadas
function renderRounds() {
  const list = document.getElementById("rounds");
  list.innerHTML = "";

  rounds.forEach((r, i) => {
    const li = document.createElement("li");
    li.innerText = "Rodada " + (i + 1) + ": " + r.join(" | ");

    const btn = document.createElement("button");
    btn.innerText = "Excluir";
    btn.onclick = () => deleteRound(i);

    li.appendChild(btn);
    list.appendChild(li);
  });
}

// deletar
function deleteRound(i) {
  rounds.splice(i, 1);
  recalculateScores();
  renderRounds();
  saveGame();
}

// vencedor
function checkWinner() {
  const target = parseInt(document.getElementById("target").value);
  if (!target) return;

  if (scores.some(s => s >= target)) {
    let max = Math.max(...scores);
    let winner = players[scores.indexOf(max)];

    winSound.play();
    saveHistory(winner, max);

    alert("🏆 " + winner + " venceu!");
  }
}

// histórico
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

// reset
function resetGame() {
  players = [];
  rounds = [];
  scores = [];

  localStorage.removeItem("canastra");

  document.getElementById("scoreBoard").innerHTML = "";
  document.getElementById("roundInputs").innerHTML = "";
  document.getElementById("rounds").innerHTML = "";
}