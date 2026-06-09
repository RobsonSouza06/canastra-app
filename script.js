let players = [];
let rounds = [];
let scores = [];

// adicionar dupla
function addPlayer() {
  const name = document.getElementById("name").value;
  if (!name) return;

  if (players.length >= 2) {
    alert("Máximo de 2 duplas");
    return;
  }

  players.push(name);
  document.getElementById("name").value = "";

  renderRoundInputs();
  renderScoreBoard();
}

// inputs rodada
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
  const target = parseInt(document.getElementById("target").value);

  let round = [];

  players.forEach((p, i) => {
    const val = parseInt(document.getElementById("p" + i).value) || 0;
    round.push(val);
  });

  rounds.push(round);

  recalculateScores();
  renderRounds();
  checkWinner(target);
}

// recalcular
function recalculateScores() {
  scores = players.map(() => 0);

  rounds.forEach(round => {
    round.forEach((val, i) => {
      scores[i] += val;
    });
  });

  renderScoreBoard();
}

// 🔥 placar visual
function renderScoreBoard() {
  const div = document.getElementById("scoreBoard");
  div.innerHTML = "";

  let maxScore = Math.max(...scores, 0);

  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "score-card";

    if (scores[i] === maxScore && maxScore > 0) {
      card.classList.add("winner");
    }

    card.innerHTML = `
      <h3>${p}</h3>
      <p>${scores[i] || 0}</p>
    `;

    div.appendChild(card);
  });
}

// rodadas
function renderRounds() {
  const list = document.getElementById("rounds");
  list.innerHTML = "";

  rounds.forEach((round, index) => {
    const li = document.createElement("li");

    li.innerText = "Rodada " + (index + 1) + ": " + round.join(" | ");

    const btn = document.createElement("button");
    btn.innerText = "Excluir";
    btn.className = "delete";
    btn.onclick = () => deleteRound(index);

    li.appendChild(btn);

    list.appendChild(li);
  });
}

// deletar
function deleteRound(index) {
  rounds.splice(index, 1);
  recalculateScores();
  renderRounds();
}

// vencedor
function checkWinner(target) {
  if (!target) return;

  const someoneReached = scores.some(s => s >= target);
  if (!someoneReached) return;

  let maxScore = Math.max(...scores);
  let winnerIndex = scores.indexOf(maxScore);

  alert("🏆 Vencedor: " + players[winnerIndex]);
}

// reset
function resetGame() {
  players = [];
  rounds = [];
  scores = [];

  document.getElementById("scoreBoard").innerHTML = "";
  document.getElementById("roundInputs").innerHTML = "";
  document.getElementById("rounds").innerHTML = "";
}