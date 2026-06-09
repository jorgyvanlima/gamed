/**
 * GAME D - Plataforma de Jogos Online Retrô
 * Main Application Logic
 */

// Initialize Audio Synthesizer
class RetroSynth {
  constructor() {
    this.ctx = null;
    this.muted = true;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API não suportada neste navegador.", e);
    }
  }

  setMute(isMuted) {
    this.muted = isMuted;
    if (!isMuted) {
      this.init();
      // Resume audio context if suspended (browser security policy)
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
  }

  playTone(freq, duration, time, type = 'sine', volume = 0.15) {
    if (this.muted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(volume, time);
      gainNode.gain.linearRampToValueAtTime(0.0001, time + duration - 0.005);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    } catch (err) {
      console.error(err);
    }
  }

  playCoin() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(659.25, 0.08, now, 'square', 0.12); // E5
    this.playTone(783.99, 0.18, now + 0.08, 'square', 0.12); // G5
  }

  playLaser() {
    this.init();
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  playExplosion() {
    this.init();
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(10, now + 0.25);
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playMove() {
    this.init();
    if (this.muted || !this.ctx) return;
    this.playTone(180, 0.03, this.ctx.currentTime, 'triangle', 0.15);
  }

  playRotate() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.08);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch(e) {}
  }

  playLevelUp() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(523.25, 0.05, now, 'square', 0.12); // C5
    this.playTone(659.25, 0.05, now + 0.05, 'square', 0.12); // E5
    this.playTone(783.99, 0.05, now + 0.10, 'square', 0.12); // G5
    this.playTone(1046.50, 0.12, now + 0.15, 'square', 0.12); // C6
  }

  playGameOver() {
    this.init();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(392.00, 0.12, now, 'triangle', 0.2); // G4
    this.playTone(349.23, 0.12, now + 0.12, 'triangle', 0.2); // F4
    this.playTone(311.13, 0.12, now + 0.24, 'triangle', 0.2); // Eb4
    this.playTone(246.94, 0.35, now + 0.36, 'triangle', 0.2); // B3
  }
}

const synth = new RetroSynth();

// DATABASE DE JOGOS
const GAMES_DB = [
  {
    id: 'space-invaders',
    title: 'Space Invaders',
    category: 'action',
    badge: 'POPULAR',
    badgeClass: 'hot',
    img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
    desc: 'Defenda a galáxia de invasores alienígenas! Destrua as naves inimigas e proteja seus bunkers no clássico fliperama definitivo.',
    instructions: 'Mover: <span>← →</span> / <span>A D</span> | Atirar: <span>ESPAÇO</span> / <span>SETA CIMA</span> (ou botão <span>ATIRAR</span>)',
    classRef: SpaceInvadersGame,
    plays: '124.930'
  },
  {
    id: 'blocks',
    title: 'Retro Blocks',
    category: 'puzzle',
    badge: 'DESTAQUE',
    badgeClass: 'featured',
    img: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=600&q=80',
    desc: 'Encaixe e empilhe os blocos geométricos que caem para formar linhas horizontais completas e limpar a tela neste puzzle icônico.',
    instructions: 'Mover: <span>← →</span> | Girar: <span>↑</span> ou <span>BOTÃO A</span> | Descer: <span>↓</span> | Despencar: <span>ESPAÇO</span> ou <span>BOTÃO B</span>',
    classRef: BlocksGame,
    plays: '93.212'
  },
  {
    id: 'snake',
    title: 'Neon Snake',
    category: 'arcade',
    badge: 'NOVO',
    badgeClass: 'featured',
    img: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=600&q=80',
    desc: 'Controle a cobra de neon brilhante em uma arena de pixels. Colete chips de energia para crescer, mas evite bater em si mesmo.',
    instructions: 'Mover: <span>← → ↑ ↓</span> / <span>A S D W</span> | Curvas Rápidas: <span>BOTÃO A</span> (Esquerda) e <span>BOTÃO B</span> (Direita)',
    classRef: SnakeGame,
    plays: '41.509'
  }
];

// DATA DE RECORDES INICIAIS (SALVO NO LOCALSTORAGE)
const DEFAULT_LEADERBOARD = [
  { rank: 1, player: 'NET_RACER', game: 'Space Invaders', score: 92450 },
  { rank: 2, player: 'CHIP_MASTER', game: 'Retro Blocks', score: 71200 },
  { rank: 3, player: 'NEON_RUNNER', game: 'Neon Snake', score: 55400 },
  { rank: 4, player: 'RETRO_BOY', game: 'Space Invaders', score: 48900 },
  { rank: 5, player: 'PIXEL_LADY', game: 'Retro Blocks', score: 39500 },
  { rank: 6, player: 'COIN_COLLECTOR', game: 'Neon Snake', score: 28350 }
];

// STATE MANAGEMENT
let selectedGameId = null;
let currentCredits = 0;
let activeCategory = 'all';
let searchQuery = '';

// DOM ELEMENTS
const gamesContainer = document.getElementById('games-container');
const gameSearchInput = document.getElementById('game-search');
const categoryTags = document.querySelectorAll('.category-tag');
const soundBtn = document.getElementById('sound-btn');
const quickPlayBtn = document.getElementById('quick-play-btn');

const gameModal = document.getElementById('game-modal');
const closeCabinetBtn = document.getElementById('close-cabinet');
const cabinetGameTitle = document.getElementById('cabinet-game-title');
const screenOverlay = document.getElementById('screen-overlay');
const overlayTitle = document.getElementById('overlay-title');
const insertCoinBtn = document.getElementById('insert-coin-btn');
const gameControlsInstructions = document.getElementById('game-controls-instructions');

const actionBtnA = document.getElementById('action-btn-a');
const actionBtnB = document.getElementById('action-btn-b');
const actionBtnC = document.getElementById('action-btn-c');
const joystickHandle = document.getElementById('joystick-handle');

const creditCountLabel = document.getElementById('credit-count-label');
const scoreVal = document.getElementById('score-val');
const leaderboardBody = document.getElementById('leaderboard-body');
const totalCoinsInsertedLabel = document.getElementById('total-coins-inserted');
const activePlayersCountLabel = document.getElementById('active-players-count');

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderGames();
  initLeaderboard();
  setupEventListeners();
  startLiveTicking();
  
  // Mute status check
  soundBtn.addEventListener('click', toggleMute);
});

// FUNCTIONS

// Render game cards dynamically
function renderGames() {
  gamesContainer.innerHTML = '';
  
  const filteredGames = GAMES_DB.filter(game => {
    const matchesCategory = activeCategory === 'all' || game.category === activeCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  if (filteredGames.length === 0) {
    gamesContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-family: var(--font-retro); border: 2px dashed rgba(255,0,127,0.2); border-radius: 8px;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 30px; margin-bottom: 15px; color: var(--neon-pink);"></i>
        <p>NENHUM ARCADE ENCONTRADO</p>
      </div>
    `;
    return;
  }
  
  filteredGames.forEach(game => {
    const card = document.createElement('div');
    card.className = `game-card ${game.badge ? 'featured-card' : ''}`;
    
    card.innerHTML = `
      <div class="game-img-wrap">
        <img class="game-img" src="${game.img}" alt="${game.title}">
        <div class="game-overlay">
          <button class="play-action-btn" onclick="openGameCabinet('${game.id}')">
            JOGAR AGORA
          </button>
        </div>
        ${game.badge ? `<div class="game-badge ${game.badgeClass}">${game.badge}</div>` : ''}
      </div>
      <div class="game-info">
        <div class="game-genre">${game.category}</div>
        <h3 class="game-title">${game.title}</h3>
        <p class="game-desc">${game.desc}</p>
        <div class="game-meta">
          <div class="game-stat">
            <i class="fa-solid fa-circle-play"></i>
            <span class="game-play-count">${game.plays} jogados</span>
          </div>
          <button class="retro-btn cyan-btn" onclick="openGameCabinet('${game.id}')" style="padding: 5px 12px; font-size: 11px;">
            ABRIR
          </button>
        </div>
      </div>
    `;
    gamesContainer.appendChild(card);
  });
}

// Setup static and dynamic events
function setupEventListeners() {
  // Search input change
  gameSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGames();
  });
  
  // Category tags click
  categoryTags.forEach(tag => {
    tag.addEventListener('click', () => {
      categoryTags.forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      activeCategory = tag.getAttribute('data-category');
      renderGames();
      synth.playMove();
    });
  });
  
  // Quick play button
  quickPlayBtn.addEventListener('click', () => {
    // Open Space invaders by default
    openGameCabinet('space-invaders');
  });

  // Close Cabinet Modal
  closeCabinetBtn.addEventListener('click', closeGameCabinet);

  // Insert Coin click inside cabinet
  insertCoinBtn.addEventListener('click', insertCoin);

  // Cabinet Action buttons click trigger
  actionBtnA.addEventListener('click', () => triggerCabinetGameAction('A'));
  actionBtnB.addEventListener('click', () => triggerCabinetGameAction('B'));
  actionBtnC.addEventListener('click', () => triggerCabinetGameAction('C'));

  // Sync keyboard keys visually with the joystick / buttons on screen
  window.addEventListener('keydown', (e) => {
    if (!gameModal.classList.contains('active')) return;
    
    // Joystick wobble visualization
    if (['ArrowLeft', 'KeyA'].includes(e.code)) {
      joystickHandle.style.transform = 'translate(-12px, 0px)';
    } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
      joystickHandle.style.transform = 'translate(12px, 0px)';
    } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
      joystickHandle.style.transform = 'translate(0px, -12px)';
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      joystickHandle.style.transform = 'translate(0px, 12px)';
    }

    // Button push visual classes
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyR') {
      actionBtnA.style.transform = 'translateY(3px)';
      actionBtnA.style.boxShadow = '0 1px 0 #11081a, inset 0 1px 2px rgba(0,0,0,0.4)';
    } else if (e.code === 'Space') {
      actionBtnB.style.transform = 'translateY(3px)';
      actionBtnB.style.boxShadow = '0 1px 0 #11081a, inset 0 1px 2px rgba(0,0,0,0.4)';
    } else if (e.code === 'Enter') {
      actionBtnC.style.transform = 'translateY(3px)';
      actionBtnC.style.boxShadow = '0 1px 0 #11081a, inset 0 1px 2px rgba(0,0,0,0.4)';
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!gameModal.classList.contains('active')) return;

    // Reset joystick
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code)) {
      joystickHandle.style.transform = 'translate(0px, 0px)';
    }

    // Reset button press visuals
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyR') {
      actionBtnA.style.transform = '';
      actionBtnA.style.boxShadow = '';
    } else if (e.code === 'Space') {
      actionBtnB.style.transform = '';
      actionBtnB.style.boxShadow = '';
    } else if (e.code === 'Enter') {
      actionBtnC.style.transform = '';
      actionBtnC.style.boxShadow = '';
    }
    
    // Press start (Enter) when overlay active
    if (e.code === 'Enter' && screenOverlay.style.display !== 'none' && currentCredits > 0) {
      startGame();
    }
  });
}

// Toggles sound mute/unmute
function toggleMute() {
  const isMuted = !synth.muted;
  synth.setMute(isMuted);
  
  if (isMuted) {
    soundBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    soundBtn.style.color = 'var(--neon-pink)';
    soundBtn.style.borderColor = 'var(--neon-pink)';
  } else {
    soundBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    soundBtn.style.color = 'var(--neon-cyan)';
    soundBtn.style.borderColor = 'var(--neon-cyan)';
    synth.playCoin();
  }
}

// Page scroll helpers
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
    synth.playMove();
  }
}

// ARCADE CABINET GAME CONTROLLER LIFECYCLE
function openGameCabinet(gameId) {
  selectedGameId = gameId;
  const gameData = GAMES_DB.find(g => g.id === gameId);
  
  if (!gameData) return;
  
  // Populate UI
  cabinetGameTitle.textContent = gameData.title.toUpperCase();
  overlayTitle.textContent = gameData.title;
  gameControlsInstructions.innerHTML = gameData.instructions;
  scoreVal.textContent = '000000';
  
  // Stop existing game
  if (currentGameInstance) {
    currentGameInstance.stop();
    currentGameInstance = null;
  }
  
  // Show overlays
  screenOverlay.style.display = 'flex';
  insertCoinBtn.style.display = 'block';
  
  // Open modal
  gameModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // stop page scrolling
  
  // Setup focus inside cabinet
  setTimeout(() => {
    document.getElementById('game-canvas').focus();
  }, 100);
  
  synth.playMove();
}

function closeGameCabinet() {
  if (currentGameInstance) {
    currentGameInstance.stop();
    currentGameInstance = null;
  }
  
  gameModal.classList.remove('active');
  document.body.style.overflow = ''; // restore scrolling
  synth.playMove();
}

function insertCoin() {
  currentCredits++;
  creditCountLabel.textContent = `CREDITS: ${currentCredits.toString().padStart(2, '0')}`;
  
  // Synth play coin
  synth.playCoin();
  
  // Increment site total coins counter
  let currentTotalCoins = parseInt(localStorage.getItem('gamed_total_coins') || 84921);
  currentTotalCoins++;
  localStorage.setItem('gamed_total_coins', currentTotalCoins);
  totalCoinsInsertedLabel.textContent = currentTotalCoins.toLocaleString();
  
  // Toggle UI prompts
  insertCoinBtn.innerHTML = '<i class="fa-solid fa-play"></i> PRESS START';
  insertCoinBtn.classList.remove('coin-prompt');
  insertCoinBtn.className = 'hero-btn';
  insertCoinBtn.style.animation = 'blink 1.5s infinite steps(2)';
  
  // Change listener on button once coin inserted
  insertCoinBtn.onclick = startGame;
}

function startGame() {
  if (currentCredits <= 0) return;
  
  // Decrement credits
  currentCredits--;
  creditCountLabel.textContent = `CREDITS: ${currentCredits.toString().padStart(2, '0')}`;
  
  // Reset coin button handler for future insertion
  insertCoinBtn.className = 'coin-prompt';
  insertCoinBtn.innerHTML = '<i class="fa-solid fa-circle-dollar-to-slot"></i> INSERIR FICHA';
  insertCoinBtn.style.animation = '';
  insertCoinBtn.onclick = insertCoin;
  
  // Hide Overlay Screen
  screenOverlay.style.display = 'none';
  
  // Instantiate dynamic game class
  const gameData = GAMES_DB.find(g => g.id === selectedGameId);
  const canvas = document.getElementById('game-canvas');
  
  if (currentGameInstance) {
    currentGameInstance.stop();
  }
  
  synth.playLevelUp(); // Game start fanfare!
  
  currentGameInstance = new gameData.classRef(canvas, {
    onScore: (score) => {
      scoreVal.textContent = score.toString().padStart(6, '0');
    },
    onGameOver: (finalScore) => {
      saveHighScore(gameData.title, finalScore);
      
      // Delay display of coin slot overlay again
      setTimeout(() => {
        if (currentGameInstance && currentGameInstance.gameOver) {
          screenOverlay.style.display = 'flex';
          if (currentCredits <= 0) {
            insertCoinBtn.innerHTML = '<i class="fa-solid fa-circle-dollar-to-slot"></i> INSERIR FICHA';
            insertCoinBtn.onclick = insertCoin;
          } else {
            insertCoinBtn.innerHTML = '<i class="fa-solid fa-play"></i> PRESS START';
            insertCoinBtn.className = 'hero-btn';
            insertCoinBtn.style.animation = 'blink 1.5s infinite steps(2)';
            insertCoinBtn.onclick = startGame;
          }
        }
      }, 3000);
    },
    playSound: (soundType) => {
      if (soundType === 'laser') synth.playLaser();
      else if (soundType === 'explosion') synth.playExplosion();
      else if (soundType === 'move') synth.playMove();
      else if (soundType === 'rotate') synth.playRotate();
      else if (soundType === 'levelup') synth.playLevelUp();
      else if (soundType === 'gameover') synth.playGameOver();
    }
  });
  
  currentGameInstance.start();
}

function triggerCabinetGameAction(action) {
  if (currentGameInstance) {
    currentGameInstance.triggerAction(action);
  }
  
  // Sound confirmation click
  synth.playMove();
}

// RECORDES (HIGH SCORES) LOGIC
function initLeaderboard() {
  let list = localStorage.getItem('gamed_leaderboard');
  if (!list) {
    localStorage.setItem('gamed_leaderboard', JSON.stringify(DEFAULT_LEADERBOARD));
    list = JSON.stringify(DEFAULT_LEADERBOARD);
  }
  
  renderLeaderboard(JSON.parse(list));
}

function renderLeaderboard(scoresList) {
  // Sort descending
  scoresList.sort((a, b) => b.score - a.score);
  
  leaderboardBody.innerHTML = '';
  scoresList.slice(0, 7).forEach((entry, index) => {
    const row = document.createElement('tr');
    
    // Pick initials for avatar
    const initials = entry.player.substring(0, 2).toUpperCase();
    
    row.innerHTML = `
      <td class="score-rank">#${index + 1}</td>
      <td>
        <div class="score-player">
          <div class="player-avatar">${initials}</div>
          <span>${entry.player}</span>
        </div>
      </td>
      <td class="score-game">${entry.game}</td>
      <td class="score-points">${entry.score.toLocaleString()}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

function saveHighScore(gameTitle, score) {
  if (score <= 0) return;
  
  let scoresList = JSON.parse(localStorage.getItem('gamed_leaderboard') || '[]');
  
  // Prompt user for arcade tag name (Initials or short nick)
  let playerNick = prompt("NOVO RECORDE! Digite suas iniciais de 3 letras:", "AAA");
  if (!playerNick || playerNick.trim() === "") {
    playerNick = "GUEST";
  }
  playerNick = playerNick.trim().substring(0, 10).toUpperCase();
  
  scoresList.push({
    rank: 99, // recalculated on sort
    player: playerNick,
    game: gameTitle,
    score: score
  });
  
  // Sort and cap
  scoresList.sort((a, b) => b.score - a.score);
  scoresList = scoresList.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  
  localStorage.setItem('gamed_leaderboard', JSON.stringify(scoresList));
  renderLeaderboard(scoresList);
}

// TICKING STATISTICS FOR REAL-TIME RETRO FEEL
function startLiveTicking() {
  // Tick total coin credits loaded from localstorage
  let totalCoins = parseInt(localStorage.getItem('gamed_total_coins') || 84921);
  localStorage.setItem('gamed_total_coins', totalCoins);
  totalCoinsInsertedLabel.textContent = totalCoins.toLocaleString();
  
  // Smooth random ticking for active players and counter
  setInterval(() => {
    let activePlayers = parseInt(activePlayersCountLabel.textContent.replace(',', '')) || 1337;
    // Add/subtract up to 5 players
    let variance = Math.floor(Math.random() * 11) - 5;
    activePlayers = Math.max(1200, activePlayers + variance);
    activePlayersCountLabel.textContent = activePlayers.toLocaleString();
  }, 4000);
}
