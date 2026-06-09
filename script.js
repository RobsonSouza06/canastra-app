let players = [];
let rounds  = [];
let scores  = [];

const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// ─── INIT ───────────────────────────────────────────────
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("canastra") || "null");
  if (data && data.players && data.players.length > 0) {
    players = data.players;
    rounds  = data.rounds || [];
    const savedTarget = data.target;
    if (savedTarget) document.getElementById("target").value = savedTarget;
    recalculateScores();
    renderRounds();
    toggleSections();
  }
  renderHistory();
  createWinnerModal();
};

// ─── SALVAR ──────────────────────────────────────────────
function saveGame() {
  const target = document.getElementById("target").value;
  localStorage.setItem("canastra", JSON.stringify({ players, rounds, target }));
}

// ─── ADICIONAR DUPLA ─────────────────────────────────────
function addPlayer() {
  const input = document.getElementById("name");
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  if (players.length >= 4) {
    alert("Máximo de 4 jogadores/duplas.");
    return;
  }
  players.push(name);
  input.value = "";
  input.focus();

  renderRoundInputs();
  renderScoreBoard();
  toggleSections();
  saveGame();
}

// Permite pressionar Enter para adicionar
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("name").addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });
});

// ─── TOGGLE SECTIONS ─────────────────────────────────────
function toggleSections() {
  const hasPlayers = players.length > 0;
  document.getElementById("round-section").style.display  = hasPlayers ? "block" : "none";
  document.getElementById("rounds-section").style.display = rounds.length > 0 ? "block" : "none";
}

// ─── INPUTS DE RODADA ────────────────────────────────────
function renderRoundInputs() {
  const div = document.getElementById("roundInputs");
  div.innerHTML = "";
  players.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "round-input-row";
    row.innerHTML = `
      <span class="round-input-label">${escHtml(p)}</span>
      <input type="number" id="p${i}" inputmode="numeric" placeholder="0">
    `;
    div.appendChild(row);
  });
}

// ─── ADICIONAR RODADA ────────────────────────────────────
function addRound() {
  const round = players.map((_, i) => {
    const val = parseInt(document.getElementById("p" + i).value);
    return isNaN(val) ? 0 : val;
  });

  rounds.push(round);
  recalculateScores();
  renderRounds();
  checkWinner();
  toggleSections();
  saveGame();

  // Limpar inputs
  players.forEach((_, i) => {
    document.getElementById("p" + i).value = "";
  });
}

// ─── RECALCULAR TOTAIS ───────────────────────────────────
function recalculateScores() {
  scores = players.map(() => 0);
  rounds.forEach(r => r.forEach((v, i) => scores[i] += v));
  renderScoreBoard();
}

// ─── PLACAR ──────────────────────────────────────────────
function renderScoreBoard() {
  const div = document.getElementById("scoreBoard");
  div.innerHTML = "";
  const max = Math.max(...scores, 0);

  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "score-card" + (scores[i] === max && max > 0 ? " winner" : "");
    card.innerHTML = `<h3>${escHtml(p)}</h3><p>${scores[i] || 0}</p>`;
    div.appendChild(card);
  });
}

// ─── LISTA DE RODADAS ────────────────────────────────────
function renderRounds() {
  const list = document.getElementById("rounds");
  list.innerHTML = "";

  rounds.forEach((r, i) => {
    const li = document.createElement("li");
    const scores_str = players.map((p, j) => `${escHtml(p)}: ${r[j]}`).join("  ·  ");
    li.innerHTML = `
      <span><strong>R${i + 1}</strong>  ${scores_str}</span>
      <button class="btn-delete" onclick="deleteRound(${i})">Excluir</button>
    `;
    list.appendChild(li);
  });

  document.getElementById("rounds-section").style.display = rounds.length > 0 ? "block" : "none";
}

// ─── DELETAR RODADA ──────────────────────────────────────
function deleteRound(i) {
  rounds.splice(i, 1);
  recalculateScores();
  renderRounds();
  saveGame();
}

// ─── VERIFICAR VENCEDOR ──────────────────────────────────
function checkWinner() {
  const target = parseInt(document.getElementById("target").value);
  if (!target) return;
  if (!scores.some(s => s >= target)) return;

  const max    = Math.max(...scores);
  const winner = players[scores.indexOf(max)];

  try { winSound.play(); } catch(e) {}

  saveHistory(winner, max);
  showWinnerModal(winner, max, target);
}

// ─── MODAL VENCEDOR ──────────────────────────────────────
function createWinnerModal() {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "winner-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-trophy">🏆</div>
      <p class="modal-title">Vencedor da partida</p>
      <p class="modal-winner" id="modal-winner-name"></p>
      <p class="modal-score" id="modal-winner-score"></p>
      <button class="btn btn-primary" onclick="closeWinnerModal()">Ver placar final</button>
      <button class="btn btn-reset" onclick="resetGame()">🔄 Nova partida</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showWinnerModal(name, score, target) {
  document.getElementById("modal-winner-name").textContent  = name;
  document.getElementById("modal-winner-score").textContent =
    `${score} pontos — meta era ${target}`;
  document.getElementById("winner-overlay").classList.remove("hidden");
}

function closeWinnerModal() {
  document.getElementById("winner-overlay").classList.add("hidden");
}

// ─── HISTÓRICO ───────────────────────────────────────────
function saveHistory(name, score) {
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.push({ name, score, date: new Date().toLocaleString("pt-BR") });
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

function clearHistory() {
  if (!confirm("Apagar todo o histórico de partidas?")) return;
  localStorage.removeItem("history");
  renderHistory();
}

function renderHistory() {
  const list    = document.getElementById("history");
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  list.innerHTML = "";

  if (history.length === 0) {
    list.innerHTML = '<li class="empty-msg">Nenhuma partida finalizada ainda.</li>';
    return;
  }

  history.slice().reverse().forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escHtml(h.name)}</strong> — ${h.score} pts<br><small>${h.date}</small>`;
    list.appendChild(li);
  });
}

// ─── REINICIAR ───────────────────────────────────────────
function resetGame() {
  if (!confirm("Reiniciar o jogo? O histórico de rodadas será apagado.")) return;

  players = [];
  rounds  = [];
  scores  = [];

  localStorage.removeItem("canastra");

  document.getElementById("scoreBoard").innerHTML  = "";
  document.getElementById("roundInputs").innerHTML = "";
  document.getElementById("rounds").innerHTML      = "";
  document.getElementById("target").value          = "";
  document.getElementById("name").value            = "";

  closeWinnerModal();
  toggleSections();
}

// ─── UTILS ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
