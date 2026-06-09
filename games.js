/**
 * GAME D - Retro Canvas Games Suite
 * Space Invaders, Blocks (Tetris clone), Neon Snake
 */

// Global Game Controller State
let currentGameInstance = null;

// ==========================================
// 1. SPACE INVADERS GAME
// ==========================================
class SpaceInvadersGame {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {}; // { onScore, onGameOver, playSound }
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.active = false;
    this.keys = {};
    
    this.reset();
    
    // Bind event listeners
    this.keydownHandler = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
      }
    };
    this.keyupHandler = (e) => {
      this.keys[e.code] = false;
    };
  }
  
  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    
    // Player
    this.player = {
      x: this.width / 2 - 20,
      y: this.height - 40,
      width: 40,
      height: 20,
      speed: 5,
      cooldown: 0
    };
    
    this.bullets = [];
    this.alienBullets = [];
    this.invaders = [];
    this.particles = [];
    
    this.initInvaders();
    this.initBunkers();
  }
  
  initInvaders() {
    const rows = 4;
    const cols = 8;
    const spacingX = 55;
    const spacingY = 40;
    const startX = 60;
    const startY = 60;
    
    this.invaders = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Different alien types based on row
        let type = 'easy';
        let points = 10;
        let color = '#8b5cf6'; // purple
        
        if (r === 0) {
          type = 'hard';
          points = 30;
          color = '#ff007f'; // pink
        } else if (r <= 2) {
          type = 'medium';
          points = 20;
          color = '#00f0ff'; // cyan
        }
        
        this.invaders.push({
          x: startX + c * spacingX,
          y: startY + r * spacingY,
          width: 35,
          height: 25,
          points: points,
          color: color,
          type: type,
          alive: true
        });
      }
    }
    
    // Invaders movement direction (1 = right, -1 = left)
    this.invaderDirection = 1;
    this.invaderSpeed = 1.0 + (this.level * 0.25);
    this.invaderMoveTimer = 0;
    this.invaderStepDown = false;
  }
  
  initBunkers() {
    this.bunkers = [];
    const numBunkers = 3;
    const spacing = this.width / (numBunkers + 1);
    
    for (let b = 0; b < numBunkers; b++) {
      const startX = spacing * (b + 1) - 40;
      const startY = this.height - 90;
      
      // Create a pixelated shield bunker
      const grid = [];
      const rows = 4;
      const cols = 10;
      const size = 8;
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Skip corners to make a retro dome shape
          if ((r === 0 && (c === 0 || c === 9)) || (r === 3 && c >= 3 && c <= 6)) {
            continue;
          }
          grid.push({
            x: startX + c * size,
            y: startY + r * size,
            width: size,
            height: size,
            health: 3
          });
        }
      }
      this.bunkers.push(...grid);
    }
  }
  
  start() {
    this.active = true;
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.loop();
  }
  
  stop() {
    this.active = false;
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
  }
  
  triggerAction(action) {
    if (this.gameOver) return;
    if (action === 'A' || action === 'C') { // Shoot
      this.firePlayerBullet();
    }
  }
  
  firePlayerBullet() {
    if (this.player.cooldown <= 0) {
      this.bullets.push({
        x: this.player.x + this.player.width / 2 - 2,
        y: this.player.y - 10,
        width: 4,
        height: 12,
        speed: 7
      });
      this.player.cooldown = 25; // frames delay
      if (this.callbacks.playSound) this.callbacks.playSound('laser');
    }
  }
  
  update() {
    if (this.gameOver) return;
    
    // Player movement
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x -= this.player.speed;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x += this.player.speed;
    }
    
    // Bounds check player
    if (this.player.x < 10) this.player.x = 10;
    if (this.player.x > this.width - this.player.width - 10) {
      this.player.x = this.width - this.player.width - 10;
    }
    
    if (this.player.cooldown > 0) this.player.cooldown--;
    
    // Keyboard shoot check
    if (this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) {
      this.firePlayerBullet();
    }
    
    // Update player bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y -= b.speed;
      if (b.y < 0) {
        this.bullets.splice(i, 1);
      }
    }
    
    // Update alien bullets
    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const b = this.alienBullets[i];
      b.y += b.speed;
      if (b.y > this.height) {
        this.alienBullets.splice(i, 1);
      }
    }
    
    // Update invaders
    let changeDir = false;
    let aliveCount = 0;
    
    this.invaders.forEach(inv => {
      if (!inv.alive) return;
      aliveCount++;
      
      // Horizontal slide
      inv.x += this.invaderDirection * this.invaderSpeed;
      
      // Boundary check
      if (inv.x > this.width - inv.width - 15 || inv.x < 15) {
        changeDir = true;
      }
      
      // Check if invaders reached player line
      if (inv.y + inv.height >= this.player.y) {
        this.triggerGameOver();
      }
    });
    
    if (aliveCount === 0) {
      // Clear level
      this.level++;
      if (this.callbacks.playSound) this.callbacks.playSound('levelup');
      this.initInvaders();
      return;
    }
    
    if (changeDir) {
      this.invaderDirection *= -1;
      this.invaders.forEach(inv => {
        if (inv.alive) inv.y += 15;
      });
    }
    
    // Alien random firing
    if (Math.random() < 0.015 + (this.level * 0.005)) {
      const activeInvaders = this.invaders.filter(inv => inv.alive);
      if (activeInvaders.length > 0) {
        const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
        this.alienBullets.push({
          x: shooter.x + shooter.width / 2,
          y: shooter.y + shooter.height,
          width: 3,
          height: 10,
          speed: 4 + (this.level * 0.3)
        });
      }
    }
    
    // Collisions: player bullet vs invaders
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      let hit = false;
      
      for (let inv of this.invaders) {
        if (!inv.alive) continue;
        if (this.checkCollision(b, inv)) {
          inv.alive = false;
          hit = true;
          this.score += inv.points;
          if (this.callbacks.onScore) this.callbacks.onScore(this.score);
          if (this.callbacks.playSound) this.callbacks.playSound('explosion');
          this.createExplosion(inv.x + inv.width/2, inv.y + inv.height/2, inv.color);
          break;
        }
      }
      
      if (hit) {
        this.bullets.splice(bi, 1);
        continue;
      }
      
      // Collisions: player bullet vs bunkers
      for (let bu = this.bunkers.length - 1; bu >= 0; bu--) {
        const bunk = this.bunkers[bu];
        if (this.checkCollision(b, bunk)) {
          bunk.health--;
          if (bunk.health <= 0) {
            this.bunkers.splice(bu, 1);
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        this.bullets.splice(bi, 1);
      }
    }
    
    // Collisions: alien bullet vs bunkers
    for (let bi = this.alienBullets.length - 1; bi >= 0; bi--) {
      const b = this.alienBullets[bi];
      let hit = false;
      
      for (let bu = this.bunkers.length - 1; bu >= 0; bu--) {
        const bunk = this.bunkers[bu];
        if (this.checkCollision(b, bunk)) {
          bunk.health--;
          if (bunk.health <= 0) {
            this.bunkers.splice(bu, 1);
          }
          hit = true;
          break;
        }
      }
      
      if (hit) {
        this.alienBullets.splice(bi, 1);
        continue;
      }
      
      // Collisions: alien bullet vs player
      if (this.checkCollision(b, this.player)) {
        this.alienBullets.splice(bi, 1);
        this.lives--;
        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff007f');
        if (this.callbacks.playSound) this.callbacks.playSound('explosion');
        if (this.lives <= 0) {
          this.triggerGameOver();
        } else {
          // Re-center player
          this.player.x = this.width / 2 - 20;
        }
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  createExplosion(x, y, color) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color: color
      });
    }
  }
  
  triggerGameOver() {
    this.gameOver = true;
    if (this.callbacks.playSound) this.callbacks.playSound('gameover');
    if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#050508';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw background grid lines (extremely subtle retro style)
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    this.ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < this.width; x += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.font = '24px "Press Start 2P"';
      this.ctx.fillStyle = '#ff007f';
      this.ctx.textAlign = 'center';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ff007f';
      this.ctx.fillText('FIM DE JOGO', this.width / 2, this.height / 2 - 20);
      
      this.ctx.font = '12px "Press Start 2P"';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 20);
      this.ctx.fillText('CLIQUE EM CONTROLE-START', this.width / 2, this.height / 2 + 50);
      this.ctx.fillText('PARA REINICIAR', this.width / 2, this.height / 2 + 75);
      return;
    }
    
    // Draw player (retro spaceship)
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(this.player.x + 15, this.player.y - 6, 10, 6);
    this.ctx.fillRect(this.player.x + 5, this.player.y, 30, 10);
    this.ctx.fillRect(this.player.x, this.player.y + 10, this.player.width, 10);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(this.player.x + 18, this.player.y - 12, 4, 6);
    
    // Draw player bullets
    this.ctx.shadowBlur = 6;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.fillStyle = '#00f0ff';
    this.bullets.forEach(b => {
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    
    // Draw alien bullets
    this.ctx.shadowBlur = 6;
    this.ctx.shadowColor = '#ff007f';
    this.ctx.fillStyle = '#ff007f';
    this.alienBullets.forEach(b => {
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    });
    
    // Draw invaders
    this.invaders.forEach(inv => {
      if (!inv.alive) return;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = inv.color;
      this.ctx.fillStyle = inv.color;
      
      // Draw pixel aliens
      if (inv.type === 'hard') {
        // Skull-like alien
        this.ctx.fillRect(inv.x + 10, inv.y, 15, 5);
        this.ctx.fillRect(inv.x + 5, inv.y + 5, 25, 5);
        this.ctx.fillRect(inv.x, inv.y + 10, 35, 5);
        this.ctx.fillRect(inv.x + 5, inv.y + 15, 10, 5);
        this.ctx.fillRect(inv.x + 20, inv.y + 15, 10, 5);
        this.ctx.fillRect(inv.x + 10, inv.y + 20, 15, 5);
      } else if (inv.type === 'medium') {
        // Classic crab alien
        this.ctx.fillRect(inv.x + 5, inv.y, 25, 5);
        this.ctx.fillRect(inv.x, inv.y + 5, 35, 5);
        this.ctx.fillRect(inv.x, inv.y + 10, 35, 5);
        this.ctx.fillRect(inv.x + 10, inv.y + 15, 15, 5);
        this.ctx.fillRect(inv.x + 5, inv.y + 20, 5, 5);
        this.ctx.fillRect(inv.x + 25, inv.y + 20, 5, 5);
      } else {
        // Octopus alien
        this.ctx.fillRect(inv.x + 10, inv.y, 15, 5);
        this.ctx.fillRect(inv.x + 5, inv.y + 5, 25, 5);
        this.ctx.fillRect(inv.x + 5, inv.y + 10, 25, 5);
        this.ctx.fillRect(inv.x, inv.y + 15, 35, 5);
        this.ctx.fillRect(inv.x, inv.y + 20, 5, 5);
        this.ctx.fillRect(inv.x + 30, inv.y + 20, 5, 5);
      }
    });
    
    // Draw bunkers
    this.ctx.shadowBlur = 0;
    this.bunkers.forEach(bunk => {
      // Health dictates alpha
      let alpha = bunk.health / 3;
      this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
      this.ctx.fillRect(bunk.x, bunk.y, bunk.width, bunk.height);
    });
    
    // Draw particles
    this.ctx.shadowBlur = 0;
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillRect(p.x, p.y, 3, 3);
    });
    this.ctx.globalAlpha = 1.0; // reset
    
    // Status Bar HUD at top
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px "Press Start 2P"';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);
    this.ctx.fillText(`LEVEL: ${this.level}`, 160, 25);
    
    // Draw Lives
    this.ctx.textAlign = 'right';
    this.ctx.fillText('SHIPS:', this.width - 80, 25);
    this.ctx.fillStyle = '#00f0ff';
    for (let l = 0; l < this.lives; l++) {
      this.ctx.fillRect(this.width - 70 + l * 22, 15, 16, 10);
    }
  }
  
  loop() {
    if (!this.active) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// ==========================================
// 2. RETRO BLOCKS (TETRIS CLONE)
// ==========================================
class BlocksGame {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.active = false;
    this.keys = {};
    
    // Tetris board size and drawing coordinates
    this.gridRows = 20;
    this.gridCols = 10;
    this.blockSize = 20;
    this.boardX = (this.width - this.gridCols * this.blockSize) / 2;
    this.boardY = (this.height - this.gridRows * this.blockSize) / 2;
    
    // Tetromino definitions
    this.shapes = {
      'I': [[1,1,1,1]],
      'O': [[1,1],[1,1]],
      'T': [[0,1,0],[1,1,1]],
      'S': [[0,1,1],[1,1,0]],
      'Z': [[1,1,0],[0,1,1]],
      'J': [[1,0,0],[1,1,1]],
      'L': [[0,0,1],[1,1,1]]
    };
    
    this.colors = {
      'I': '#00f0ff', // cyan
      'O': '#f59e0b', // yellow
      'T': '#8b5cf6', // purple
      'S': '#10b981', // green
      'Z': '#ff007f', // pink
      'J': '#3b82f6', // blue
      'L': '#f97316'  // orange
    };
    
    this.reset();
    
    // Bind input
    this.keydownHandler = (e) => {
      if (this.gameOver) return;
      
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.moveBlock(-1, 0);
        if (this.callbacks.playSound) this.callbacks.playSound('move');
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.moveBlock(1, 0);
        if (this.callbacks.playSound) this.callbacks.playSound('move');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        this.moveBlock(0, 1);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyR') {
        this.rotateBlock();
        if (this.callbacks.playSound) this.callbacks.playSound('rotate');
      } else if (e.code === 'Space') {
        this.hardDrop();
      }
      
      // Prevent browser scrolls
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
      }
    };
  }
  
  reset() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    
    // Initialize matrix with 0
    this.grid = Array.from({ length: this.gridRows }, () => Array(this.gridCols).fill(0));
    
    this.currentPiece = null;
    this.nextPiece = this.generatePiece();
    this.spawnPiece();
    
    this.dropCounter = 0;
    this.dropInterval = 1000; // ms
    this.lastTime = 0;
  }
  
  generatePiece() {
    const keys = Object.keys(this.shapes);
    const shapeKey = keys[Math.floor(Math.random() * keys.length)];
    return {
      shape: this.shapes[shapeKey],
      color: this.colors[shapeKey],
      letter: shapeKey,
      x: 0,
      y: 0
    };
  }
  
  spawnPiece() {
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.generatePiece();
    
    // Put current piece at top center
    this.currentPiece.x = Math.floor((this.gridCols - this.currentPiece.shape[0].length) / 2);
    this.currentPiece.y = 0;
    
    // Check initial overlap = game over
    if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
      this.triggerGameOver();
    }
  }
  
  checkCollision(xOffset, yOffset, matrix) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const nextX = xOffset + c;
          const nextY = yOffset + r;
          
          // Boundaries check
          if (nextX < 0 || nextX >= this.gridCols || nextY >= this.gridRows) {
            return true;
          }
          
          // Check collision with locked blocks
          if (nextY >= 0 && this.grid[nextY][nextX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  moveBlock(dx, dy) {
    if (!this.currentPiece) return false;
    if (!this.checkCollision(this.currentPiece.x + dx, this.currentPiece.y + dy, this.currentPiece.shape)) {
      this.currentPiece.x += dx;
      this.currentPiece.y += dy;
      return true;
    }
    
    // Lock piece if it was trying to go down but hit something
    if (dy > 0) {
      this.lockPiece();
    }
    return false;
  }
  
  hardDrop() {
    while (this.moveBlock(0, 1)) {
      // Loop until block lands
    }
    if (this.callbacks.playSound) this.callbacks.playSound('move');
  }
  
  rotateBlock() {
    const piece = this.currentPiece;
    if (!piece) return;
    
    const matrix = piece.shape;
    const n = matrix.length;
    const m = matrix[0].length;
    
    // Matrix Transpose + Reverse to rotate 90 deg clockwise
    const rotated = Array.from({ length: m }, () => Array(n).fill(0));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < m; c++) {
        rotated[c][n - 1 - r] = matrix[r][c];
      }
    }
    
    // Attempt rotation and wall kicks
    const originalX = piece.x;
    let offset = 1;
    
    while (this.checkCollision(piece.x, piece.y, rotated)) {
      piece.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      
      if (Math.abs(offset) > m) {
        // Rotation fails, restore original position
        piece.x = originalX;
        return;
      }
    }
    piece.shape = rotated;
  }
  
  lockPiece() {
    const p = this.currentPiece;
    for (let r = 0; r < p.shape.length; r++) {
      for (let c = 0; c < p.shape[r].length; c++) {
        if (p.shape[r][c] !== 0) {
          const boardY = p.y + r;
          const boardX = p.x + c;
          
          if (boardY >= 0) {
            this.grid[boardY][boardX] = p.color;
          }
        }
      }
    }
    
    this.clearLines();
    this.spawnPiece();
  }
  
  clearLines() {
    let clearedCount = 0;
    
    for (let r = this.gridRows - 1; r >= 0; r--) {
      // Check if full row
      if (this.grid[r].every(val => val !== 0)) {
        // Remove row and add empty one at top
        this.grid.splice(r, 1);
        this.grid.unshift(Array(this.gridCols).fill(0));
        clearedCount++;
        r++; // check this row index again since values shifted down
      }
    }
    
    if (clearedCount > 0) {
      this.lines += clearedCount;
      // Classic scoring system
      const scoreValues = [0, 100, 300, 500, 800];
      this.score += scoreValues[clearedCount] * this.level;
      
      // Level progression
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      
      if (this.callbacks.onScore) this.callbacks.onScore(this.score);
      if (this.callbacks.playSound) this.callbacks.playSound('levelup');
    } else {
      if (this.callbacks.playSound) this.callbacks.playSound('explosion'); // block lock thud
    }
  }
  
  triggerAction(action) {
    if (this.gameOver) return;
    if (action === 'A') { // Rotate
      this.rotateBlock();
      if (this.callbacks.playSound) this.callbacks.playSound('rotate');
    } else if (action === 'B') { // Hard drop
      this.hardDrop();
    } else if (action === 'C') { // Fast soft drop
      this.moveBlock(0, 1);
    }
  }
  
  triggerGameOver() {
    this.gameOver = true;
    this.currentPiece = null;
    if (this.callbacks.playSound) this.callbacks.playSound('gameover');
    if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
  }
  
  start() {
    this.active = true;
    window.addEventListener('keydown', this.keydownHandler);
    this.lastTime = performance.now();
    this.loop();
  }
  
  stop() {
    this.active = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }
  
  update(time = 0) {
    if (this.gameOver) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    this.dropCounter += deltaTime;
    if (this.dropCounter > this.dropInterval) {
      this.moveBlock(0, 1);
      this.dropCounter = 0;
    }
  }
  
  draw() {
    // Clear background
    this.ctx.fillStyle = '#050508';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw layout columns backdrop
    this.ctx.fillStyle = '#0d0f1b';
    this.ctx.fillRect(this.boardX, this.boardY, this.gridCols * this.blockSize, this.gridRows * this.blockSize);
    
    // Draw layout grid gridlines
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c <= this.gridCols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.boardX + c * this.blockSize, this.boardY);
      this.ctx.lineTo(this.boardX + c * this.blockSize, this.boardY + this.gridRows * this.blockSize);
      this.ctx.stroke();
    }
    for (let r = 0; r <= this.gridRows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.boardX, this.boardY + r * this.blockSize);
      this.ctx.lineTo(this.boardX + this.gridCols * this.blockSize, this.boardY + r * this.blockSize);
      this.ctx.stroke();
    }
    
    // Draw Locked blocks in matrix
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const color = this.grid[r][c];
        if (color !== 0) {
          this.drawBlock(this.boardX + c * this.blockSize, this.boardY + r * this.blockSize, color);
        }
      }
    }
    
    // Draw Current block falling
    if (this.currentPiece) {
      const p = this.currentPiece;
      for (let r = 0; r < p.shape.length; r++) {
        for (let c = 0; c < p.shape[r].length; c++) {
          if (p.shape[r][c] !== 0) {
            const bx = this.boardX + (p.x + c) * this.blockSize;
            const by = this.boardY + (p.y + r) * this.blockSize;
            this.drawBlock(bx, by, p.color);
          }
        }
      }
    }
    
    // Draw Bezel Border Around Area
    this.ctx.strokeStyle = 'var(--neon-purple)';
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = 'var(--neon-purple)';
    this.ctx.strokeRect(this.boardX - 2, this.boardY - 2, this.gridCols * this.blockSize + 4, this.gridRows * this.blockSize + 4);
    this.ctx.shadowBlur = 0; // reset
    
    // HUD Sidebar on the right
    const hudX = this.boardX + this.gridCols * this.blockSize + 25;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    
    this.ctx.font = '8px "Press Start 2P"';
    this.ctx.fillStyle = 'var(--neon-cyan)';
    this.ctx.fillText('SCORE', hudX, this.boardY + 20);
    this.ctx.font = '12px "Press Start 2P"';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(this.score.toString().padStart(6, '0'), hudX, this.boardY + 38);
    
    this.ctx.font = '8px "Press Start 2P"';
    this.ctx.fillStyle = 'var(--neon-cyan)';
    this.ctx.fillText('NÍVEL', hudX, this.boardY + 70);
    this.ctx.font = '12px "Press Start 2P"';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(this.level.toString(), hudX, this.boardY + 88);
    
    this.ctx.font = '8px "Press Start 2P"';
    this.ctx.fillStyle = 'var(--neon-cyan)';
    this.ctx.fillText('LINHAS', hudX, this.boardY + 120);
    this.ctx.font = '12px "Press Start 2P"';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(this.lines.toString(), hudX, this.boardY + 138);
    
    // NEXT BLOCK PREVIEW
    this.ctx.font = '8px "Press Start 2P"';
    this.ctx.fillStyle = 'var(--neon-pink)';
    this.ctx.fillText('PRÓXIMO', hudX, this.boardY + 180);
    
    // Preview container box
    this.ctx.fillStyle = '#0d0f1b';
    this.ctx.fillRect(hudX, this.boardY + 195, 75, 75);
    this.ctx.strokeStyle = '#2d2d2d';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(hudX, this.boardY + 195, 75, 75);
    
    if (this.nextPiece) {
      const next = this.nextPiece;
      const sh = next.shape;
      // Center calculation in preview box
      const previewCell = 15;
      const offX = hudX + (75 - sh[0].length * previewCell) / 2;
      const offY = this.boardY + 195 + (75 - sh.length * previewCell) / 2;
      
      for (let r = 0; r < sh.length; r++) {
        for (let c = 0; c < sh[r].length; c++) {
          if (sh[r][c] !== 0) {
            this.ctx.fillStyle = next.color;
            this.ctx.fillRect(offX + c * previewCell, offY + r * previewCell, previewCell - 1, previewCell - 1);
          }
        }
      }
    }
    
    // Game Controls Help overlay
    const helpY = this.boardY + 320;
    this.ctx.font = '7px "Press Start 2P"';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.fillText('MOVER: ← →', hudX, helpY);
    this.ctx.fillText('DESCE: ↓', hudX, helpY + 15);
    this.ctx.fillText('GIRA: ↑ / A', hudX, helpY + 30);
    this.ctx.fillText('QUEDA: SPACE / B', hudX, helpY + 45);
    
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.font = '22px "Press Start 2P"';
      this.ctx.fillStyle = '#ff007f';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ff007f';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('FIM DE JOGO', this.width / 2, this.height / 2 - 20);
      
      this.ctx.font = '12px "Press Start 2P"';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(`PONTOS: ${this.score}`, this.width / 2, this.height / 2 + 20);
      this.ctx.fillText('PRESSIONE START', this.width / 2, this.height / 2 + 50);
      this.ctx.fillText('PARA REINICIAR', this.width / 2, this.height / 2 + 75);
    }
  }
  
  drawBlock(x, y, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, this.blockSize - 2);
    // highlight sheen for glossy retro block feel
    this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
    this.ctx.fillRect(x + 1, y + 1, this.blockSize - 2, 3);
    this.ctx.fillRect(x + 1, y + 1, 3, this.blockSize - 2);
    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.fillRect(x + 1, y + this.blockSize - 4, this.blockSize - 2, 3);
    this.ctx.fillRect(x + this.blockSize - 4, y + 1, 3, this.blockSize - 2);
  }
  
  loop(time) {
    if (!this.active) return;
    this.update(time);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// ==========================================
// 3. NEON SNAKE GAME
// ==========================================
class SnakeGame {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.active = false;
    
    // Grid Setup (Play area 20 rows x 24 cols)
    this.gridSize = 20;
    this.cols = Math.floor(this.width / this.gridSize);
    this.rows = Math.floor(this.height / this.gridSize);
    
    this.reset();
    
    // Key router
    this.keydownHandler = (e) => {
      if (this.gameOver) return;
      
      let newDir = null;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') newDir = 'LEFT';
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') newDir = 'RIGHT';
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') newDir = 'UP';
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') newDir = 'DOWN';
      
      if (newDir) {
        // Prevent 180 degree instant turns into self
        if (
          (newDir === 'LEFT' && this.direction !== 'RIGHT') ||
          (newDir === 'RIGHT' && this.direction !== 'LEFT') ||
          (newDir === 'UP' && this.direction !== 'DOWN') ||
          (newDir === 'DOWN' && this.direction !== 'UP')
        ) {
          this.nextDirection = newDir;
          if (this.callbacks.playSound) this.callbacks.playSound('move');
        }
        e.preventDefault();
      }
    };
  }
  
  reset() {
    this.score = 0;
    this.gameOver = false;
    
    // Spawn center snake facing right
    const startX = Math.floor(this.cols / 2);
    const startY = Math.floor(this.rows / 2);
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];
    
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    
    this.generateFood();
    
    this.lastUpdate = 0;
    this.speed = 100; // ms per block movement (fast retro pacing)
  }
  
  generateFood() {
    let attempts = 0;
    while (attempts < 100) {
      const rx = Math.floor(Math.random() * this.cols);
      const ry = Math.floor(Math.random() * this.rows);
      
      // Check food not on snake
      const onSnake = this.snake.some(cell => cell.x === rx && cell.y === ry);
      
      if (!onSnake) {
        this.food = { x: rx, y: ry };
        return;
      }
      attempts++;
    }
    this.food = { x: 0, y: 0 }; // Fallback
  }
  
  triggerAction(action) {
    if (this.gameOver) return;
    // Turn clockwise/counter-clockwise with console buttons as alternatives
    if (action === 'A') { // turn left relative to direction
      let leftTurns = { 'UP': 'LEFT', 'LEFT': 'DOWN', 'DOWN': 'RIGHT', 'RIGHT': 'UP' };
      this.nextDirection = leftTurns[this.direction];
      if (this.callbacks.playSound) this.callbacks.playSound('rotate');
    } else if (action === 'B') { // turn right
      let rightTurns = { 'UP': 'RIGHT', 'RIGHT': 'DOWN', 'DOWN': 'LEFT', 'LEFT': 'UP' };
      this.nextDirection = rightTurns[this.direction];
      if (this.callbacks.playSound) this.callbacks.playSound('rotate');
    }
  }
  
  start() {
    this.active = true;
    window.addEventListener('keydown', this.keydownHandler);
    this.lastUpdate = performance.now();
    this.loop();
  }
  
  stop() {
    this.active = false;
    window.removeEventListener('keydown', this.keydownHandler);
  }
  
  update(time) {
    if (this.gameOver) return;
    
    if (time - this.lastUpdate > this.speed) {
      this.lastUpdate = time;
      this.direction = this.nextDirection;
      
      // Calculate head next position
      const head = { ...this.snake[0] };
      if (this.direction === 'UP') head.y--;
      else if (this.direction === 'DOWN') head.y++;
      else if (this.direction === 'LEFT') head.x--;
      else if (this.direction === 'RIGHT') head.x++;
      
      // Check border collision
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
        this.triggerGameOver();
        return;
      }
      
      // Check self bite collision
      const selfCollide = this.snake.some(cell => cell.x === head.x && cell.y === head.y);
      if (selfCollide) {
        this.triggerGameOver();
        return;
      }
      
      // Move head in
      this.snake.unshift(head);
      
      // Food collision check
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += 150;
        this.speed = Math.max(50, 100 - Math.floor(this.score / 1500) * 5); // accelerate gradually
        if (this.callbacks.onScore) this.callbacks.onScore(this.score);
        if (this.callbacks.playSound) this.callbacks.playSound('levelup'); // eat chime
        this.generateFood();
      } else {
        // Pop tail out if food not eaten
        this.snake.pop();
      }
    }
  }
  
  draw() {
    // Clear screen
    this.ctx.fillStyle = '#050508';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw subtle grid mesh
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    this.ctx.lineWidth = 1;
    for (let c = 0; c < this.cols; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * this.gridSize, 0);
      this.ctx.lineTo(c * this.gridSize, this.height);
      this.ctx.stroke();
    }
    for (let r = 0; r < this.rows; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * this.gridSize);
      this.ctx.lineTo(this.width, r * this.gridSize);
      this.ctx.stroke();
    }
    
    // Draw Neon Food item (glowing round block)
    this.ctx.shadowBlur = 12;
    this.ctx.shadowColor = 'var(--neon-pink)';
    this.ctx.fillStyle = 'var(--neon-pink)';
    this.ctx.fillRect(
      this.food.x * this.gridSize + 2,
      this.food.y * this.gridSize + 2,
      this.gridSize - 4,
      this.gridSize - 4
    );
    
    // Draw Neon Snake Body
    this.snake.forEach((cell, idx) => {
      // Color gradient from cyan head to purple tail
      if (idx === 0) {
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'var(--neon-cyan)';
        this.ctx.fillStyle = 'var(--neon-cyan)';
      } else {
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = 'var(--neon-purple)';
        this.ctx.fillStyle = 'var(--neon-purple)';
      }
      
      this.ctx.fillRect(
        cell.x * this.gridSize + 1,
        cell.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
      
      // Draw pixel highlight inside block
      if (idx === 0) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(
          cell.x * this.gridSize + 5,
          cell.y * this.gridSize + 5,
          4,
          4
        );
      }
    });
    
    this.ctx.shadowBlur = 0; // reset
    
    // HUD overlay scoreboard
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '10px "Press Start 2P"';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 15, 25);
    this.ctx.textAlign = 'right';
    this.ctx.fillText('NEON SNAKE', this.width - 15, 25);
    
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      
      this.ctx.font = '22px "Press Start 2P"';
      this.ctx.fillStyle = '#ff007f';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ff007f';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('FIM DE JOGO', this.width / 2, this.height / 2 - 20);
      
      this.ctx.font = '12px "Press Start 2P"';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(`SCORE: ${this.score}`, this.width / 2, this.height / 2 + 20);
      this.ctx.fillText('PRESSIONE START', this.width / 2, this.height / 2 + 50);
      this.ctx.fillText('PARA REINICIAR', this.width / 2, this.height / 2 + 75);
    }
  }
  
  triggerGameOver() {
    this.gameOver = true;
    if (this.callbacks.playSound) this.callbacks.playSound('gameover');
    if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.score);
  }
  
  loop(time) {
    if (!this.active) return;
    this.update(time);
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}
