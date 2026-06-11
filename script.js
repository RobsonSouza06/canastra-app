let players = [];
let rounds  = [];
let scores  = [];
let gameStarted = false;
 
const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
 
// ─── INIT ────────────────────────────────────────────────
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("canastra") || "null");
  if (data && data.players && data.players.length > 0) {
    players = data.players;
    rounds  = data.rounds || [];
    gameStarted = data.gameStarted || false;
    if (data.target) document.getElementById("target").value = data.target;
    recalculateScores();
    renderRounds();
    if (gameStarted) {
      showGameSection();
    } else {
      showSetupSection();
      renderScoreBoardSetup();
      toggleBtnJogar();
    }
  }
  renderHistory();
  createWinnerModal();
};
 
// ─── SALVAR ──────────────────────────────────────────────
function saveGame() {
  const target = document.getElementById("target").value;
  localStorage.setItem("canastra", JSON.stringify({ players, rounds, target, gameStarted }));
}
 
// ─── ADICIONAR JOGADOR ───────────────────────────────────
function addPlayer() {
  const input = document.getElementById("name");
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  if (players.length >= 8) { alert("Máximo de 8 jogadores/duplas."); return; }
  players.push(name);
  input.value = "";
  input.focus();
  renderScoreBoardSetup();
  toggleBtnJogar();
  saveGame();
}
 
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("name").addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });
});
 
// Mostra botão Jogar quando tiver pelo menos 2 jogadores e pontuação preenchida
function toggleBtnJogar() {
  const target = document.getElementById("target").value;
  const show = players.length >= 2 && target;
  document.getElementById("btn-jogar-section").style.display = show ? "block" : "none";
 
  // Também observa mudança no campo target
  document.getElementById("target").oninput = () => {
    const t = document.getElementById("target").value;
    document.getElementById("btn-jogar-section").style.display =
      (players.length >= 2 && t) ? "block" : "none";
  };
}
 
// Placar no setup (sem pontuação, só nomes)
function renderScoreBoardSetup() {
  const div = document.getElementById("scoreBoard-setup");
  div.innerHTML = "";
  players.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "score-card";
    card.innerHTML = `
      <h3>${escHtml(p)}</h3>
      <button class="btn-remove" onclick="removePlayer(${i})">✕</button>
    `;
    div.appendChild(card);
  });
}
 
function removePlayer(i) {
  players.splice(i, 1);
  renderScoreBoardSetup();
  toggleBtnJogar();
  saveGame();
}
 
// ─── INICIAR JOGO ────────────────────────────────────────
function startGame() {
  const target = document.getElementById("target").value;
  if (!target) { alert("Preencha a pontuação para vencer."); return; }
  if (players.length < 2) { alert("Adicione pelo menos 2 jogadores."); return; }
  gameStarted = true;
  saveGame();
  showGameSection();
}
 
function showGameSection() {
  document.getElementById("setup-section").style.display = "none";
  document.getElementById("game-section").style.display  = "block";
  renderScoreBoard();
  renderRounds();
}
 
function showSetupSection() {
  document.getElementById("setup-section").style.display = "block";
  document.getElementById("game-section").style.display  = "none";
}
 
// ─── MODAL DE RODADA ─────────────────────────────────────
function openRoundModal() {
  const container = document.getElementById("round-modal-inputs");
  container.innerHTML = "";
 
  players.forEach((p, i) => {
    const block = document.createElement("div");
    block.className = "round-player-block";
    block.innerHTML = `
      <p class="round-player-name">${escHtml(p)}</p>
      <div class="round-fields">
        <div class="round-field">
          <label>Saída</label>
          <input type="number" id="saida_${i}" inputmode="numeric" placeholder="0">
        </div>
        <div class="round-field-sep">+</div>
        <div class="round-field">
          <label>Cartas</label>
          <input type="number" id="cartas_${i}" inputmode="numeric" placeholder="0">
        </div>
        <div class="round-field-sep">=</div>
        <div class="round-field round-field-total">
          <label>Total</label>
          <span class="round-total-val" id="total_${i}">0</span>
        </div>
      </div>
    `;
    container.appendChild(block);
    ["saida", "cartas"].forEach(tipo => {
      document.getElementById(`${tipo}_${i}`).addEventListener("input", () => updateTotal(i));
    });
  });
 
  document.getElementById("round-modal-title").textContent = `Rodada ${rounds.length + 1}`;
  document.getElementById("round-overlay").classList.remove("hidden");
 
  setTimeout(() => {
    const first = document.getElementById("saida_0");
    if (first) { first.focus(); first.select(); }
  }, 150);
}
 
function updateTotal(i) {
  const saida  = parseInt(document.getElementById(`saida_${i}`).value)  || 0;
  const cartas = parseInt(document.getElementById(`cartas_${i}`).value) || 0;
  document.getElementById(`total_${i}`).textContent = saida + cartas;
}
 
function closeRoundModal() {
  document.getElementById("round-overlay").classList.add("hidden");
}
 
function confirmarRodada() {
  const round = players.map((_, i) => {
    const saida  = parseInt(document.getElementById(`saida_${i}`).value)  || 0;
    const cartas = parseInt(document.getElementById(`cartas_${i}`).value) || 0;
    return saida + cartas;
  });
  rounds.push(round);
  closeRoundModal();
  recalculateScores();
  renderRounds();
  checkWinner();
  saveGame();
}
 
// ─── TOTAIS ──────────────────────────────────────────────
function recalculateScores() {
  scores = players.map(() => 0);
  rounds.forEach(r => r.forEach((v, i) => scores[i] += v));
  renderScoreBoard();
}
 
// ─── PLACAR ──────────────────────────────────────────────
function renderScoreBoard() {
  const div = document.getElementById("scoreBoard");
  if (!div) return;
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
  if (!list) return;
  list.innerHTML = "";
  rounds.forEach((r, i) => {
    const li = document.createElement("li");
    const str = players.map((p, j) => `${escHtml(p)}: ${r[j]}`).join("  ·  ");
    li.innerHTML = `<span><strong>R${i+1}</strong>  ${str}</span>
      <button class="btn-delete" onclick="deleteRound(${i})">Excluir</button>`;
    list.appendChild(li);
  });
  const sec = document.getElementById("rounds-section");
  if (sec) sec.style.display = rounds.length > 0 ? "block" : "none";
}
 
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
      <div class="modal-divider"></div>
      <button class="btn btn-primary" id="btn-rematch-same" onclick="rematchSameScore()">🔁 Mesmas duplas, jogar até 0</button>
      <button class="btn btn-warning" onclick="rematchNewScore()">🎯 Mesmas duplas, alterar meta de pontos</button>
      <button class="btn btn-new-players" onclick="newPlayersGame()">👥 Novos jogadores</button>
      <button class="btn btn-ghost" onclick="verPlacar()">👁 Ver placar final</button>
    </div>
  `;
  document.body.appendChild(overlay);
}
 
function showWinnerModal(name, score, target) {
  document.getElementById("modal-winner-name").textContent  = name;
  document.getElementById("modal-winner-score").textContent = `${score} pontos — meta era ${target}`;
  // Atualiza botão com a meta da partida
  const btn = document.getElementById("btn-rematch-same");
  if (btn) btn.textContent = `🔁 Mesmas duplas, jogar até ${target}`;
  document.getElementById("winner-overlay").classList.remove("hidden");
}
 
function fecharModal() {
  const el = document.getElementById("winner-overlay");
  if (el) el.classList.add("hidden");
}
 
function verPlacar() {
  fecharModal();
  document.getElementById("postgame-section").style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
 
// ─── REMATCH MESMA PONTUAÇÃO ─────────────────────────────
function rematchSameScore() {
  fecharModal();
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  rounds = [];
  scores = players.map(() => 0);
  gameStarted = true;
  saveGame();
  renderScoreBoard();
  renderRounds();
}
 
// ─── REMATCH PONTUAÇÃO DIFERENTE ─────────────────────────
function rematchNewScore() {
  fecharModal();
  document.getElementById("postgame-section").style.display = "block";
  document.getElementById("new-score-section").style.display = "block";
  document.getElementById("new-target").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
 
function rematchWithNewScore() {
  const newTarget = document.getElementById("new-target").value;
  if (!newTarget) { alert("Preencha a nova pontuação."); return; }
  document.getElementById("target").value = newTarget;
  document.getElementById("new-target").value = "";
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  rounds = [];
  scores = players.map(() => 0);
  gameStarted = true;
  saveGame();
  renderScoreBoard();
  renderRounds();
}
 
// ─── NOVOS JOGADORES ─────────────────────────────────────
function newPlayersGame() {
  fecharModal();
  players = [];
  rounds  = [];
  scores  = [];
  gameStarted = false;
  localStorage.removeItem("canastra");
  document.getElementById("target").value = "";
  document.getElementById("name").value   = "";
  document.getElementById("scoreBoard-setup").innerHTML = "";
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  showSetupSection();
  toggleBtnJogar();
}
 
// ─── REINICIAR ───────────────────────────────────────────
function resetGame() {
  if (!confirm("Reiniciar o jogo? Tudo será apagado.")) return;
  fecharModal();
  players = [];
  rounds  = [];
  scores  = [];
  gameStarted = false;
  localStorage.removeItem("canastra");
  document.getElementById("target").value = "";
  document.getElementById("name").value   = "";
  document.getElementById("scoreBoard-setup").innerHTML = "";
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  showSetupSection();
  toggleBtnJogar();
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
 
// ─── UTILS ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}