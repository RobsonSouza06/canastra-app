// ─── FIREBASE CONFIG ─────────────────────────────────────
const FIREBASE_URL = "https://canastra-score-default-rtdb.firebaseio.com";

// ─── DUPLAS DEFAULT ──────────────────────────────────────
const DEFAULT_TEAMS = ["Jango/Rosane", "Robson/Jenny"];

// ─── ESTADO DO JOGO ──────────────────────────────────────
let players     = [];
let rounds      = [];
let scores      = [];
let gameStarted = false;

const winSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// ─── FIREBASE HELPERS ────────────────────────────────────
async function fbGet(path) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`);
    return await res.json();
  } catch (e) { return null; }
}

async function fbPush(path, data) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) { return null; }
}

async function fbDelete(path) {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, { method: "DELETE" });
    return true;
  } catch (e) { return false; }
}

async function fbSet(path, data) {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return true;
  } catch (e) { return false; }
}

// ─── INIT ────────────────────────────────────────────────
window.onload = () => {
  const data = JSON.parse(localStorage.getItem("canastra") || "null");
  if (data && data.players && data.players.length > 0) {
    players     = data.players;
    rounds      = data.rounds || [];
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
  } else {
    renderDefaultTeams();
  }
  renderHistory();
  createWinnerModal();
  createHistoryModal();
  createAdminModal();
};

// ─── DUPLAS DEFAULT ──────────────────────────────────────
function renderDefaultTeams() {
  const div = document.getElementById("default-teams");
  if (!div) return;
  div.innerHTML = "";

  const label = document.createElement("p");
  label.className = "card-label";
  label.textContent = "Duplas rápidas";
  div.appendChild(label);

  const grid = document.createElement("div");
  grid.className = "default-teams-grid";

  DEFAULT_TEAMS.forEach(team => {
    const btn = document.createElement("button");
    btn.className = "btn-default-team";
    btn.textContent = team;
    btn.onclick = () => addDefaultTeam(team, btn);
    grid.appendChild(btn);
  });

  div.appendChild(grid);
}

function addDefaultTeam(name, btn) {
  if (players.includes(name)) {
    // Remove se já estiver
    players.splice(players.indexOf(name), 1);
    btn.classList.remove("selected");
  } else {
    if (players.length >= 8) { alert("Máximo de 8 duplas."); return; }
    players.push(name);
    btn.classList.add("selected");
  }
  renderScoreBoardSetup();
  toggleBtnJogar();
  saveGame();
}

// ─── SALVAR LOCAL ────────────────────────────────────────
function saveGame() {
  const target = document.getElementById("target").value;
  localStorage.setItem("canastra", JSON.stringify({ players, rounds, target, gameStarted }));
}

// ─── ADICIONAR JOGADOR MANUAL ────────────────────────────
function addPlayer() {
  const input = document.getElementById("name");
  const name  = input.value.trim();
  if (!name) { input.focus(); return; }
  if (players.length >= 8) { alert("Máximo de 8 jogadores/duplas."); return; }
  if (players.includes(name)) { alert("Essa dupla já foi adicionada."); return; }
  players.push(name);
  input.value = "";
  input.focus();
  renderScoreBoardSetup();
  toggleBtnJogar();
  saveGame();
  // Atualiza visual dos botões default
  syncDefaultButtons();
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("name").addEventListener("keydown", e => {
    if (e.key === "Enter") addPlayer();
  });
});

function syncDefaultButtons() {
  document.querySelectorAll(".btn-default-team").forEach(btn => {
    btn.classList.toggle("selected", players.includes(btn.textContent));
  });
}

function toggleBtnJogar() {
  const target = document.getElementById("target").value;
  const show   = players.length >= 2 && target;
  document.getElementById("btn-jogar-section").style.display = show ? "block" : "none";
  document.getElementById("target").oninput = () => {
    const t = document.getElementById("target").value;
    document.getElementById("btn-jogar-section").style.display =
      (players.length >= 2 && t) ? "block" : "none";
  };
}

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
  syncDefaultButtons();
}

function removePlayer(i) {
  players.splice(i, 1);
  renderScoreBoardSetup();
  toggleBtnJogar();
  saveGame();
  syncDefaultButtons();
}

// ─── INICIAR JOGO ────────────────────────────────────────
function startGame() {
  const target = document.getElementById("target").value;
  if (!target) { alert("Preencha a pontuação para vencer."); return; }
  if (players.length < 2) { alert("Adicione pelo menos 2 duplas."); return; }
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
    const li  = document.createElement("li");
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
  const loser  = players.find((_, i) => scores[i] !== max) || "";
  try { winSound.play(); } catch(e) {}
  saveHistory(winner, loser, max, target);
  showWinnerModal(winner, max, target);
}

// ─── HISTÓRICO FIREBASE ──────────────────────────────────
async function saveHistory(winner, loser, score, target) {
  const entry = {
    winner,
    loser,
    score,
    target,
    players: [...players],
    scores:  [...scores],
    date: new Date().toLocaleString("pt-BR"),
    ts:   Date.now()
  };
  // Salva no Firebase
  await fbPush("partidas", entry);
  // Salva local como cache
  const local = JSON.parse(localStorage.getItem("history") || "[]");
  local.push(entry);
  localStorage.setItem("history", JSON.stringify(local));
  renderHistory();
}

async function loadHistoryFromFirebase() {
  const data = await fbGet("partidas");
  if (!data) return [];
  return Object.entries(data).map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

function renderHistory() {
  const list    = document.getElementById("history");
  const history = JSON.parse(localStorage.getItem("history") || "[]");
  list.innerHTML = "";
  if (history.length === 0) {
    list.innerHTML = '<li class="empty-msg">Nenhuma partida finalizada ainda.</li>';
    return;
  }
  history.slice().reverse().slice(0, 5).forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${escHtml(h.winner)}</strong> venceu — ${h.score} pts<br><small>${h.date}</small>`;
    list.appendChild(li);
  });
}

async function clearHistory() {
  if (!confirm("Apagar todo o histórico de partidas? Isso também apagará do Firebase.")) return;
  await fbDelete("partidas");
  localStorage.removeItem("history");
  renderHistory();
  closeAdminModal();
}

// ─── MODAL HISTÓRICO DETALHADO ───────────────────────────
function createHistoryModal() {
  if (document.getElementById("history-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "history-overlay";
  overlay.innerHTML = `
    <div class="modal modal-history">
      <p class="modal-title" style="font-size:18px;font-weight:700;color:#f8fafc;margin-bottom:4px">📊 Histórico de Partidas</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:16px">Selecione as duas duplas para ver o confronto</p>

      <!-- SELEÇÃO DE DUPLAS -->
      <div class="confronto-selects">
        <div class="confronto-select-wrap">
          <p class="card-label" style="margin-bottom:6px">Dupla 1</p>
          <select id="filter-team1" class="history-select">
            <option value="">Selecionar...</option>
          </select>
        </div>
        <div class="confronto-vs">VS</div>
        <div class="confronto-select-wrap">
          <p class="card-label" style="margin-bottom:6px">Dupla 2</p>
          <select id="filter-team2" class="history-select">
            <option value="">Selecionar...</option>
          </select>
        </div>
      </div>

      <!-- PLACAR DO CONFRONTO -->
      <div id="history-confronto" class="history-confronto" style="display:none"></div>

      <!-- RANKING GERAL (quando nenhuma dupla selecionada) -->
      <div id="history-ranking-geral"></div>

      <!-- LISTA DE PARTIDAS -->
      <div id="history-modal-list" class="history-modal-list"></div>

      <div class="modal-divider" style="margin-top:12px"></div>
      <button class="btn btn-ghost" onclick="closeHistoryModal()" style="margin-top:8px">Fechar</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("filter-team1").addEventListener("change", renderHistoryModal);
  document.getElementById("filter-team2").addEventListener("change", renderHistoryModal);
}

async function openHistoryModal() {
  const overlay = document.getElementById("history-overlay");
  overlay.classList.remove("hidden");

  // Loading
  document.getElementById("history-ranking-geral").innerHTML =
    '<p style="font-size:13px;color:#64748b;text-align:center;padding:16px 0">Carregando...</p>';

  const partidas = await loadHistoryFromFirebase();

  // Monta lista de duplas únicas
  const teams = new Set();
  partidas.forEach(p => {
    if (p.players) p.players.forEach(t => teams.add(t));
    else { if (p.winner) teams.add(p.winner); if (p.loser) teams.add(p.loser); }
  });
  DEFAULT_TEAMS.forEach(t => teams.add(t));

  const teamsSorted = [...teams].sort();

  ["filter-team1", "filter-team2"].forEach(selId => {
    const sel = document.getElementById(selId);
    const cur = sel.value;
    sel.innerHTML = '<option value="">Selecionar...</option>';
    teamsSorted.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t; opt.textContent = t;
      if (t === cur) opt.selected = true;
      sel.appendChild(opt);
    });
  });

  // Pré-seleciona as duplas default se existirem
  if (!document.getElementById("filter-team1").value && DEFAULT_TEAMS[0]) {
    document.getElementById("filter-team1").value = DEFAULT_TEAMS[0];
  }
  if (!document.getElementById("filter-team2").value && DEFAULT_TEAMS[1]) {
    document.getElementById("filter-team2").value = DEFAULT_TEAMS[1];
  }

  window._partidas = partidas;
  renderHistoryModal();
}

function renderHistoryModal() {
  const partidas = window._partidas || [];
  const team1    = document.getElementById("filter-team1").value;
  const team2    = document.getElementById("filter-team2").value;

  const confrontoDiv = document.getElementById("history-confronto");
  const rankingDiv   = document.getElementById("history-ranking-geral");
  const listDiv      = document.getElementById("history-modal-list");

  // ── MODO CONFRONTO: as duas duplas selecionadas ──────────
  if (team1 && team2 && team1 !== team2) {
    confrontoDiv.style.display = "block";
    rankingDiv.innerHTML = "";

    // Partidas onde as DUAS duplas estavam presentes
    const confrontos = partidas.filter(p => {
      if (!p.players) return (p.winner === team1 || p.loser === team1) &&
                             (p.winner === team2 || p.loser === team2);
      return p.players.includes(team1) && p.players.includes(team2);
    });

    const wins1  = confrontos.filter(p => p.winner === team1).length;
    const wins2  = confrontos.filter(p => p.winner === team2).length;
    const total  = confrontos.length;
    const lider  = wins1 > wins2 ? team1 : wins2 > wins1 ? team2 : null;

    confrontoDiv.innerHTML = `
      <!-- PLACAR GRANDE -->
      <div class="confronto-placar">
        <div class="confronto-time ${wins1 >= wins2 ? 'confronto-lider' : ''}">
          <div class="confronto-nome">${escHtml(team1)}</div>
          <div class="confronto-pts">${wins1}</div>
          <div class="confronto-label">vitórias</div>
        </div>
        <div class="confronto-x">×</div>
        <div class="confronto-time ${wins2 >= wins1 ? 'confronto-lider' : ''}">
          <div class="confronto-nome">${escHtml(team2)}</div>
          <div class="confronto-pts">${wins2}</div>
          <div class="confronto-label">vitórias</div>
        </div>
      </div>

      <!-- BARRA DE PROGRESSO -->
      ${total > 0 ? `
      <div class="confronto-barra-wrap">
        <div class="confronto-barra">
          <div class="confronto-barra-fill" style="width:${Math.round(wins1/total*100)}%"></div>
        </div>
        <div class="confronto-barra-labels">
          <span style="color:#22c55e">${Math.round(wins1/total*100)}%</span>
          <span style="color:#64748b">${total} partidas</span>
          <span style="color:#3b82f6">${Math.round(wins2/total*100)}%</span>
        </div>
      </div>` : ""}

      <!-- LÍDER -->
      ${lider ? `<div class="confronto-lider-badge">🏆 ${escHtml(lider)} está na frente!</div>` :
        total > 0 ? `<div class="confronto-lider-badge" style="background:#334155;color:#94a3b8">🤝 Empate técnico!</div>` : ""}
    `;

    // Lista das partidas do confronto
    if (confrontos.length === 0) {
      listDiv.innerHTML = '<p class="empty-msg" style="padding:12px 0;text-align:center">Nenhuma partida entre essas duplas ainda.</p>';
    } else {
      listDiv.innerHTML = `
        <p class="card-label" style="margin:12px 0 8px">Partidas do confronto</p>
        ${confrontos.map(p => {
          const i1 = p.players ? p.players.indexOf(team1) : -1;
          const i2 = p.players ? p.players.indexOf(team2) : -1;
          const s1 = i1 >= 0 && p.scores ? p.scores[i1] : "—";
          const s2 = i2 >= 0 && p.scores ? p.scores[i2] : "—";
          const ganhou = p.winner === team1 ? team1 : team2;
          return `
            <div class="history-item">
              <div class="history-item-confronto">
                <span class="${p.winner === team1 ? 'ci-vencedor' : 'ci-perdedor'}">${escHtml(team1)}<br><strong>${s1}</strong></span>
                <span class="ci-x">×</span>
                <span class="${p.winner === team2 ? 'ci-vencedor' : 'ci-perdedor'}">${escHtml(team2)}<br><strong>${s2}</strong></span>
              </div>
              <div class="history-item-date" style="text-align:center;margin-top:4px">${p.date || ""}</div>
            </div>
          `;
        }).join("")}
      `;
    }
    return;
  }

  // ── MODO UMA DUPLA: stats individuais ───────────────────
  confrontoDiv.style.display = "none";

  if (team1 && !team2 || !team1 && team2) {
    const team = team1 || team2;
    const filtradas = partidas.filter(p => {
      if (p.players) return p.players.includes(team);
      return p.winner === team || p.loser === team;
    });
    const wins  = filtradas.filter(p => p.winner === team).length;
    const total = filtradas.length;

    rankingDiv.innerHTML = `
      <div class="history-stats-box" style="margin-bottom:12px">
        <div class="stat-item"><span class="stat-num" style="color:#22c55e">${wins}</span><span class="stat-label">Vitórias</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#ef4444">${total - wins}</span><span class="stat-label">Derrotas</span></div>
        <div class="stat-item"><span class="stat-num">${total}</span><span class="stat-label">Partidas</span></div>
        <div class="stat-item"><span class="stat-num" style="color:#f59e0b">${total > 0 ? Math.round(wins/total*100) : 0}%</span><span class="stat-label">Aproveit.</span></div>
      </div>
    `;
    listDiv.innerHTML = filtradas.length === 0
      ? '<p class="empty-msg" style="padding:12px 0">Nenhuma partida encontrada.</p>'
      : filtradas.map(p => `
          <div class="history-item">
            <div class="history-item-winner">${p.winner === team ? "🏆" : "❌"} ${escHtml(p.winner === team ? "Vitória" : "Derrota")}</div>
            ${p.players && p.players.length > 1 ? `<div class="history-item-sub">${p.players.map((pl, i) => `${escHtml(pl)}: ${p.scores ? p.scores[i] : "?"}`).join("  ·  ")}</div>` : ""}
            <div class="history-item-date">${p.date || ""}</div>
          </div>
        `).join("");
    return;
  }

  // ── MODO GERAL: ranking de todas as duplas ───────────────
  const wins = {};
  const totais = {};
  partidas.forEach(p => {
    if (!p.winner) return;
    wins[p.winner]   = (wins[p.winner]   || 0) + 1;
    if (p.players) p.players.forEach(pl => {
      totais[pl] = (totais[pl] || 0) + 1;
    });
  });
  const ranking = Object.entries(wins).sort((a, b) => b[1] - a[1]);

  rankingDiv.innerHTML = ranking.length > 0 ? `
    <div class="history-ranking" style="margin-bottom:12px">
      <p class="card-label" style="margin-bottom:8px">🏆 Ranking geral — selecione as duplas acima para ver o confronto</p>
      ${ranking.map(([name, w], i) => {
        const t = totais[name] || w;
        return `
          <div class="ranking-row">
            <span class="ranking-pos">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}º`}</span>
            <span class="ranking-name">${escHtml(name)}</span>
            <span class="ranking-wins">${w}/${t} — ${Math.round(w/t*100)}%</span>
          </div>
        `;
      }).join("")}
    </div>
  ` : '<p class="empty-msg" style="padding:12px 0;text-align:center">Nenhuma partida registrada ainda.</p>';

  listDiv.innerHTML = "";
}

function closeHistoryModal() {
  document.getElementById("history-overlay").classList.add("hidden");
}

// ─── MODAL ADMIN ─────────────────────────────────────────
function createAdminModal() {
  if (document.getElementById("admin-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "admin-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <p class="modal-title" style="font-size:18px;font-weight:700;color:#f8fafc;margin-bottom:4px">⚙️ Administração</p>
      <p style="font-size:13px;color:#64748b;margin-bottom:20px">Gerencie os dados do Firebase</p>

      <div id="admin-firebase-list" style="margin-bottom:12px"></div>

      <button class="btn btn-danger" onclick="clearHistory()" style="margin-bottom:8px;margin-top:4px">
        🗑 Limpar todo o histórico
      </button>
      <div class="modal-divider"></div>
      <button class="btn btn-ghost" onclick="closeAdminModal()" style="margin-top:8px">Fechar</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function openAdminModal() {
  document.getElementById("admin-overlay").classList.remove("hidden");
  const listDiv = document.getElementById("admin-firebase-list");
  listDiv.innerHTML = '<p style="font-size:13px;color:#64748b">Carregando do Firebase...</p>';

  const partidas = await loadHistoryFromFirebase();
  window._partidas = partidas;

  if (partidas.length === 0) {
    listDiv.innerHTML = '<p class="empty-msg">Nenhuma partida no Firebase ainda.</p>';
    return;
  }

  listDiv.innerHTML = `
    <p class="card-label" style="margin-bottom:8px">Partidas salvas (${partidas.length})</p>
    <div class="admin-list">
      ${partidas.map(p => `
        <div class="admin-item">
          <div class="admin-item-info">
            <span style="color:#22c55e;font-weight:600">${escHtml(p.winner || "?")}</span>
            <span style="color:#64748b;font-size:12px"> — ${p.date || ""}</span>
          </div>
          <button class="btn-delete" onclick="deletePartida('${p.id}')">Excluir</button>
        </div>
      `).join("")}
    </div>
  `;
}

async function deletePartida(id) {
  if (!confirm("Excluir esta partida?")) return;
  await fbDelete(`partidas/${id}`);
  // Atualiza local
  const local = JSON.parse(localStorage.getItem("history") || "[]");
  localStorage.setItem("history", JSON.stringify(local));
  renderHistory();
  openAdminModal(); // Recarrega a lista
}

function closeAdminModal() {
  document.getElementById("admin-overlay").classList.add("hidden");
}

// ─── MODAL VENCEDOR ──────────────────────────────────────
function createWinnerModal() {
  if (document.getElementById("winner-overlay")) return;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "winner-overlay";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-trophy">🏆</div>
      <p class="modal-title">Vencedor da partida</p>
      <p class="modal-winner" id="modal-winner-name"></p>
      <p class="modal-score"  id="modal-winner-score"></p>
      <div class="modal-divider"></div>
      <button class="btn btn-primary" id="btn-rematch-same" onclick="rematchSameScore()">🔁 Mesmas duplas, jogar até 0</button>
      <button class="btn btn-warning" onclick="rematchNewScore()">🎯 Mesmas duplas, alterar meta</button>
      <button class="btn btn-new-players" onclick="newPlayersGame()">👥 Novos jogadores</button>
      <button class="btn btn-ghost" onclick="verPlacar()">👁 Ver placar final</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function showWinnerModal(name, score, target) {
  document.getElementById("modal-winner-name").textContent  = name;
  document.getElementById("modal-winner-score").textContent = `${score} pontos — meta era ${target}`;
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

// ─── REMATCH ─────────────────────────────────────────────
function rematchSameScore() {
  fecharModal();
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  rounds = []; scores = players.map(() => 0);
  gameStarted = true; saveGame(); renderScoreBoard(); renderRounds();
}

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
  rounds = []; scores = players.map(() => 0);
  gameStarted = true; saveGame(); renderScoreBoard(); renderRounds();
}

// ─── NOVOS JOGADORES ─────────────────────────────────────
function newPlayersGame() {
  fecharModal();
  players = []; rounds = []; scores = [];
  gameStarted = false;
  localStorage.removeItem("canastra");
  document.getElementById("target").value = "";
  document.getElementById("name").value   = "";
  document.getElementById("scoreBoard-setup").innerHTML = "";
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  showSetupSection();
  renderDefaultTeams();
  toggleBtnJogar();
}

// ─── REINICIAR ───────────────────────────────────────────
function resetGame() {
  if (!confirm("Reiniciar o jogo? Tudo será apagado.")) return;
  fecharModal();
  players = []; rounds = []; scores = [];
  gameStarted = false;
  localStorage.removeItem("canastra");
  document.getElementById("target").value = "";
  document.getElementById("name").value   = "";
  document.getElementById("scoreBoard-setup").innerHTML = "";
  document.getElementById("postgame-section").style.display = "none";
  document.getElementById("new-score-section").style.display = "none";
  showSetupSection();
  renderDefaultTeams();
  toggleBtnJogar();
}

// ─── UTILS ───────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
