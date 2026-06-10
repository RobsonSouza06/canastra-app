let players = [];
let rounds = [];
let scores = [];

// Adicionar jogador
function addPlayer() {
  const name = document.getElementById("name").value;
  if (!name) return;

  players.push(name);

  document.getElementById("name").value = "";
  renderPlayers();
}

// Mostrar jogadores
function renderPlayers() {
  const list = document.getElementById("players");
  list.innerHTML = "";

  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = p + " (" + (scores[i] || 0) + " pts)";
    list.appendChild(li);
  });

  renderRoundInputs();
}

// Inputs da rodada
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

// Adicionar rodada
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

// Recalcular pontuação
function recalculateScores() {
  scores = players.map(() => 0);

  rounds.forEach(round => {
    round.forEach((val, i) => {
      scores[i] += val;
    });
  });

  renderPlayers();
  renderScore();
}

// Mostrar placar
function renderScore() {
  const list = document.getElementById("score");
  list.innerHTML = "";

  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerText = p + ": " + scores[i];
    list.appendChild(li);
  });
}

// Mostrar rodadas
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

// Deletar rodada
function deleteRound(index) {
  rounds.splice(index, 1);
  recalculateScores();
  renderRounds();
}

// Verificar vencedor
function checkWinner(target) {
  if (!target) return;

  const someoneReached = scores.some(score => score >= target);
  if (!someoneReached) return;

  let maxScore = Math.max(...scores);
  let winnerIndex = scores.indexOf(maxScore);

  alert("🏆 Vencedor: " + players[winnerIndex] + " com " + maxScore + " pontos!");
}

// Resetar jogo
function resetGame() {
  players = [];
  rounds = [];
  scores = [];

  document.getElementById("players").innerHTML = "";
  document.getElementById("roundInputs").innerHTML = "";
  document.getElementById("score").innerHTML = "";
  document.getElementById("rounds").innerHTML = "";
}
