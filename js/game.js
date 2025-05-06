import { Ball } from './ball.js';
import { Paddle } from './paddle.js';
import { AI } from './ai.js';
import { Score } from './score.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.isPaused = false;
    this.winScore = 30;
    this.isTwoPlayerMode = false;
    
    this.resize();
    
    this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2);
    this.playerPaddle = new Paddle(30, this.canvas.height / 2 - 40, 10, 80);
    this.aiPaddle = new Paddle(this.canvas.width - 30 - 10, this.canvas.height / 2 - 40, 10, 80);
    this.ai = new AI(this.aiPaddle, this.ball);
    this.score = new Score();
    
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleKeyup = this.handleKeyup.bind(this);
    this.resize = this.resize.bind(this);
    
    window.addEventListener('keydown', this.handleKeydown);
    window.addEventListener('keyup', this.handleKeyup);
    window.addEventListener('resize', this.resize);

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      w: false,
      s: false
    };
  }
  
  setTwoPlayerMode(enabled) {
    this.isTwoPlayerMode = enabled;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop);
    }
  }
  
  reset() {
    this.score.reset();
    this.ball.reset(this.canvas.width / 2, this.canvas.height / 2);
    this.playerPaddle.y = this.canvas.height / 2 - this.playerPaddle.height / 2;
    this.aiPaddle.y = this.canvas.height / 2 - this.aiPaddle.height / 2;
    this.updateScore();
  }
  
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
      document.getElementById('pause-menu').classList.remove('hidden');
    }
  }
  
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
      requestAnimationFrame(this.gameLoop);
    }
  }
  
  gameLoop(timestamp) {
    if (!this.isRunning) return;
    if (this.isPaused) return;
    
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop);
  }
  
  update(deltaTime) {
    if (this.keys.ArrowUp) this.playerPaddle.moveUp();
    if (this.keys.ArrowDown) this.playerPaddle.moveDown();
    
    if (this.isTwoPlayerMode) {
      if (this.keys.w) this.aiPaddle.moveUp();
      if (this.keys.s) this.aiPaddle.moveDown();
    } else {
      this.ai.update(deltaTime);
    }
    
    this.ball.update(deltaTime);
    this.checkCollisions();
    
    if (this.ball.x < 0) {
      this.score.aiScore++;
      this.updateScore();
      this.ball.reset(this.canvas.width / 2, this.canvas.height / 2);
      this.ball.velocityX = -this.ball.velocityX;
      this.checkGameEnd();
      this.checkDynamicDifficulty();
    } else if (this.ball.x > this.canvas.width) {
      this.score.playerScore++;
      this.updateScore();
      this.ball.reset(this.canvas.width / 2, this.canvas.height / 2);
      this.checkGameEnd();
      this.checkDynamicDifficulty();
    }
  }

  checkDynamicDifficulty() {
    if (!this.isTwoPlayerMode && (this.score.playerScore === 10 || this.score.aiScore === 10)) {
      this.ai.enableDynamicDifficulty();
    }
  }
  
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.beginPath();
    this.ctx.setLineDash([10, 15]);
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    this.ball.render(this.ctx);
    this.playerPaddle.render(this.ctx);
    this.aiPaddle.render(this.ctx);
  }
  
  handleKeydown(e) {
    this.keys[e.key.toLowerCase()] = true;
    
    if (e.key === 'Escape' && this.isRunning) {
      if (this.isPaused) {
        document.getElementById('pause-menu').classList.add('hidden');
        this.resume();
      } else {
        this.pause();
      }
    }
  }

  handleKeyup(e) {
    this.keys[e.key.toLowerCase()] = false;
  }
  
  resize() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    
    if (this.ball) {
      this.ball.reset(this.canvas.width / 2, this.canvas.height / 2);
      this.playerPaddle.x = 30;
      this.aiPaddle.x = this.canvas.width - 30 - this.aiPaddle.width;
    }
  }
  
  checkCollisions() {
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.velocityY = -this.ball.velocityY;
      this.playWallHitSound();
    } else if (this.ball.y + this.ball.radius > this.canvas.height) {
      this.ball.y = this.canvas.height - this.ball.radius;
      this.ball.velocityY = -this.ball.velocityY;
      this.playWallHitSound();
    }
    
    if (
      this.ball.x - this.ball.radius < this.playerPaddle.x + this.playerPaddle.width &&
      this.ball.x + this.ball.radius > this.playerPaddle.x &&
      this.ball.y + this.ball.radius > this.playerPaddle.y &&
      this.ball.y - this.ball.radius < this.playerPaddle.y + this.playerPaddle.height
    ) {
      const collidePoint = (this.ball.y - (this.playerPaddle.y + this.playerPaddle.height / 2)) / (this.playerPaddle.height / 2);
      const angle = collidePoint * Math.PI / 4;
      
      const direction = 1;
      this.ball.velocityX = direction * this.ball.speed * Math.cos(angle);
      this.ball.velocityY = this.ball.speed * Math.sin(angle);
      
      this.ball.speed += 20;
      
      this.ball.x = this.playerPaddle.x + this.playerPaddle.width + this.ball.radius;
      
      this.playPaddleHitSound();
    }
    
    if (
      this.ball.x + this.ball.radius > this.aiPaddle.x &&
      this.ball.x - this.ball.radius < this.aiPaddle.x + this.aiPaddle.width &&
      this.ball.y + this.ball.radius > this.aiPaddle.y &&
      this.ball.y - this.ball.radius < this.aiPaddle.y + this.aiPaddle.height
    ) {
      const collidePoint = (this.ball.y - (this.aiPaddle.y + this.aiPaddle.height / 2)) / (this.aiPaddle.height / 2);
      const angle = collidePoint * Math.PI / 4;
      
      const direction = -1;
      this.ball.velocityX = direction * this.ball.speed * Math.cos(angle);
      this.ball.velocityY = this.ball.speed * Math.sin(angle);
      
      this.ball.speed += 20;
      
      this.ball.x = this.aiPaddle.x - this.ball.radius;
      
      this.playPaddleHitSound();
    }
  }
  
  updateScore() {
    document.getElementById('player-score').innerText = this.score.playerScore;
    document.getElementById('ai-score').innerText = this.score.aiScore;
  }
  
  checkGameEnd() {
    if (this.score.playerScore >= this.winScore || this.score.aiScore >= this.winScore) {
      this.isRunning = false;
      const gameEndElement = document.getElementById('game-end');
      const winnerTextElement = document.getElementById('winner-text');
      
      if (this.score.playerScore >= this.winScore) {
        winnerTextElement.innerText = this.isTwoPlayerMode ? 'Player 1 Wins!' : 'You Win!';
      } else {
        winnerTextElement.innerText = this.isTwoPlayerMode ? 'Player 2 Wins!' : 'Computer Wins!';
      }
      
      gameEndElement.classList.remove('hidden');
    }
  }
  
  playPaddleHitSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 600;
      gainNode.gain.value = 0.1;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 50);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }
  
  playWallHitSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 300;
      gainNode.gain.value = 0.05;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 30);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }
}